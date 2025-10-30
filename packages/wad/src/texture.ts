/**
 * DOOM Composite Texture Parser
 * Parses TEXTURE1 and TEXTURE2 lumps which define composite wall textures
 */

import type { WadFile, WadLump } from './types';
import { findLump } from './utils';
import { decodePicture } from './picture';
import { pictureToImageData } from './image-converter';

/**
 * A patch reference in a composite texture
 */
export interface TexturePatch {
  /** X offset of the patch */
  originX: number;
  /** Y offset of the patch */
  originY: number;
  /** Index into PNAMES lump */
  patchIndex: number;
}

/**
 * A composite texture definition
 */
export interface TextureDefinition {
  /** Name of the texture (8 characters max) */
  name: string;
  /** Width of the texture */
  width: number;
  /** Height of the texture */
  height: number;
  /** List of patches that make up this texture */
  patches: TexturePatch[];
}

/**
 * Parse PNAMES lump to get patch names
 */
export function parsePNames(wad: WadFile): string[] {
  const pnamesLump = findLump(wad, 'PNAMES');
  if (!pnamesLump) {
    console.warn('PNAMES lump not found');
    return [];
  }

  const data = new DataView(pnamesLump.data);
  const count = data.getInt32(0, true);
  const names: string[] = [];

  for (let i = 0; i < count; i++) {
    const offset = 4 + i * 8;
    const nameBytes = new Uint8Array(pnamesLump.data, offset, 8);

    // Find null terminator
    let length = 0;
    while (length < 8 && nameBytes[length] !== 0) {
      length++;
    }

    const name = String.fromCharCode(...Array.from(nameBytes.slice(0, length)));
    names.push(name);
  }

  return names;
}

/**
 * Parse TEXTURE1 or TEXTURE2 lump
 */
export function parseTextureLump(lump: WadLump): TextureDefinition[] {
  const data = new DataView(lump.data);
  const numTextures = data.getInt32(0, true);
  const textures: TextureDefinition[] = [];

  // Read texture offsets
  const offsets: number[] = [];
  for (let i = 0; i < numTextures; i++) {
    offsets.push(data.getInt32(4 + i * 4, true));
  }

  // Parse each texture
  for (const offset of offsets) {
    // Read texture name (8 bytes)
    const nameBytes = new Uint8Array(lump.data, offset, 8);
    let nameLength = 0;
    while (nameLength < 8 && nameBytes[nameLength] !== 0) {
      nameLength++;
    }
    const name = String.fromCharCode(...Array.from(nameBytes.slice(0, nameLength)));

    // Skip masked (2 bytes, unused)
    const width = data.getInt16(offset + 12, true);
    const height = data.getInt16(offset + 14, true);
    // Skip columndirectory (4 bytes, unused)
    const patchCount = data.getInt16(offset + 20, true);

    // Read patches
    const patches: TexturePatch[] = [];
    for (let i = 0; i < patchCount; i++) {
      const patchOffset = offset + 22 + i * 10;
      patches.push({
        originX: data.getInt16(patchOffset, true),
        originY: data.getInt16(patchOffset + 2, true),
        patchIndex: data.getInt16(patchOffset + 4, true),
        // stepdir and colormap are unused
      });
    }

    textures.push({ name, width, height, patches });
  }

  return textures;
}

/**
 * Parse all composite textures from WAD
 */
export function parseTextures(wad: WadFile): Map<string, TextureDefinition> {
  const textureMap = new Map<string, TextureDefinition>();

  // Parse TEXTURE1
  const texture1Lump = findLump(wad, 'TEXTURE1');
  if (texture1Lump) {
    const textures = parseTextureLump(texture1Lump);
    for (const texture of textures) {
      textureMap.set(texture.name, texture);
    }
    console.log(`Parsed ${textures.length} textures from TEXTURE1`);
  }

  // Parse TEXTURE2 (DOOM II)
  const texture2Lump = findLump(wad, 'TEXTURE2');
  if (texture2Lump) {
    const textures = parseTextureLump(texture2Lump);
    for (const texture of textures) {
      textureMap.set(texture.name, texture);
    }
    console.log(`Parsed ${textures.length} textures from TEXTURE2`);
  }

  return textureMap;
}

/**
 * Build a composite texture from its definition
 */
export function buildCompositeTexture(
  definition: TextureDefinition,
  patchNames: string[],
  wad: WadFile,
  palette: [number, number, number][]
): ImageData | null {
  // Create canvas for the composite texture
  const canvas = document.createElement('canvas');
  canvas.width = definition.width;
  canvas.height = definition.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    console.error('Failed to create canvas context');
    return null;
  }

  // Clear with transparent background
  ctx.clearRect(0, 0, definition.width, definition.height);

  // Render each patch
  for (const patch of definition.patches) {
    const patchName = patchNames[patch.patchIndex];
    if (!patchName) {
      console.warn(`Patch index ${patch.patchIndex} not found in PNAMES`);
      continue;
    }

    const patchLump = findLump(wad, patchName);
    if (!patchLump) {
      console.warn(`Patch ${patchName} not found in WAD`);
      continue;
    }

    try {
      // Decode the patch
      const picture = decodePicture(patchLump.data);
      const imageData = pictureToImageData(picture, {
        palette,
        backgroundColor: [0, 0, 0, 0], // Transparent
      });

      // Create temporary canvas for the patch
      const patchCanvas = document.createElement('canvas');
      patchCanvas.width = imageData.width;
      patchCanvas.height = imageData.height;
      const patchCtx = patchCanvas.getContext('2d');

      if (patchCtx) {
        patchCtx.putImageData(imageData, 0, 0);

        // Draw patch at its offset position
        ctx.drawImage(patchCanvas, patch.originX, patch.originY);
      }
    } catch (error) {
      console.warn(`Failed to decode patch ${patchName}:`, error);
    }
  }

  // Get the final composite image data
  return ctx.getImageData(0, 0, definition.width, definition.height);
}

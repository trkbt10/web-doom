/**
 * Texture Extractor
 *
 * Extract textures from WAD files and convert to PNG format
 */

import type { WadFile, WadLump } from '@web-doom/wad';
import {
  decodePicture,
  pictureToCanvas,
  parsePaletteFromPLAYPAL,
  DEFAULT_DOOM_PALETTE,
  findLump,
  DoomPicture
} from '@web-doom/wad';
import type { ExtractedTexture, TextureCategory } from '../core/types';
import { TextureCategory as Category } from '../core/types';

/**
 * Determine texture category from lump name
 */
export function determineCategory(lumpName: string): TextureCategory {
  const name = lumpName.toUpperCase();

  // Sprites - common prefixes
  const spritePatterns = [
    'TROO', 'SHTG', 'PUNG', 'PISG', 'PISF', 'SHTF', 'SHT2',
    'CHGG', 'CHGF', 'MISG', 'MISF', 'SAWG', 'PLSG', 'PLSF',
    'BFGG', 'BFGF', 'BLUD', 'PUFF', 'BAL1', 'BAL2', 'PLSS',
    'PLSE', 'MISL', 'BFS1', 'BFE1', 'BFE2', 'PLAY', 'POSS',
    'SPOS', 'VILE', 'FIRE', 'FATB', 'FBXP', 'SKEL', 'MANF',
    'FATT', 'CPOS', 'SARG', 'HEAD', 'BAL7', 'BOSS', 'BOS2',
    'SKUL', 'SPID', 'BSPI', 'APLS', 'APBX', 'CYBR', 'PAIN',
    'SSWV', 'KEEN', 'BBRN', 'BOSF', 'ARM1', 'ARM2', 'BON1',
    'BON2', 'BKEY', 'RKEY', 'YKEY', 'BSKU', 'RSKU', 'YSKU',
    'STIM', 'MEDI', 'SOUL', 'PINV', 'PSTR', 'PINS', 'MEGA',
    'SUIT', 'PMAP', 'PVIS', 'CLIP', 'AMMO', 'ROCK', 'BROK',
    'CELL', 'CELP', 'SHEL', 'SBOX', 'BPAK', 'BFUG', 'MGUN',
    'CSAW', 'LAUN', 'PLAS', 'SHOT', 'SGN2', 'COLU', 'SMT2',
    'GOR1', 'POL2', 'POL5', 'POL4', 'POL3', 'POL1', 'POL6',
    'GOR2', 'GOR3', 'GOR4', 'GOR5', 'SMIT', 'COL1', 'COL2',
    'COL3', 'COL4', 'COL5', 'COL6', 'TRE1', 'TRE2', 'ELEC',
    'CEYE', 'FCAN', 'CAND', 'CBRA', 'FSKU', 'TREE', 'SMBT',
    'SMGT', 'SMRT', 'HDB1', 'HDB2', 'HDB3', 'HDB4', 'HDB5',
    'HDB6', 'POB1', 'POB2', 'BRS1', 'TLMP', 'TLP2'
  ];

  for (const pattern of spritePatterns) {
    if (name.startsWith(pattern)) {
      return Category.SPRITE;
    }
  }

  // HUD graphics
  if (name.startsWith('ST')) {
    return Category.HUD;
  }

  // Menu graphics
  if (name.startsWith('M_')) {
    return Category.MENU;
  }

  // Patches (usually between P_START and P_END)
  if (name.startsWith('WALL') || name.startsWith('DOOR') ||
      name.startsWith('STEP') || name.startsWith('SW') ||
      name.startsWith('GSTONE') || name.startsWith('ROCK')) {
    return Category.WALL;
  }

  return Category.OTHER;
}

/**
 * Check if lump is likely a picture format
 */
export function isPictureLump(lump: WadLump): boolean {
  // Pictures must have at least header (8 bytes) + some data
  if (lump.size < 16) {
    return false;
  }

  try {
    // Try to decode header
    const view = new DataView(lump.data);
    const width = view.getInt16(0, true);
    const height = view.getInt16(2, true);

    // Sanity check dimensions
    if (width <= 0 || height <= 0 || width > 4096 || height > 4096) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Convert picture to base64 PNG data URL
 * Note: This function works in both browser and Node.js environments
 */
export function pictureToBase64PNG(picture: DoomPicture, palette: [number, number, number][]): string {
  // Check if running in browser environment
  if (typeof document !== 'undefined' && typeof HTMLCanvasElement !== 'undefined') {
    try {
      const canvas = pictureToCanvas(picture, { palette });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.warn('Failed to convert picture to PNG:', error);
      return 'data:image/png;base64,';
    }
  }

  // Node.js environment with canvas package
  try {
    // Dynamic import for Node.js canvas package
    const canvasModule = require('canvas');
    const { createCanvas } = canvasModule;

    const width = picture.header.width;
    const height = picture.header.height;

    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Create ImageData manually since canvas package doesn't have ImageData constructor
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // Fill image data
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const paletteIndex = picture.pixels[y][x];
        const pixelIndex = (y * width + x) * 4;

        if (paletteIndex === null || paletteIndex === undefined) {
          // Transparent pixel
          data[pixelIndex] = 0;
          data[pixelIndex + 1] = 0;
          data[pixelIndex + 2] = 0;
          data[pixelIndex + 3] = 0;
        } else {
          // Get color from palette
          const color = palette[paletteIndex] || [255, 0, 255];
          data[pixelIndex] = color[0];
          data[pixelIndex + 1] = color[1];
          data[pixelIndex + 2] = color[2];
          data[pixelIndex + 3] = 255;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Convert to data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.warn('Canvas package not available. Install with: bun add canvas');
    console.warn('Error:', error);
    return 'data:image/png;base64,';
  }
}

/**
 * Extract all textures from WAD file
 */
export function extractTextures(wad: WadFile): ExtractedTexture[] {
  const textures: ExtractedTexture[] = [];

  // Get palette if available
  const playpalLump = findLump(wad, 'PLAYPAL');
  const palette = playpalLump
    ? parsePaletteFromPLAYPAL(playpalLump.data)
    : DEFAULT_DOOM_PALETTE;

  // Process each lump
  for (const lump of wad.lumps) {
    // Skip empty lumps
    if (lump.size === 0) {
      continue;
    }

    // Check if it's a picture
    if (!isPictureLump(lump)) {
      continue;
    }

    try {
      const picture = decodePicture(lump.data);
      const imageData = pictureToBase64PNG(picture, palette);

      // Skip if conversion failed
      if (!imageData) {
        continue;
      }

      const category = determineCategory(lump.name);

      textures.push({
        name: lump.name,
        imageData,
        width: picture.header.width,
        height: picture.header.height,
        category,
      });
    } catch (error) {
      // Skip lumps that fail to decode
      console.debug(`Failed to decode ${lump.name}:`, error);
    }
  }

  return textures;
}

/**
 * Extract textures by category
 */
export function extractTexturesByCategory(
  wad: WadFile,
  category: TextureCategory
): ExtractedTexture[] {
  const allTextures = extractTextures(wad);
  return allTextures.filter(tex => tex.category === category);
}

/**
 * Extract specific textures by name pattern
 */
export function extractTexturesByPattern(
  wad: WadFile,
  pattern: RegExp
): ExtractedTexture[] {
  const allTextures = extractTextures(wad);
  return allTextures.filter(tex => pattern.test(tex.name));
}

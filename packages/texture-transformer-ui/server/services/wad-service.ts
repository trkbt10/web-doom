import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';
import {
  decode,
  encode,
  type WadFile,
  parsePaletteFromPLAYPAL,
  findLump,
  replaceLump,
  isValidTextureLump,
  createPicture,
  encodePicture,
  DEFAULT_DOOM_PALETTE,
} from '@web-doom/wad';
import {
  extractTextures,
  createSemanticGroups,
  type TextureGroup,
} from '@web-doom/texture-transformer';
import {
  saveOriginalTexture,
  saveTextureMetadata,
  updateProject,
  type TextureMetadata,
  getProject,
} from './project-manager';

export interface WADInfo {
  filename: string;
  size: number;
  lumpCount: number;
  textureCount: number;
}

/**
 * Find closest palette index for given RGB color
 */
function findClosestPaletteIndex(
  r: number,
  g: number,
  b: number,
  palette: [number, number, number][]
): number {
  let minDistance = Infinity;
  let closestIndex = 0;

  for (let i = 0; i < palette.length; i++) {
    const [pr, pg, pb] = palette[i];
    const distance =
      Math.pow(r - pr, 2) + Math.pow(g - pg, 2) + Math.pow(b - pb, 2);

    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = i;
    }
  }

  return closestIndex;
}

/**
 * Convert PNG buffer to DOOM picture lump (backend version using Sharp)
 */
async function pngBufferToPictureLump(
  pngBuffer: Buffer,
  targetWidth: number,
  targetHeight: number,
  palette: [number, number, number][] = DEFAULT_DOOM_PALETTE,
  transparencyThreshold: number = 128
): Promise<ArrayBuffer> {
  // Use Sharp to resize and get raw pixel data
  const { data, info } = await sharp(pngBuffer)
    .resize(targetWidth, targetHeight, {
      fit: 'fill',
      kernel: 'nearest', // Use nearest neighbor for pixel art
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;

  console.log(`    🖼️  Image dimensions: ${width}x${height} (target: ${targetWidth}x${targetHeight}), channels: ${channels}`);

  // Convert to 2D pixel array
  const pixels: (number | null)[][] = [];
  let transparentPixels = 0;
  let opaquePixels = 0;

  for (let y = 0; y < height; y++) {
    pixels[y] = [];
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * channels;
      const r = data[pixelIndex];
      const g = data[pixelIndex + 1];
      const b = data[pixelIndex + 2];
      const a = channels >= 4 ? data[pixelIndex + 3] : 255;

      if (a < transparencyThreshold) {
        pixels[y][x] = null; // Transparent
        transparentPixels++;
      } else {
        pixels[y][x] = findClosestPaletteIndex(r, g, b, palette);
        opaquePixels++;
      }
    }
  }

  console.log(`    🎨 Pixels: ${opaquePixels} opaque, ${transparentPixels} transparent`);

  // Create DOOM picture and encode
  const picture = createPicture(pixels, 0, 0);
  console.log(`    📏 Picture header: ${picture.header.width}x${picture.header.height}, ` +
    `offset: (${picture.header.leftOffset}, ${picture.header.topOffset})`);
  console.log(`    📊 Columns: ${picture.columns.length}, ` +
    `posts in first column: ${picture.columns[0]?.length || 0}`);

  const encoded = encodePicture(picture);
  console.log(`    💾 Encoded size: ${encoded.byteLength} bytes`);

  // Verify the encoded data
  const view = new DataView(encoded);
  const encodedWidth = view.getInt16(0, true);
  const encodedHeight = view.getInt16(2, true);
  console.log(`    ✅ Verification: ${encodedWidth}x${encodedHeight}`);

  return encoded;
}

/**
 * Load and analyze a WAD file
 */
export async function loadWAD(wadPath: string): Promise<{ wad: WadFile; info: WADInfo }> {
  const buffer = await readFile(wadPath);
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
  const wad = decode(arrayBuffer);

  const textures = extractTextures(wad);

  const info: WADInfo = {
    filename: wadPath.split('/').pop() || wadPath,
    size: buffer.length,
    lumpCount: wad.directory.length,
    textureCount: textures.length,
  };

  return { wad, info };
}

/**
 * Extract textures from WAD and save to project
 */
export async function extractAndSaveTextures(
  projectId: string,
  wadPath: string
): Promise<{ groups: Map<string, TextureGroup>; total: number }> {
  const { wad } = await loadWAD(wadPath);
  const textures = extractTextures(wad);
  const groups = createSemanticGroups(textures);

  let total = 0;

  // Save all textures
  for (const texture of textures) {
    // Save original image
    await saveOriginalTexture(projectId, texture.name, texture.imageData);

    // Save metadata with original dimensions
    const metadata: TextureMetadata = {
      name: texture.name,
      category: texture.category,
      width: texture.width,
      height: texture.height,
      originalBase64: texture.imageData,
      confirmed: false,
      transformHistory: [],
    };
    await saveTextureMetadata(projectId, texture.name, metadata);

    total++;
  }

  // Update project metadata
  await updateProject(projectId, {
    textureCount: total,
    transformedCount: 0,
  });

  return { groups, total };
}

/**
 * Get texture catalog with grouping
 */
export async function getTextureCatalog(wadPath: string): Promise<{
  groups: Map<string, TextureGroup>;
  total: number;
  categories: Record<string, number>;
}> {
  const { wad } = await loadWAD(wadPath);
  const textures = extractTextures(wad);
  const groups = createSemanticGroups(textures);

  // Count by category
  const categories: Record<string, number> = {};
  for (const texture of textures) {
    categories[texture.category] = (categories[texture.category] || 0) + 1;
  }

  return {
    groups,
    total: textures.length,
    categories,
  };
}

/**
 * Recompile WAD with transformed textures from a project
 */
export async function recompileProjectWAD(
  projectId: string,
  outputPath: string
): Promise<{ success: boolean; replacedCount: number; error?: string }> {
  try {
    const project = await getProject(projectId);
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    // Load original WAD
    const buffer = await readFile(project.wadFile);
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
    let wad = decode(arrayBuffer);

    // Get palette from WAD
    const playpalLump = findLump(wad, 'PLAYPAL');
    if (!playpalLump) {
      throw new Error('PLAYPAL lump not found in WAD');
    }
    const palette = parsePaletteFromPLAYPAL(playpalLump.data);

    // Get all transformed textures
    const transformedDir = join(process.cwd(), 'data', projectId, 'transformed');

    // Check if transformed directory exists and has files
    if (!existsSync(transformedDir)) {
      console.warn(`⚠️  No transformed directory found: ${transformedDir}`);
      console.warn(`⚠️  WAD will be identical to original`);
      // Still encode and save the original WAD
      const output = encode(wad);
      const outputBuffer = Buffer.from(output);
      await writeFile(outputPath, outputBuffer);
      return { success: true, replacedCount: 0 };
    }

    const transformedFiles = await readdir(transformedDir);
    console.log(`\n📁 Found ${transformedFiles.length} files in transformed directory`);

    let replacedCount = 0;

    // Replace each transformed texture
    for (const file of transformedFiles) {
      if (!file.endsWith('.png')) continue;

      const textureName = file.replace('.png', '');

      // Skip non-picture lumps (DEMO files, map data, etc.)
      if (!isValidTextureLump(textureName)) {
        console.warn(`Skipping non-texture lump: ${textureName}`);
        continue;
      }

      const pngPath = join(transformedDir, file);

      try {
        console.log(`  🔄 Processing: ${textureName}`);

        // Get original dimensions from WAD lump
        const originalLump = findLump(wad, textureName);
        if (!originalLump) {
          console.warn(`    ⚠️  Original lump not found in WAD: ${textureName}, skipping`);
          continue;
        }

        // Read dimensions from DOOM picture header (first 4 bytes)
        const view = new DataView(originalLump.data);
        const originalWidth = view.getInt16(0, true);
        const originalHeight = view.getInt16(2, true);
        console.log(`    📐 Original dimensions: ${originalWidth}x${originalHeight}`);

        // Read PNG file
        const pngBuffer = await readFile(pngPath);
        console.log(`    📄 Read PNG file: ${pngBuffer.length} bytes`);

        // Convert PNG to DOOM picture format using Sharp with original dimensions
        const pictureLumpData = await pngBufferToPictureLump(
          pngBuffer,
          originalWidth,
          originalHeight,
          palette
        );
        console.log(`    🎨 Converted to DOOM format: ${pictureLumpData.byteLength} bytes`);

        // Replace lump in WAD
        const lumpData = new Uint8Array(pictureLumpData);
        wad = replaceLump(wad, textureName, lumpData.buffer);
        console.log(`    ✅ Replaced lump: ${textureName}`);
        replacedCount++;
      } catch (error) {
        console.error(`    ❌ Failed to convert texture ${textureName}:`, error);
        throw new Error(`Failed to convert texture ${textureName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Encode and save WAD
    console.log(`\n📦 Encoding WAD file...`);
    const output = encode(wad);
    const outputBuffer = Buffer.from(output);
    console.log(`   WAD size: ${outputBuffer.length} bytes`);

    await writeFile(outputPath, outputBuffer);
    console.log(`   💾 Saved to: ${outputPath}`);
    console.log(`\n✅ Successfully replaced ${replacedCount} textures\n`);

    return { success: true, replacedCount };
  } catch (error) {
    console.error('Recompile error:', error);
    return {
      success: false,
      replacedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Recompile WAD with specific texture replacements
 */
export async function recompileWAD(
  originalWadPath: string,
  textureReplacements: Map<string, string>, // texture name -> PNG file path
  outputPath: string
): Promise<{ success: boolean; replacedCount: number; error?: string }> {
  try {
    // Load original WAD
    const buffer = await readFile(originalWadPath);
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
    let wad = decode(arrayBuffer);

    // Get palette from WAD
    const playpalLump = findLump(wad, 'PLAYPAL');
    if (!playpalLump) {
      throw new Error('PLAYPAL lump not found in WAD');
    }
    const wadPalette = parsePaletteFromPLAYPAL(playpalLump.data);

    let replacedCount = 0;

    // Replace each texture
    for (const [textureName, pngPath] of textureReplacements.entries()) {
      // Skip non-picture lumps (DEMO files, map data, etc.)
      if (!isValidTextureLump(textureName)) {
        console.warn(`Skipping non-texture lump: ${textureName}`);
        continue;
      }

      try {
        // Get original dimensions from WAD lump
        const originalLump = findLump(wad, textureName);
        if (!originalLump) {
          console.warn(`Original lump not found: ${textureName}, skipping`);
          continue;
        }

        // Read dimensions from DOOM picture header (first 4 bytes)
        const view = new DataView(originalLump.data);
        const originalWidth = view.getInt16(0, true);
        const originalHeight = view.getInt16(2, true);
        console.log(`  📐 ${textureName}: ${originalWidth}x${originalHeight}`);

        // Read PNG file
        const pngBuffer = await readFile(pngPath);

        // Convert PNG to DOOM picture format using Sharp with original dimensions
        const pictureLumpData = await pngBufferToPictureLump(
          pngBuffer,
          originalWidth,
          originalHeight,
          wadPalette
        );

        // Replace lump in WAD
        const lumpData = new Uint8Array(pictureLumpData);
        wad = replaceLump(wad, textureName, lumpData.buffer);
        replacedCount++;
      } catch (error) {
        console.error(`Failed to convert texture ${textureName}:`, error);
        throw new Error(`Failed to convert texture ${textureName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Encode and save WAD
    const output = encode(wad);
    const outputBuffer = Buffer.from(output);
    await writeFile(outputPath, outputBuffer);

    return { success: true, replacedCount };
  } catch (error) {
    console.error('Recompile error:', error);
    return {
      success: false,
      replacedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

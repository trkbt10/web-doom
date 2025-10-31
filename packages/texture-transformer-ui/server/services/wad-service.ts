import { readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';
import {
  decode,
  encode,
  type WadFile,
  pngFileToPictureLump,
  parsePaletteFromPLAYPAL,
  findLump,
  replaceLump,
  isValidTextureLump,
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

    // Save metadata
    const metadata: TextureMetadata = {
      name: texture.name,
      category: texture.category,
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
    const transformedFiles = await readdir(transformedDir);

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
        // Read PNG file and convert to File object
        const pngBuffer = await readFile(pngPath);
        const pngFile = new File([pngBuffer], file, { type: 'image/png' });

        // Convert PNG to DOOM picture format
        const pictureLumpData = await pngFileToPictureLump(pngFile, { palette });

        // Replace lump in WAD
        const lumpData = new Uint8Array(pictureLumpData);
        wad = replaceLump(wad, textureName, lumpData.buffer);
        replacedCount++;
      } catch (error) {
        console.warn(`Failed to convert texture ${textureName}:`, error);
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
        // Read PNG file and convert to File object
        const pngBuffer = await readFile(pngPath);
        const pngFile = new File([pngBuffer], pngPath.split('/').pop() || textureName, {
          type: 'image/png',
        });

        // Convert PNG to DOOM picture format
        const pictureLumpData = await pngFileToPictureLump(pngFile, { palette: wadPalette });

        // Replace lump in WAD
        const lumpData = new Uint8Array(pictureLumpData);
        wad = replaceLump(wad, textureName, lumpData.buffer);
        replacedCount++;
      } catch (error) {
        console.warn(`Failed to convert texture ${textureName}:`, error);
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

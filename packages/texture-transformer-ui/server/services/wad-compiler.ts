/**
 * WAD Compiler Service
 * Compiles textures back into a WAD file
 * Uses transformed textures if available, otherwise uses originals
 *
 * @deprecated This module is deprecated. Use recompileProjectWAD from wad-service.ts instead.
 * The compileWAD function does not properly convert images to DOOM picture format,
 * resulting in invalid WAD files that cannot be loaded by DOOM engines.
 */

import { readFile, readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { encode, type WadLump } from '@web-doom/wad';

const DATA_ROOT = join(process.cwd(), 'data');

interface TextureMetadata {
  name: string;
  originalBase64?: string;
  transformedBase64?: string;
  width: number;
  height: number;
  category: string;
}

/**
 * Compile WAD file from project textures
 * Uses transformed textures if available, otherwise uses originals
 */
export async function compileWAD(projectId: string): Promise<Buffer> {
  const projectDir = join(DATA_ROOT, projectId);
  const texturesDir = join(projectDir, 'textures');

  if (!existsSync(texturesDir)) {
    throw new Error('Textures directory not found');
  }

  // Load all texture metadata
  const textureFiles = await readdir(texturesDir);
  const textures: TextureMetadata[] = [];

  for (const file of textureFiles) {
    if (!file.endsWith('.json')) continue;

    const metadataPath = join(texturesDir, file);
    const content = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(content) as TextureMetadata;
    textures.push(metadata);
  }

  console.log(`\n📦 Compiling WAD file for project: ${projectId}`);
  console.log(`   Total textures: ${textures.length}`);

  // Create WAD lumps
  const lumps: WadLump[] = [];

  for (const texture of textures) {
    try {
      // Use transformed if available, otherwise use original
      let imageBase64 = texture.transformedBase64 || texture.originalBase64;

      if (!imageBase64) {
        console.warn(`⚠️  No image data for ${texture.name}, skipping`);
        continue;
      }

      const isTransformed = !!texture.transformedBase64;
      console.log(`${isTransformed ? '✨' : '📄'} ${texture.name} (${isTransformed ? 'transformed' : 'original'})`);

      // Convert base64 to buffer
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');

      // For now, we'll just store the raw image data
      // In a full implementation, you would convert to DOOM picture format
      lumps.push({
        name: texture.name,
        size: imageBuffer.length,
        data: imageBuffer.buffer.slice(
          imageBuffer.byteOffset,
          imageBuffer.byteOffset + imageBuffer.byteLength
        ),
        filepos: 0, // Will be calculated by encoder
      });
    } catch (error) {
      console.error(`Failed to process ${texture.name}:`, error);
    }
  }

  console.log(`\n✅ Created ${lumps.length} lumps\n`);

  // Encode to WAD format using options
  const wadBuffer = encode({ lumps }, { type: 'PWAD' });

  return Buffer.from(wadBuffer);
}

/**
 * Get compilation statistics
 * Counts actual files in transformed directory instead of metadata flags
 */
export async function getCompilationStats(projectId: string): Promise<{
  total: number;
  transformed: number;
  original: number;
}> {
  const projectDir = join(DATA_ROOT, projectId);
  const texturesDir = join(projectDir, 'textures');

  if (!existsSync(texturesDir)) {
    return { total: 0, transformed: 0, original: 0 };
  }

  const textureFiles = await readdir(texturesDir);
  let total = 0;

  for (const file of textureFiles) {
    if (file.endsWith('.json')) {
      total++;
    }
  }

  // Count actual transformed files
  const transformedDir = join(projectDir, 'transformed');
  let transformed = 0;

  if (existsSync(transformedDir)) {
    const transformedFiles = await readdir(transformedDir);
    transformed = transformedFiles.filter(f => f.endsWith('.png')).length;
  }

  const original = total - transformed;

  return { total, transformed, original };
}

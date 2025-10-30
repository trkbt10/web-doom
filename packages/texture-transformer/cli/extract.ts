#!/usr/bin/env bun
/**
 * WAD Texture Extraction CLI
 *
 * Extract textures from WAD files and generate catalog
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { decode, findLump, parsePaletteFromPLAYPAL, DEFAULT_DOOM_PALETTE } from '@web-doom/wad';
import { extractTextures } from '../src/texture-extractor';
import type { ExtractedTexture } from '../src/types';
import { TextureCategory } from '../src/types';

interface CatalogMetadata {
  wadName: string;
  extractedAt: string;
  totalTextures: number;
  categories: Record<string, number>;
}

interface CatalogData {
  metadata: CatalogMetadata;
  textures: ExtractedTexture[];
}

async function ensureDir(path: string) {
  if (!existsSync(path)) {
    await mkdir(path, { recursive: true });
  }
}

async function extractFromWad(wadPath: string, outputDir: string) {
  console.log(`Reading WAD file: ${wadPath}`);

  // Read WAD file
  const wadData = await readFile(wadPath);
  const wad = decode(wadData.buffer);

  console.log(`WAD loaded: ${wad.header.numlumps} lumps`);

  // Extract textures
  console.log('Extracting textures...');
  const textures = extractTextures(wad);

  console.log(`Extracted ${textures.length} textures`);

  // Count by category
  const categories: Record<string, number> = {};
  for (const texture of textures) {
    categories[texture.category] = (categories[texture.category] || 0) + 1;
  }

  // Create output directory
  await ensureDir(outputDir);

  // Save textures by category
  const categoryDirs: Record<string, string> = {
    [TextureCategory.SPRITE]: join(outputDir, 'sprites'),
    [TextureCategory.WALL]: join(outputDir, 'walls'),
    [TextureCategory.HUD]: join(outputDir, 'hud'),
    [TextureCategory.MENU]: join(outputDir, 'menu'),
    [TextureCategory.OTHER]: join(outputDir, 'other'),
  };

  // Create category directories
  for (const dir of Object.values(categoryDirs)) {
    await ensureDir(dir);
  }

  // Save textures
  console.log('Saving textures...');
  for (const texture of textures) {
    const categoryDir = categoryDirs[texture.category];

    // Save as PNG if we have image data
    if (texture.imageData && texture.imageData !== 'data:image/png;base64,') {
      const pngPath = join(categoryDir, `${texture.name}.png`);

      // Extract base64 data and convert to buffer
      const base64Data = texture.imageData.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      await writeFile(pngPath, buffer);
    }

    // Save metadata
    const metaPath = join(categoryDir, `${texture.name}.json`);
    await writeFile(metaPath, JSON.stringify({
      name: texture.name,
      width: texture.width,
      height: texture.height,
      category: texture.category,
    }, null, 2));
  }

  // Create catalog.json
  const wadName = wadPath.split('/').pop() || wadPath;
  const catalogData: CatalogData = {
    metadata: {
      wadName,
      extractedAt: new Date().toISOString(),
      totalTextures: textures.length,
      categories,
    },
    textures: textures.map(t => ({
      ...t,
      // Don't include full image data in catalog.json to keep file size reasonable
      imageData: t.imageData ? 'See PNG files' : undefined,
    })),
  };

  await writeFile(
    join(outputDir, 'catalog.json'),
    JSON.stringify(catalogData, null, 2)
  );

  console.log('\nExtraction complete!');
  console.log(`Output directory: ${outputDir}`);
  console.log('\nTextures by category:');
  for (const [category, count] of Object.entries(categories)) {
    console.log(`  ${category}: ${count}`);
  }
}

// Main
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: bun cli/extract.ts <wad-path> <output-dir>');
  console.error('Example: bun cli/extract.ts assets/freedoom-0.13.0/freedoom1.wad catalog/freedoom1');
  process.exit(1);
}

const [wadPath, outputDir] = args;

// Resolve paths
// wadPath is relative to the current working directory (where bun is run from)
// outputDir is relative to the package root
const packageRoot = join(import.meta.dir, '..'); // packages/texture-transformer

// If wadPath is not absolute, resolve it from current working directory
const absoluteWadPath = wadPath.startsWith('/')
  ? wadPath
  : join(process.cwd(), wadPath);

const absoluteOutputDir = join(packageRoot, outputDir);

if (!existsSync(absoluteWadPath)) {
  console.error(`WAD file not found: ${absoluteWadPath}`);
  process.exit(1);
}

extractFromWad(absoluteWadPath, absoluteOutputDir).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

#!/usr/bin/env bun
/**
 * WAD Recompilation CLI
 *
 * Recompile WAD file with modified textures from catalog
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import {
  decode,
  encode,
  replaceLump,
  findLump,
  parsePaletteFromPLAYPAL,
  DEFAULT_DOOM_PALETTE,
  encodePicture,
  pixelsToColumns,
} from '@web-doom/wad';
import type { WadFile, DoomPicture } from '@web-doom/wad';

interface RecompileOptions {
  wadPath: string;
  catalogDir: string;
  outputPath: string;
}

async function findModifiedTextures(catalogDir: string): Promise<Map<string, string>> {
  const modifiedTextures = new Map<string, string>();

  // Lumps to skip (map data, markers, etc.)
  const skipLumps = new Set([
    'THINGS', 'LINEDEFS', 'SIDEDEFS', 'VERTEXES', 'SEGS', 'SSECTORS',
    'NODES', 'SECTORS', 'REJECT', 'BLOCKMAP',
    'S_START', 'S_END', 'P_START', 'P_END', 'F_START', 'F_END',
    'SS_START', 'SS_END', 'PP_START', 'PP_END', 'FF_START', 'FF_END',
  ]);

  // Check all category directories
  const categories = ['sprites', 'walls', 'hud', 'menu', 'other'];

  for (const category of categories) {
    const categoryDir = join(catalogDir, category);

    if (!existsSync(categoryDir)) {
      continue;
    }

    const files = await readdir(categoryDir);

    // Find PNG files
    for (const file of files) {
      if (file.endsWith('.png')) {
        const textureName = file.replace(/\.png$/, '');

        // Skip map data lumps
        if (skipLumps.has(textureName.toUpperCase())) {
          continue;
        }

        const pngPath = join(categoryDir, file);
        modifiedTextures.set(textureName, pngPath);
      }
    }
  }

  return modifiedTextures;
}

/**
 * Convert PNG file to DOOM picture lump (Node.js version)
 */
async function pngFileToPictureLump(
  pngPath: string,
  palette: [number, number, number][],
  name: string
): Promise<ArrayBuffer> {
  // Use canvas package for Node.js
  const canvasModule = require('canvas');
  const { loadImage, createCanvas } = canvasModule;

  // Load PNG image
  const img = await loadImage(pngPath);

  // Create canvas
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  // Get image data
  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imageData.data;

  // Find closest palette index for each pixel
  function findClosestPaletteIndex(r: number, g: number, b: number): number {
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

  // Convert to DOOM picture format
  const width = img.width;
  const height = img.height;
  const pixels: (number | null)[][] = [];

  // Transparency threshold
  const transparencyThreshold = 128;

  for (let y = 0; y < height; y++) {
    const row: (number | null)[] = [];
    for (let x = 0; x < width; x++) {
      const pixelIndex = (y * width + x) * 4;
      const r = data[pixelIndex];
      const g = data[pixelIndex + 1];
      const b = data[pixelIndex + 2];
      const a = data[pixelIndex + 3];

      if (a < transparencyThreshold) {
        row.push(null);
      } else {
        const paletteIndex = findClosestPaletteIndex(r, g, b);
        row.push(paletteIndex);
      }
    }
    pixels.push(row);
  }

  // Convert pixels to columns
  const columns = pixelsToColumns(pixels, width, height);

  // Create DOOM picture
  const picture: DoomPicture = {
    header: {
      width,
      height,
      leftOffset: Math.floor(width / 2),
      topOffset: height - 1,
    },
    columns,
    pixels,
  };

  // Encode to lump data
  return encodePicture(picture);
}

async function recompileWad(options: RecompileOptions) {
  const { wadPath, catalogDir, outputPath } = options;

  console.log(`Reading original WAD: ${wadPath}`);

  // Read original WAD
  const wadData = await readFile(wadPath);
  let wad: WadFile = decode(wadData.buffer);

  console.log(`WAD loaded: ${wad.header.numlumps} lumps`);

  // Get palette from WAD
  const playpalLump = findLump(wad, 'PLAYPAL');
  const palette = playpalLump
    ? parsePaletteFromPLAYPAL(playpalLump.data)
    : DEFAULT_DOOM_PALETTE;

  console.log('Finding modified textures...');
  const modifiedTextures = await findModifiedTextures(catalogDir);

  console.log(`Found ${modifiedTextures.size} modified textures`);

  if (modifiedTextures.size === 0) {
    console.log('No modified textures found. Exiting.');
    return;
  }

  // Replace lumps with modified textures
  let replacedCount = 0;
  for (const [textureName, pngPath] of modifiedTextures.entries()) {
    try {
      console.log(`Processing ${textureName}...`);

      // Convert PNG to Picture lump
      const pictureLumpData = await pngFileToPictureLump(pngPath, palette, textureName);

      // Replace in WAD
      wad = replaceLump(wad, textureName, pictureLumpData);
      replacedCount++;

      console.log(`✓ Replaced ${textureName}`);
    } catch (error) {
      console.error(`✗ Failed to replace ${textureName}:`, error);
    }
  }

  if (replacedCount === 0) {
    console.log('No textures were replaced. Exiting.');
    return;
  }

  console.log(`\nEncoding modified WAD...`);

  // Encode modified WAD
  const encodedWad = encode(wad);

  console.log(`Writing to: ${outputPath}`);

  // Write to output file
  await writeFile(outputPath, new Uint8Array(encodedWad));

  console.log('\nRecompilation complete!');
  console.log(`Modified WAD saved to: ${outputPath}`);
  console.log(`Replaced ${replacedCount} textures`);
}

// Main
const args = process.argv.slice(2);

if (args.length < 3) {
  console.error('Usage: bun cli/recompile.ts <original-wad> <catalog-dir> <output-wad>');
  console.error('');
  console.error('Example:');
  console.error('  bun cli/recompile.ts \\');
  console.error('    assets/freedoom-0.13.0/freedoom1.wad \\');
  console.error('    catalog/freedoom1 \\');
  console.error('    output/freedoom1-modified.wad');
  console.error('');
  console.error('This will:');
  console.error('  1. Read the original WAD file');
  console.error('  2. Find modified PNG files in catalog directories (sprites/, walls/, etc.)');
  console.error('  3. Replace corresponding lumps in the WAD');
  console.error('  4. Save the modified WAD to the output path');
  process.exit(1);
}

const [wadPath, catalogDir, outputPath] = args;

// Resolve paths
// wadPath and outputPath are relative to current working directory
// catalogDir is relative to package root
const packageRoot = join(import.meta.dir, '..'); // packages/texture-transformer

const absoluteWadPath = wadPath.startsWith('/')
  ? wadPath
  : join(process.cwd(), wadPath);

const absoluteCatalogDir = join(packageRoot, catalogDir);

const absoluteOutputPath = outputPath.startsWith('/')
  ? outputPath
  : join(process.cwd(), outputPath);

if (!existsSync(absoluteWadPath)) {
  console.error(`Original WAD file not found: ${absoluteWadPath}`);
  process.exit(1);
}

if (!existsSync(absoluteCatalogDir)) {
  console.error(`Catalog directory not found: ${absoluteCatalogDir}`);
  process.exit(1);
}

recompileWad({
  wadPath: absoluteWadPath,
  catalogDir: absoluteCatalogDir,
  outputPath: absoluteOutputPath,
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

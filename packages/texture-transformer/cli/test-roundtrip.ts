#!/usr/bin/env bun
/**
 * Test texture roundtrip for a single texture
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import {
  decode,
  encode,
  findLump,
  replaceLump,
  decodePicture,
  encodePicture,
  pixelsToColumns,
  parsePaletteFromPLAYPAL,
  DEFAULT_DOOM_PALETTE,
} from '@web-doom/wad';
import type { DoomPicture } from '@web-doom/wad';

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: bun cli/test-roundtrip.ts <wad-path> <texture-name>');
  console.error('Example: bun cli/test-roundtrip.ts ../../assets/freedoom-0.13.0/freedoom1.wad TROOA1');
  process.exit(1);
}

const [wadPath, textureName] = args;

console.log('='.repeat(60));
console.log('Texture Roundtrip Test');
console.log('='.repeat(60));
console.log(`WAD: ${wadPath}`);
console.log(`Texture: ${textureName}`);
console.log('');

// Create test output directory
const testDir = join(import.meta.dir, '..', 'test-output');
if (!existsSync(testDir)) {
  await mkdir(testDir, { recursive: true });
}

// Step 1: Load original WAD and find texture
console.log('[1] Loading original WAD...');
const wadData = await readFile(wadPath);
const wad = decode(wadData.buffer);

const originalLump = findLump(wad, textureName);
if (!originalLump) {
  console.error(`❌ Texture ${textureName} not found`);
  process.exit(1);
}

console.log(`✓ Found texture: ${originalLump.name} (${originalLump.size} bytes)`);

// Get palette
const playpalLump = findLump(wad, 'PLAYPAL');
const palette = playpalLump
  ? parsePaletteFromPLAYPAL(playpalLump.data)
  : DEFAULT_DOOM_PALETTE;

// Step 2: Decode original picture
console.log('\n[2] Decoding original picture...');
const originalPicture = decodePicture(originalLump.data);
console.log(`✓ Width: ${originalPicture.header.width}`);
console.log(`✓ Height: ${originalPicture.header.height}`);
console.log(`✓ Columns: ${originalPicture.columns.length}`);
console.log(`✓ Offset: (${originalPicture.header.leftOffset}, ${originalPicture.header.topOffset})`);

// Step 3: Export to PNG
console.log('\n[3] Exporting to PNG...');
const canvasModule = require('canvas');
const { createCanvas } = canvasModule;

const canvas1 = createCanvas(originalPicture.header.width, originalPicture.header.height);
const ctx1 = canvas1.getContext('2d');
const imageData1 = ctx1.createImageData(originalPicture.header.width, originalPicture.header.height);
const data1 = imageData1.data;

for (let y = 0; y < originalPicture.header.height; y++) {
  for (let x = 0; x < originalPicture.header.width; x++) {
    const paletteIndex = originalPicture.pixels[y][x];
    const pixelIndex = (y * originalPicture.header.width + x) * 4;

    if (paletteIndex === null || paletteIndex === undefined) {
      data1[pixelIndex] = 0;
      data1[pixelIndex + 1] = 0;
      data1[pixelIndex + 2] = 0;
      data1[pixelIndex + 3] = 0;
    } else {
      const color = palette[paletteIndex] || [255, 0, 255];
      data1[pixelIndex] = color[0];
      data1[pixelIndex + 1] = color[1];
      data1[pixelIndex + 2] = color[2];
      data1[pixelIndex + 3] = 255;
    }
  }
}

ctx1.putImageData(imageData1, 0, 0);
const pngPath = join(testDir, `${textureName}_step1.png`);
const pngBuffer = canvas1.toBuffer('image/png');
await writeFile(pngPath, pngBuffer);
console.log(`✓ Saved PNG: ${pngPath}`);

// Step 4: Load PNG and convert back to DOOM picture
console.log('\n[4] Loading PNG and converting to DOOM picture...');
const { loadImage } = canvasModule;
const img = await loadImage(pngPath);

const canvas2 = createCanvas(img.width, img.height);
const ctx2 = canvas2.getContext('2d');
ctx2.drawImage(img, 0, 0);

const imageData2 = ctx2.getImageData(0, 0, img.width, img.height);
const data2 = imageData2.data;

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

const pixels: (number | null)[][] = [];
const transparencyThreshold = 128;

for (let y = 0; y < img.height; y++) {
  const row: (number | null)[] = [];
  for (let x = 0; x < img.width; x++) {
    const pixelIndex = (y * img.width + x) * 4;
    const r = data2[pixelIndex];
    const g = data2[pixelIndex + 1];
    const b = data2[pixelIndex + 2];
    const a = data2[pixelIndex + 3];

    if (a < transparencyThreshold) {
      row.push(null);
    } else {
      const paletteIndex = findClosestPaletteIndex(r, g, b);
      row.push(paletteIndex);
    }
  }
  pixels.push(row);
}

const columns = pixelsToColumns(pixels, img.width, img.height);

const recodedPicture: DoomPicture = {
  header: {
    width: img.width,
    height: img.height,
    leftOffset: originalPicture.header.leftOffset,
    topOffset: originalPicture.header.topOffset,
  },
  columns,
  pixels,
};

console.log(`✓ Converted to DOOM picture`);
console.log(`  Width: ${recodedPicture.header.width}`);
console.log(`  Height: ${recodedPicture.header.height}`);
console.log(`  Columns: ${recodedPicture.columns.length}`);

// Step 5: Encode to lump data
console.log('\n[5] Encoding to lump data...');
const recodedLumpData = encodePicture(recodedPicture);
console.log(`✓ Encoded: ${recodedLumpData.byteLength} bytes (original: ${originalLump.size} bytes)`);

// Step 6: Try to decode the recoded lump
console.log('\n[6] Decoding recoded lump...');
try {
  const verifyPicture = decodePicture(recodedLumpData);
  console.log(`✓ Successfully decoded recoded lump!`);
  console.log(`  Width: ${verifyPicture.header.width}`);
  console.log(`  Height: ${verifyPicture.header.height}`);
  console.log(`  Columns: ${verifyPicture.columns.length}`);

  // Export recoded picture to PNG
  console.log('\n[7] Exporting recoded picture to PNG...');
  const canvas3 = createCanvas(verifyPicture.header.width, verifyPicture.header.height);
  const ctx3 = canvas3.getContext('2d');
  const imageData3 = ctx3.createImageData(verifyPicture.header.width, verifyPicture.header.height);
  const data3 = imageData3.data;

  for (let y = 0; y < verifyPicture.header.height; y++) {
    for (let x = 0; x < verifyPicture.header.width; x++) {
      const paletteIndex = verifyPicture.pixels[y][x];
      const pixelIndex = (y * verifyPicture.header.width + x) * 4;

      if (paletteIndex === null || paletteIndex === undefined) {
        data3[pixelIndex] = 0;
        data3[pixelIndex + 1] = 0;
        data3[pixelIndex + 2] = 0;
        data3[pixelIndex + 3] = 0;
      } else {
        const color = palette[paletteIndex] || [255, 0, 255];
        data3[pixelIndex] = color[0];
        data3[pixelIndex + 1] = color[1];
        data3[pixelIndex + 2] = color[2];
        data3[pixelIndex + 3] = 255;
      }
    }
  }

  ctx3.putImageData(imageData3, 0, 0);
  const pngPath2 = join(testDir, `${textureName}_step2.png`);
  const pngBuffer2 = canvas3.toBuffer('image/png');
  await writeFile(pngPath2, pngBuffer2);
  console.log(`✓ Saved recoded PNG: ${pngPath2}`);

  // Compare file sizes
  console.log('\n[8] Comparison:');
  console.log(`  Original PNG size: ${pngBuffer.length} bytes`);
  console.log(`  Recoded PNG size: ${pngBuffer2.length} bytes`);
  console.log(`  Original lump size: ${originalLump.size} bytes`);
  console.log(`  Recoded lump size: ${recodedLumpData.byteLength} bytes`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Roundtrip test PASSED!');
  console.log('='.repeat(60));
  console.log(`\nCheck test-output directory for PNG files:`);
  console.log(`  ${textureName}_step1.png - Original extracted`);
  console.log(`  ${textureName}_step2.png - After roundtrip`);

} catch (error) {
  console.error('\n❌ Failed to decode recoded lump:');
  console.error(error);
  process.exit(1);
}

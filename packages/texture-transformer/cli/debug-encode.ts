#!/usr/bin/env bun
/**
 * Debug picture encoding
 */

import { readFile } from 'node:fs/promises';
import {
  decode,
  findLump,
  decodePicture,
  encodePicture,
  pixelsToColumns,
} from '@web-doom/wad';
import type { DoomPicture } from '@web-doom/wad';

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: bun cli/debug-encode.ts <wad-path> <texture-name>');
  process.exit(1);
}

const [wadPath, textureName] = args;

const wadData = await readFile(wadPath);
const wad = decode(wadData.buffer);

const originalLump = findLump(wad, textureName);
if (!originalLump) {
  console.error(`Texture ${textureName} not found`);
  process.exit(1);
}

console.log('Original lump:');
console.log(`  Size: ${originalLump.size} bytes`);

const originalPicture = decodePicture(originalLump.data);
console.log('\nOriginal picture:');
console.log(`  Width: ${originalPicture.header.width}`);
console.log(`  Height: ${originalPicture.header.height}`);
console.log(`  Columns: ${originalPicture.columns.length}`);
console.log(`  First column posts: ${originalPicture.columns[0].length}`);
if (originalPicture.columns[0].length > 0) {
  console.log(`  First post topdelta: ${originalPicture.columns[0][0].topdelta}`);
  console.log(`  First post pixels: ${originalPicture.columns[0][0].pixels.length}`);
}

// Re-encode using pixels
const recodedColumns = pixelsToColumns(
  originalPicture.pixels,
  originalPicture.header.width,
  originalPicture.header.height
);

const recodedPicture: DoomPicture = {
  header: originalPicture.header,
  columns: recodedColumns,
  pixels: originalPicture.pixels,
};

console.log('\nRecoded picture (from pixels):');
console.log(`  Columns: ${recodedPicture.columns.length}`);
console.log(`  First column posts: ${recodedPicture.columns[0].length}`);
if (recodedPicture.columns[0].length > 0) {
  console.log(`  First post topdelta: ${recodedPicture.columns[0][0].topdelta}`);
  console.log(`  First post pixels: ${recodedPicture.columns[0][0].pixels.length}`);
}

const recodedLumpData = encodePicture(recodedPicture);
console.log('\nRecoded lump:');
console.log(`  Size: ${recodedLumpData.byteLength} bytes`);

// Try to decode
try {
  const verifyPicture = decodePicture(recodedLumpData);
  console.log('\n✓ Decode successful!');
  console.log(`  Width: ${verifyPicture.header.width}`);
  console.log(`  Height: ${verifyPicture.header.height}`);
} catch (error) {
  console.error('\n❌ Decode failed:');
  console.error(error);

  // Dump first few bytes of recoded lump
  const view = new DataView(recodedLumpData);
  console.log('\nFirst 32 bytes of recoded lump:');
  for (let i = 0; i < Math.min(32, recodedLumpData.byteLength); i += 4) {
    const bytes = [];
    for (let j = 0; j < 4 && i + j < recodedLumpData.byteLength; j++) {
      bytes.push(view.getUint8(i + j).toString(16).padStart(2, '0'));
    }
    console.log(`  ${i.toString().padStart(3, '0')}: ${bytes.join(' ')}`);
  }

  // Column offsets
  console.log('\nColumn offsets:');
  for (let i = 0; i < Math.min(5, originalPicture.header.width); i++) {
    const offset = view.getUint32(8 + i * 4, true);
    console.log(`  Column ${i}: offset ${offset}`);
  }
}

#!/usr/bin/env bun
/**
 * Compare original and recoded column data
 */

import { readFile } from 'node:fs/promises';
import {
  decode,
  findLump,
  decodePicture,
  encodePictureColumn,
  pixelsToColumns,
} from '@web-doom/wad';

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: bun cli/compare-columns.ts <wad-path> <texture-name>');
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

const originalPicture = decodePicture(originalLump.data);

// Get original column 0 data
const view = new DataView(originalLump.data);
const col0Offset = view.getUint32(8, true);
console.log(`Original column 0 offset: ${col0Offset}`);
console.log(`Original column 0 data (first 50 bytes from offset ${col0Offset}):`);

const bytes1: string[] = [];
for (let i = 0; i < 50 && col0Offset + i < originalLump.data.byteLength; i++) {
  bytes1.push(view.getUint8(col0Offset + i).toString(16).padStart(2, '0'));
}
console.log('  ' + bytes1.join(' '));

// Show original column 0 structure
console.log(`\nOriginal column 0 structure:`);
console.log(`  Posts: ${originalPicture.columns[0].length}`);
for (let i = 0; i < originalPicture.columns[0].length; i++) {
  const post = originalPicture.columns[0][i];
  console.log(`  Post ${i}: topdelta=${post.topdelta}, pixels=${post.pixels.length}`);
}

// Encode original column 0
const encodedCol0 = encodePictureColumn(originalPicture.columns[0]);
console.log(`\nEncoded original column 0:`);
console.log(`  Length: ${encodedCol0.length} bytes`);
const bytes2: string[] = [];
for (let i = 0; i < Math.min(50, encodedCol0.length); i++) {
  bytes2.push(encodedCol0[i].toString(16).padStart(2, '0'));
}
console.log('  ' + bytes2.join(' '));

// Create columns from pixels
const recodedColumns = pixelsToColumns(
  originalPicture.pixels,
  originalPicture.header.width,
  originalPicture.header.height
);

console.log(`\nRecoded column 0 structure (from pixels):`);
console.log(`  Posts: ${recodedColumns[0].length}`);
for (let i = 0; i < recodedColumns[0].length; i++) {
  const post = recodedColumns[0][i];
  console.log(`  Post ${i}: topdelta=${post.topdelta}, pixels=${post.pixels.length}`);
}

// Encode recoded column 0
const encodedRecodedCol0 = encodePictureColumn(recodedColumns[0]);
console.log(`\nEncoded recoded column 0:`);
console.log(`  Length: ${encodedRecodedCol0.length} bytes`);
const bytes3: string[] = [];
for (let i = 0; i < Math.min(50, encodedRecodedCol0.length); i++) {
  bytes3.push(encodedRecodedCol0[i].toString(16).padStart(2, '0'));
}
console.log('  ' + bytes3.join(' '));

// Compare
if (encodedCol0.length === encodedRecodedCol0.length) {
  let matches = true;
  for (let i = 0; i < encodedCol0.length; i++) {
    if (encodedCol0[i] !== encodedRecodedCol0[i]) {
      console.log(`\n❌ Mismatch at byte ${i}: original=${encodedCol0[i].toString(16)}, recoded=${encodedRecodedCol0[i].toString(16)}`);
      matches = false;
      break;
    }
  }
  if (matches) {
    console.log('\n✓ Column data matches!');
  }
} else {
  console.log(`\n❌ Length mismatch: original=${encodedCol0.length}, recoded=${encodedRecodedCol0.length}`);
}

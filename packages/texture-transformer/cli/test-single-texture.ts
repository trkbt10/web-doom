#!/usr/bin/env bun
/**
 * Test single texture roundtrip
 */

import { readFile } from 'node:fs/promises';
import { decode, decodePicture, findLump } from '@web-doom/wad';

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: bun cli/test-single-texture.ts <wad-path> <lump-name>');
  process.exit(1);
}

const [wadPath, lumpName] = args;

const wadData = await readFile(wadPath);
const wad = decode(wadData.buffer);

const lump = findLump(wad, lumpName);

if (!lump) {
  console.error(`Lump ${lumpName} not found`);
  process.exit(1);
}

console.log(`Lump: ${lumpName}`);
console.log(`Size: ${lump.size} bytes`);

try {
  const picture = decodePicture(lump.data);
  console.log(`Width: ${picture.header.width}`);
  console.log(`Height: ${picture.header.height}`);
  console.log(`Columns: ${picture.columns.length}`);
  console.log('Success!');
} catch (error) {
  console.error('Failed to decode:', error);
  process.exit(1);
}

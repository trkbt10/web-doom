#!/usr/bin/env bun
/**
 * Dump lump binary data
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
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
  console.error('Usage: bun cli/dump-lump.ts <wad-path> <texture-name>');
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

console.log(`Original lump size: ${originalLump.size} bytes\n`);

// Decode and re-encode
const originalPicture = decodePicture(originalLump.data);
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

const recodedLumpData = encodePicture(recodedPicture);
console.log(`Recoded lump size: ${recodedLumpData.byteLength} bytes\n`);

// Save both to files for external comparison
const testDir = join(import.meta.dir, '..', 'test-output');
await writeFile(join(testDir, `${textureName}_original.bin`), new Uint8Array(originalLump.data));
await writeFile(join(testDir, `${textureName}_recoded.bin`), new Uint8Array(recodedLumpData));

console.log('Saved binary files to test-output/');
console.log(`  ${textureName}_original.bin`);
console.log(`  ${textureName}_recoded.bin`);

// Compare headers
const origView = new DataView(originalLump.data);
const recodedView = new DataView(recodedLumpData);

console.log('\nHeader comparison:');
console.log('  Field       | Original | Recoded');
console.log('  ------------|----------|--------');
console.log(`  Width       | ${origView.getInt16(0, true).toString().padStart(8)} | ${recodedView.getInt16(0, true).toString().padStart(7)}`);
console.log(`  Height      | ${origView.getInt16(2, true).toString().padStart(8)} | ${recodedView.getInt16(2, true).toString().padStart(7)}`);
console.log(`  LeftOffset  | ${origView.getInt16(4, true).toString().padStart(8)} | ${recodedView.getInt16(4, true).toString().padStart(7)}`);
console.log(`  TopOffset   | ${origView.getInt16(6, true).toString().padStart(8)} | ${recodedView.getInt16(6, true).toString().padStart(7)}`);

console.log('\nColumn offset comparison (first 10 columns):');
console.log('  Column | Original | Recoded | Diff');
console.log('  -------|----------|---------|-----');

const width = originalPicture.header.width;
for (let i = 0; i < Math.min(10, width); i++) {
  const origOffset = origView.getUint32(8 + i * 4, true);
  const recodedOffset = recodedView.getUint32(8 + i * 4, true);
  const diff = recodedOffset - origOffset;
  console.log(`  ${i.toString().padStart(6)} | ${origOffset.toString().padStart(8)} | ${recodedOffset.toString().padStart(7)} | ${diff >= 0 ? '+' : ''}${diff}`);
}

// Check if any column offsets are shared in original
console.log('\nShared column offsets in original:');
const offsetCounts = new Map<number, number[]>();
for (let i = 0; i < width; i++) {
  const offset = origView.getUint32(8 + i * 4, true);
  if (!offsetCounts.has(offset)) {
    offsetCounts.set(offset, []);
  }
  offsetCounts.get(offset)!.push(i);
}

let sharedCount = 0;
for (const [offset, columns] of offsetCounts.entries()) {
  if (columns.length > 1) {
    console.log(`  Offset ${offset}: columns ${columns.join(', ')}`);
    sharedCount++;
  }
}

if (sharedCount === 0) {
  console.log('  None (all columns have unique offsets)');
} else {
  console.log(`\nTotal shared offsets: ${sharedCount}`);
}

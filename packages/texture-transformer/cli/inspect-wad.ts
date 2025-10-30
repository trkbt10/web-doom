#!/usr/bin/env bun
/**
 * Inspect WAD file structure
 */

import { readFile } from 'node:fs/promises';
import { decode } from '@web-doom/wad';

const args = process.argv.slice(2);

if (args.length < 1) {
  console.error('Usage: bun cli/inspect-wad.ts <wad-path>');
  process.exit(1);
}

const wadPath = args[0];
const wadData = await readFile(wadPath);
const wad = decode(wadData.buffer);

console.log(`WAD: ${wadPath}`);
console.log(`Type: ${wad.header.identification}`);
console.log(`Total lumps: ${wad.header.numlumps}`);
console.log('');

// Show first 20 lumps
console.log('First 20 lumps:');
for (let i = 0; i < Math.min(20, wad.lumps.length); i++) {
  const lump = wad.lumps[i];
  console.log(`  ${i.toString().padStart(4)}: ${lump.name.padEnd(8)} (${lump.size.toString().padStart(8)} bytes)`);
}

// Find some sprite lumps
console.log('');
console.log('Sample sprite lumps:');
const spriteLumps = wad.lumps.filter(l =>
  l.name.startsWith('ARM1') ||
  l.name.startsWith('BAL1') ||
  l.name.startsWith('TROO')
).slice(0, 10);
for (const lump of spriteLumps) {
  console.log(`  ${lump.name.padEnd(8)} (${lump.size.toString().padStart(8)} bytes)`);
}

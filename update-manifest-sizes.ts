#!/usr/bin/env bun
/**
 * Update manifest.json with actual image dimensions
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const controllersDir = join(process.cwd(), 'packages', 'pages', 'public', 'controllers');
const manifestPath = join(controllersDir, 'manifest.json');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

console.log('📝 Updating manifest.json with actual image sizes...\n');

for (const asset of manifest.assets) {
  const imagePath = join(controllersDir, asset.filename);
  const buffer = readFileSync(imagePath);

  // Read PNG dimensions from IHDR chunk
  const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  if (buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    const actualWidth = buffer.readUInt32BE(16);
    const actualHeight = buffer.readUInt32BE(20);

    console.log(`${asset.filename}:`);
    console.log(`  Old: ${asset.width}×${asset.height}`);
    console.log(`  New: ${actualWidth}×${actualHeight}`);

    asset.width = actualWidth;
    asset.height = actualHeight;
  }
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log('\n✅ Updated manifest.json');

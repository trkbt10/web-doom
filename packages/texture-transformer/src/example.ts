/**
 * Example usage of texture-transformer
 *
 * This example demonstrates how to:
 * 1. Load a WAD file
 * 2. Extract textures
 * 3. Group textures by category
 * 4. Transform textures using Gemini AI
 * 5. Save results
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { decode } from '@web-doom/wad';
import {
  extractTextures,
  groupTexturesByCategory,
  createSemanticGroups,
  createTransformerPipeline,
  type TransformOptions,
} from './index';

async function main() {
  // Check for required arguments
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: bun run src/example.ts <wad-file> [output-dir] [style]');
    console.error('');
    console.error('Example:');
    console.error('  bun run src/example.ts freedoom1.wad ./output "cyberpunk neon style"');
    console.error('');
    console.error('Make sure to set GEMINI_API_KEY environment variable');
    process.exit(1);
  }

  const wadPath = args[0];
  const outputDir = args[1] || './texture-output';
  const style = args[2] || 'maintaining DOOM aesthetic';

  // Check if WAD file exists
  if (!fs.existsSync(wadPath)) {
    console.error(`Error: WAD file not found: ${wadPath}`);
    process.exit(1);
  }

  // Check for API key
  if (!process.env.GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY environment variable is not set');
    console.error('');
    console.error('Get your API key from: https://makersuite.google.com/app/apikey');
    console.error('Then set it with: export GEMINI_API_KEY="your-key-here"');
    process.exit(1);
  }

  console.log('WAD Texture Transformer');
  console.log('======================');
  console.log('');
  console.log(`Input WAD: ${wadPath}`);
  console.log(`Output directory: ${outputDir}`);
  console.log(`Style: ${style}`);
  console.log('');

  // Load WAD file
  console.log('Loading WAD file...');
  const wadBuffer = fs.readFileSync(wadPath);
  // Convert Buffer to ArrayBuffer
  const arrayBuffer = wadBuffer.buffer.slice(wadBuffer.byteOffset, wadBuffer.byteOffset + wadBuffer.byteLength) as ArrayBuffer;
  const wad = decode(arrayBuffer);
  console.log(`Loaded WAD with ${wad.lumps.length} lumps`);
  console.log('');

  // Extract textures
  console.log('Extracting textures...');
  const textures = extractTextures(wad);
  console.log(`Found ${textures.length} textures`);
  console.log('');

  // Group textures
  console.log('Grouping textures...');
  const semanticGroups = createSemanticGroups(textures);
  console.log(`Created ${semanticGroups.size} semantic groups`);
  console.log('');

  // Display groups
  for (const [groupName, group] of Array.from(semanticGroups.entries())) {
    console.log(`  ${groupName}: ${group.textures.length} textures`);
  }
  console.log('');

  // Ask user which group to transform (for demo, we'll transform the first group)
  const firstGroup = Array.from(semanticGroups.values())[0];

  if (!firstGroup || firstGroup.textures.length === 0) {
    console.log('No textures found to transform');
    return;
  }

  console.log(`Transforming group: ${firstGroup.name}`);
  console.log(`Textures: ${firstGroup.textures.map(t => t.name).join(', ')}`);
  console.log('');

  // Limit to first 5 textures for demo
  const texturesToTransform = firstGroup.textures.slice(0, 5);
  console.log(`Processing ${texturesToTransform.length} textures (limited for demo)...`);
  console.log('');

  // Create transformer pipeline
  const pipeline = createTransformerPipeline({
    defaultTransformer: 'gemini',
    gemini: { apiKey: process.env.GEMINI_API_KEY },
  });

  // Transform textures
  const transformOptions: TransformOptions = {
    style,
    preserveTransparency: true,
  };

  let completed = 0;
  const results = await pipeline.transformBatch(
    texturesToTransform,
    {
      ...transformOptions,
      onProgress: (current: number, total: number) => {
        completed = current;
        console.log(`Progress: ${current}/${total} (${Math.round((current / total) * 100)}%)`);
      },
    }
  );

  console.log('');
  console.log('Transformation complete!');
  console.log('');

  // Display results
  const successCount = results.filter((r) => r.status === 'success').length;
  const failedCount = results.filter((r) => r.status === 'failed').length;

  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failedCount}`);
  console.log('');

  // Save results
  console.log(`Saving results to ${outputDir}...`);
  await pipeline.saveResults(results, outputDir);
  console.log('Done!');
  console.log('');

  // Display failed textures if any
  if (failedCount > 0) {
    console.log('Failed textures:');
    for (const result of results) {
      if (result.status === 'failed') {
        console.log(`  ${result.original.name}: ${result.error}`);
      }
    }
  }
}

// Run the example
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

#!/usr/bin/env bun
/**
 * Example: Batch texture transformation with unified client
 *
 * Usage:
 *   bun run cli/batch-transform-example.ts <wad-path> [backend] [output-dir]
 *
 * Example:
 *   bun run cli/batch-transform-example.ts assets/freedoom1.wad          # Auto-detect backend
 *   bun run cli/batch-transform-example.ts assets/freedoom1.wad gemini   # Use Gemini
 *   bun run cli/batch-transform-example.ts assets/freedoom1.wad nanobanana output/ # Use Nanobanana
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { decode } from '@web-doom/wad';
import {
  extractTextures,
  createSemanticGroups,
  createImageTransformer,
  type TransformerBackend,
  type ExtractedTexture,
} from '../src/index';

console.log('🎨 Batch Texture Transformer');
console.log('============================\n');

// Parse arguments
const args = process.argv.slice(2);

if (args.length < 1) {
  console.error('❌ Error: WAD file path required');
  console.error('\nUsage:');
  console.error('  bun run cli/batch-transform-example.ts <wad-path> [backend] [output-dir]');
  console.error('\nExample:');
  console.error('  bun run cli/batch-transform-example.ts assets/freedoom1.wad');
  console.error('  bun run cli/batch-transform-example.ts assets/freedoom1.wad gemini');
  console.error('  bun run cli/batch-transform-example.ts assets/freedoom1.wad nanobanana output/');
  process.exit(1);
}

const wadPath = args[0];
const backendArg = (args[1] || 'auto') as TransformerBackend;
const outputDir = args[2] || join(process.cwd(), 'texture-output');

// Validate WAD file
if (!existsSync(wadPath)) {
  console.error(`❌ Error: WAD file not found: ${wadPath}`);
  process.exit(1);
}

// Check for API keys
const geminiApiKey = process.env.GEMINI_API_KEY;
const nanobananaApiKey = process.env.NANOBANANA_API_KEY;

if (backendArg === 'gemini' && !geminiApiKey) {
  console.error('❌ Error: GEMINI_API_KEY not found');
  console.error('💡 Set environment variable: export GEMINI_API_KEY=your-api-key\n');
  process.exit(1);
}

if (backendArg === 'nanobanana' && !nanobananaApiKey) {
  console.error('❌ Error: NANOBANANA_API_KEY not found');
  console.error('💡 Set environment variable: export NANOBANANA_API_KEY=your-api-key\n');
  process.exit(1);
}

if (backendArg === 'auto' && !geminiApiKey && !nanobananaApiKey) {
  console.error('❌ Error: No API keys found');
  console.error('💡 Set at least one: GEMINI_API_KEY or NANOBANANA_API_KEY\n');
  process.exit(1);
}

async function main() {
  // Load WAD file
  console.log(`📦 Loading WAD: ${wadPath}`);
  const wadBuffer = await readFile(wadPath);
  const arrayBuffer = wadBuffer.buffer.slice(
    wadBuffer.byteOffset,
    wadBuffer.byteOffset + wadBuffer.byteLength
  );
  const wad = decode(arrayBuffer);
  console.log(`✅ Loaded ${wad.lumps.length} lumps\n`);

  // Extract textures
  console.log('🎨 Extracting textures...');
  const textures = extractTextures(wad);
  console.log(`✅ Extracted ${textures.length} textures\n`);

  // Create semantic groups
  console.log('📊 Creating semantic groups...');
  const groups = createSemanticGroups(textures);
  console.log(`✅ Created ${groups.size} groups:`);
  for (const [groupName, group] of groups.entries()) {
    console.log(`   - ${groupName}: ${group.textures.length} textures`);
  }
  console.log('');

  // Create transformer client
  console.log('🤖 Initializing transformer...');
  const client = createImageTransformer({
    backend: backendArg,
    apiKey: geminiApiKey || nanobananaApiKey,
    skipSSLVerification: process.env.NODE_ENV === 'development',
  });
  console.log(`✅ Using ${client.getBackendName()} backend\n`);

  // Create output directory
  await mkdir(outputDir, { recursive: true });
  console.log(`📁 Output directory: ${outputDir}\n`);

  // Select a few sample textures to transform
  const samples: ExtractedTexture[] = [];

  // Get 2 textures from each group (max 10 total)
  for (const [groupName, group] of groups.entries()) {
    const groupSamples = group.textures.slice(0, 2);
    samples.push(...groupSamples);
    if (samples.length >= 10) break;
  }

  console.log(`🎯 Transforming ${samples.length} sample textures...\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < samples.length; i++) {
    const texture = samples[i];
    console.log(`[${i + 1}/${samples.length}] ${texture.name}`);
    console.log(`   Category: ${texture.category}`);
    console.log(`   Size: ${texture.width}×${texture.height}`);

    try {
      // Transform with style
      const style = 'with high-quality anime aesthetic, vibrant colors, and detailed shading';

      // Prepare backend-specific options
      const backendName = client.getBackendName();
      const transformOptions =
        backendName === 'nanobanana'
          ? {
              style,
              nanobananaOptions: {
                strength: 0.75,
                steps: 30,
                guidanceScale: 7.5,
              },
            }
          : {
              style,
            };

      const result = await client.transform(texture, transformOptions);

      if (result.status === 'failed') {
        console.error(`   ❌ Failed: ${result.error}\n`);
        failCount++;
        continue;
      }

      // Save transformed image
      const outputFilename = `${texture.name}.png`;
      const outputPath = join(outputDir, outputFilename);
      const base64Data = result.transformed.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      await writeFile(outputPath, buffer);

      console.log(`   ✅ Saved: ${outputFilename}`);
      console.log(`   📝 Prompt: ${result.prompt}`);
      successCount++;

      // Wait to avoid rate limiting
      if (i < samples.length - 1) {
        console.log(`   ⏳ Waiting 2 seconds...\n`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        console.log('');
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
      failCount++;
    }
  }

  // Summary
  console.log('🎉 Batch processing complete!');
  console.log(`💾 Output directory: ${outputDir}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Total: ${samples.length} textures`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Failed: ${failCount}`);
  console.log(`   Backend: ${client.getBackendName()}`);
}

main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

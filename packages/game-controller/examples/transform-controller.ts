#!/usr/bin/env bun
/**
 * Example: Transform controller with AI styling
 *
 * Usage:
 *   bun run examples/transform-controller.ts [style] [backend]
 *
 * Example:
 *   bun run examples/transform-controller.ts "cyberpunk neon"
 *   bun run examples/transform-controller.ts "retro arcade" gemini
 *   bun run examples/transform-controller.ts "steampunk mechanical" nanobanana
 *   bun run examples/transform-controller.ts "pixel art" auto
 *
 * Backends:
 *   - auto: Try Gemini first, fallback to Nanobanana (default)
 *   - gemini: Use Google Gemini native image generation
 *   - nanobanana: Use Nanobanana img2img API
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import {
  doomControllerSchema,
  createImageTransformerClient,
  type ControllerTransformResult,
} from '../src/index';

// Get style and backend from command line arguments
const style = process.argv[2] || 'cyberpunk neon style';
const backendArg = (process.argv[3] || 'auto') as 'auto' | 'gemini' | 'nanobanana';

console.log('🎮 Controller Transformer Example');
console.log('================================\n');

// Check for API keys based on backend selection
const nanobananaApiKey = process.env.NANOBANANA_API_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (backendArg === 'nanobanana' && !nanobananaApiKey) {
  console.error('❌ Error: NANOBANANA_API_KEY not found in environment variables');
  console.error('\n💡 Please create a .env file in the project root with:');
  console.error('   NANOBANANA_API_KEY=your_api_key_here\n');
  console.error('   Copy from .env.example and fill in your API key.');
  process.exit(1);
}

if (backendArg === 'gemini' && !geminiApiKey) {
  console.error('❌ Error: GEMINI_API_KEY not found in environment variables');
  console.error('\n💡 Please create a .env file in the project root with:');
  console.error('   GEMINI_API_KEY=your_api_key_here\n');
  console.error('   Copy from .env.example and fill in your API key.');
  process.exit(1);
}

if (backendArg === 'auto' && !geminiApiKey && !nanobananaApiKey) {
  console.error('❌ Error: No API keys found in environment variables');
  console.error('\n💡 Please create a .env file in the project root with:');
  console.error('   GEMINI_API_KEY=your_gemini_api_key_here');
  console.error('   NANOBANANA_API_KEY=your_nanobanana_api_key_here\n');
  console.error('   Copy from .env.example and fill in at least one API key.');
  process.exit(1);
}

console.log('✅ API key(s) found');
console.log(`🎨 Style: "${style}"`);
console.log(`🔧 Backend: ${backendArg}\n`);

async function main() {
  try {
    // Create client
    console.log('🔧 Creating transformer client...');
    const client = createImageTransformerClient({
      backend: backendArg,
      apiKey: geminiApiKey || nanobananaApiKey,
    });

    if (!client.isAvailable()) {
      throw new Error('Backend not available. Check your API key.');
    }

    console.log(`✅ Backend selected: ${client.getBackendName()}\n`);

    // Transform controller
    console.log('🚀 Starting transformation...');
    console.log(`   Schema: ${doomControllerSchema.name}`);
    console.log(`   Size: ${doomControllerSchema.width}x${doomControllerSchema.height}`);
    console.log('   (This may take 30-60 seconds...)\n');

    // Prepare backend-specific options
    const backendOptions =
      client.getBackendName() === 'nanobanana'
        ? {
            nanobanana: {
              strength: 0.75,
              steps: 30,
              guidanceScale: 7.5,
            },
          }
        : {
            gemini: {
              modelVersion: 'gemini-2.5-flash-image',
            },
          };

    const result: ControllerTransformResult = await client.transformControllerSchema(
      doomControllerSchema,
      {
        style,
        backendOptions,
      }
    );

    // Check result
    if (result.status === 'failed') {
      throw new Error(`Transformation failed: ${result.error}`);
    }

    console.log('✅ Transformation successful!\n');

    // Display metadata
    console.log('📊 Metadata:');
    console.log(`   Model: ${result.metadata?.model || 'N/A'}`);
    console.log(`   Steps: ${result.metadata?.steps || 'N/A'}`);
    console.log(`   Strength: ${result.metadata?.strength || 'N/A'}`);
    console.log(`   Seed: ${result.metadata?.seed || 'random'}`);
    console.log(`   Prompt: ${result.prompt}\n`);

    // Save result
    const outputDir = join(process.cwd(), 'examples', 'output');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `controller-${timestamp}.png`;
    const outputPath = join(outputDir, filename);

    // Create output directory if it doesn't exist
    await Bun.write(outputDir + '/.gitkeep', '');

    // Extract base64 and save
    const base64Data = result.transformed.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    writeFileSync(outputPath, buffer);

    console.log('💾 Saved to:');
    console.log(`   ${outputPath}\n`);

    // Also save original for comparison
    const originalPath = join(outputDir, `controller-original-${timestamp}.png`);
    const originalBase64 = result.original.imageData.replace(/^data:image\/png;base64,/, '');
    const originalBuffer = Buffer.from(originalBase64, 'base64');
    writeFileSync(originalPath, originalBuffer);

    console.log('💾 Original saved to:');
    console.log(`   ${originalPath}\n`);

    console.log('🎉 Done! Open the PNG files to see the result.');
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();

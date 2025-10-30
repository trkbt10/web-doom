#!/usr/bin/env bun
/**
 * Example: Batch transform controller with multiple styles
 * Generates styled controller images for both landscape and portrait orientations
 * Output is optimized for use in @web-doom/pages
 *
 * Usage:
 *   bun run examples/batch-transform.ts [backend]
 *
 * Example:
 *   bun run examples/batch-transform.ts          # Auto-detect backend
 *   bun run examples/batch-transform.ts gemini   # Use Gemini
 *   bun run examples/batch-transform.ts nanobanana # Use Nanobanana
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import {
  doomControllerSchema,
  doomControllerSchemaPortrait,
  createImageTransformerClient,
  type ControllerTransformResult,
} from '../src/index';

console.log('🎮 Batch Controller Transformer for Pages');
console.log('=========================================\n');

// Get backend from command line or default to auto
const backendArg = (process.argv[2] || 'auto') as 'auto' | 'gemini' | 'nanobanana';

// Check for API keys
const geminiApiKey = process.env.GEMINI_API_KEY;
const nanobananaApiKey = process.env.NANOBANANA_API_KEY;

if (backendArg === 'gemini' && !geminiApiKey) {
  console.error('❌ Error: GEMINI_API_KEY not found');
  console.error('💡 Create a .env file in project root with your API key\n');
  process.exit(1);
}

if (backendArg === 'nanobanana' && !nanobananaApiKey) {
  console.error('❌ Error: NANOBANANA_API_KEY not found');
  console.error('💡 Create a .env file in project root with your API key\n');
  process.exit(1);
}

if (backendArg === 'auto' && !geminiApiKey && !nanobananaApiKey) {
  console.error('❌ Error: No API keys found');
  console.error('💡 Set at least one: GEMINI_API_KEY or NANOBANANA_API_KEY\n');
  process.exit(1);
}

// Style presets for both orientations
const styles = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    style: 'cyberpunk neon style with holographic buttons and futuristic design, glowing edges',
    strength: 0.8,
  },
  {
    id: 'retro',
    name: 'Retro Arcade',
    style: 'retro arcade style with 80s aesthetic, pixelated details, CRT scanlines',
    strength: 0.75,
  },
  {
    id: 'steampunk',
    name: 'Steampunk',
    style: 'steampunk mechanical with brass buttons, copper gears, Victorian ornaments',
    strength: 0.85,
  },
  {
    id: 'neon',
    name: 'Neon Glow',
    style: 'neon pink and blue glowing buttons with dark background, vibrant colors',
    strength: 0.7,
  },
  {
    id: 'metal',
    name: 'Metal Industrial',
    style: 'industrial metal style with chrome buttons, steel texture, mechanical details',
    strength: 0.75,
  },
];

// Generate jobs for both landscape and portrait
const jobs = styles.flatMap((style) => [
  {
    id: `${style.id}-landscape`,
    name: `${style.name} (Landscape)`,
    filename: `controller-landscape-${style.id}.png`,
    schema: doomControllerSchema,
    orientation: 'landscape' as const,
    style: style.style,
    strength: style.strength,
  },
  {
    id: `${style.id}-portrait`,
    name: `${style.name} (Portrait)`,
    filename: `controller-portrait-${style.id}.png`,
    schema: doomControllerSchemaPortrait,
    orientation: 'portrait' as const,
    style: style.style,
    strength: style.strength,
  },
]);

interface ControllerAsset {
  id: string;
  name: string;
  filename: string;
  orientation: 'landscape' | 'portrait';
  style: string;
  width: number;
  height: number;
  model?: string;
  seed?: number;
  prompt?: string;
  generatedAt: string;
}

async function main() {
  const client = createImageTransformerClient({
    backend: backendArg,
    apiKey: geminiApiKey || nanobananaApiKey,
  });

  console.log(`✅ Client ready: ${client.getBackendName()}`);
  console.log(`📋 Processing ${jobs.length} transformations (${styles.length} styles × 2 orientations)...\n`);

  // Output to pages/public/controllers
  const outputDir = join(process.cwd(), '..', 'pages', 'public', 'controllers');

  // Create output directory
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch (err) {
    // Directory might already exist
  }

  const assets: ControllerAsset[] = [];
  const results: ControllerTransformResult[] = [];

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    console.log(`[${i + 1}/${jobs.length}] ${job.name}`);
    console.log(`   Schema: ${job.schema.name} (${job.schema.width}×${job.schema.height})`);
    console.log(`   Style: ${job.style}`);
    console.log(`   Output: ${job.filename}`);

    try {
      // Prepare backend-specific options
      const backendName = client.getBackendName();
      const backendOptions =
        backendName === 'nanobanana'
          ? {
              nanobanana: {
                strength: job.strength,
                steps: 35,
                guidanceScale: 8.0,
              },
            }
          : {
              gemini: {
                modelVersion: 'gemini-2.5-flash-image',
              },
            };

      const result = await client.transformControllerSchema(job.schema, {
        style: job.style,
        backendOptions,
      });

      if (result.status === 'failed') {
        console.error(`   ❌ Failed: ${result.error}\n`);
        continue;
      }

      results.push(result);

      // Save transformed image
      const outputPath = join(outputDir, job.filename);
      const base64Data = result.transformed.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      writeFileSync(outputPath, buffer);

      // Add to assets manifest
      assets.push({
        id: job.id,
        name: job.name,
        filename: job.filename,
        orientation: job.orientation,
        style: job.style,
        width: job.schema.width * 2, // Scale factor from transformation
        height: job.schema.height * 2,
        model: result.metadata?.model,
        seed: result.metadata?.seed,
        prompt: result.prompt,
        generatedAt: new Date().toISOString(),
      });

      console.log(`   ✅ Saved: ${job.filename}`);
      console.log(`   📊 Model: ${result.metadata?.model}, Seed: ${result.metadata?.seed || 'random'}\n`);

      // Wait to avoid rate limiting
      if (i < jobs.length - 1) {
        console.log('   ⏳ Waiting 2 seconds...\n');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  // Save manifest.json for pages to use
  const manifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    backend: client.getBackendName(),
    totalAssets: assets.length,
    orientations: {
      landscape: assets.filter((a) => a.orientation === 'landscape').length,
      portrait: assets.filter((a) => a.orientation === 'portrait').length,
    },
    assets,
  };

  const manifestPath = join(outputDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log('🎉 Batch processing complete!');
  console.log(`💾 Results saved to: ${outputDir}`);
  console.log(`📄 Manifest: ${manifestPath}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Total: ${assets.length} assets`);
  console.log(`   Landscape: ${manifest.orientations.landscape}`);
  console.log(`   Portrait: ${manifest.orientations.portrait}`);
  console.log(`   Backend: ${manifest.backend}`);
}

main();

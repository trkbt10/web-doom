/**
 * Image Transformer
 *
 * Transform textures using Gemini AI image-to-image generation
 */

import { GoogleGenAI } from '@google/genai';
import type { ExtractedTexture, TransformationResult, TransformOptions } from './types';
import { buildTransformPrompt } from './texture-grouper';

/**
 * Initialize Gemini AI client
 */
export function createGeminiClient(apiKey?: string): GoogleGenAI {
  // Use API key from environment if not provided
  const key = apiKey || process.env.GEMINI_API_KEY;

  if (!key) {
    throw new Error('Gemini API key is required. Set GEMINI_API_KEY environment variable or pass apiKey parameter.');
  }

  // Create client with API key
  return new GoogleGenAI({ apiKey: key } as any);
}

/**
 * Convert base64 data URL to inline data format for Gemini
 */
export function prepareImageForGemini(base64DataUrl: string): { mimeType: string; data: string } {
  // Extract mime type and base64 data from data URL
  const matches = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!matches) {
    throw new Error('Invalid base64 data URL format');
  }

  return {
    mimeType: matches[1],
    data: matches[2],
  };
}

/**
 * Transform a single texture using Gemini AI
 */
export async function transformTexture(
  client: GoogleGenAI,
  texture: ExtractedTexture,
  options: TransformOptions = {}
): Promise<TransformationResult> {
  try {
    const {
      style = 'maintaining DOOM aesthetic',
      customPrompt,
      preserveTransparency = true,
    } = options;

    // Build prompt
    let prompt = buildTransformPrompt(texture, style);

    if (customPrompt) {
      prompt += ` ${customPrompt}`;
    }

    if (preserveTransparency) {
      prompt += ' Preserve transparency in transparent areas.';
    }

    // Prepare input image
    const inputImage = prepareImageForGemini(texture.imageData);

    // Call Gemini API with image-to-image generation
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: inputImage,
            },
          ],
        },
      ],
    });

    // Extract generated image
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    const candidate = response.candidates[0];
    let transformedImageData = '';

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        transformedImageData = `data:${mimeType};base64,${imageData}`;
        break;
      }
    }

    if (!transformedImageData) {
      throw new Error('No image data in Gemini API response');
    }

    return {
      original: texture,
      transformed: transformedImageData,
      prompt,
      status: 'success',
    };
  } catch (error) {
    return {
      original: texture,
      transformed: '',
      prompt: buildTransformPrompt(texture, options.style),
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Transform multiple textures in batch
 */
export async function transformTextureBatch(
  client: GoogleGenAI,
  textures: ExtractedTexture[],
  options: TransformOptions = {},
  onProgress?: (completed: number, total: number) => void
): Promise<TransformationResult[]> {
  const results: TransformationResult[] = [];

  for (let i = 0; i < textures.length; i++) {
    const texture = textures[i];
    const result = await transformTexture(client, texture, options);
    results.push(result);

    if (onProgress) {
      onProgress(i + 1, textures.length);
    }

    // Add small delay to avoid rate limiting
    if (i < textures.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Transform textures with concurrent processing
 */
export async function transformTexturesConcurrent(
  client: GoogleGenAI,
  textures: ExtractedTexture[],
  options: TransformOptions = {},
  concurrency: number = 3,
  onProgress?: (completed: number, total: number) => void
): Promise<TransformationResult[]> {
  const results: TransformationResult[] = [];
  let completed = 0;

  // Process in chunks
  for (let i = 0; i < textures.length; i += concurrency) {
    const chunk = textures.slice(i, i + concurrency);
    const chunkPromises = chunk.map(texture => transformTexture(client, texture, options));

    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);

    completed += chunk.length;
    if (onProgress) {
      onProgress(completed, textures.length);
    }

    // Add delay between chunks
    if (i + concurrency < textures.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}

/**
 * Save transformation results to files
 */
export async function saveTransformationResults(
  results: TransformationResult[],
  outputDir: string
): Promise<void> {
  const fs = await import('node:fs');
  const path = await import('node:path');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const result of results) {
    if (result.status === 'success' && result.transformed) {
      const filename = `${result.original.name.toLowerCase()}.png`;
      const filepath = path.join(outputDir, filename);

      // Extract base64 data from data URL
      const parts = result.transformed.split(',');
      if (parts.length < 2) {
        console.error(`Invalid data URL for ${result.original.name}`);
        continue;
      }

      const base64Data = parts[1];
      const buffer = Buffer.from(base64Data, 'base64');

      fs.writeFileSync(filepath, buffer);
      console.log(`Saved: ${filepath}`);
    } else {
      console.error(`Failed to transform ${result.original.name}: ${result.error}`);
    }
  }
}

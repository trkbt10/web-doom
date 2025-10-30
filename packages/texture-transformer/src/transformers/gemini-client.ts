/**
 * Gemini Image Transformer
 *
 * Transform textures using Gemini AI image-to-image generation
 */

import { GoogleGenAI } from '@google/genai';
import type {
  ExtractedTexture,
  TransformationResult,
  TransformOptions,
  ImageTransformer,
} from '../core/types';
import { buildTransformPrompt } from '../groupers/texture-grouper';

/**
 * Gemini AI configuration
 */
export interface GeminiConfig {
  /** API key */
  apiKey?: string;
  /** Model to use */
  model?: string;
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
 * Gemini Client for image transformations
 */
export class GeminiClient implements ImageTransformer {
  private client: GoogleGenAI;
  private model: string;

  constructor(config: GeminiConfig = {}) {
    const apiKey = config.apiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'Gemini API key is required. Set GEMINI_API_KEY environment variable or pass apiKey parameter.'
      );
    }

    this.client = new GoogleGenAI({ apiKey } as any);
    this.model = config.model || 'gemini-2.5-flash-image';
  }

  /**
   * Transform a single texture
   */
  async transform(
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
      const response = await this.client.models.generateContent({
        model: this.model,
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

      if (!candidate.content || !candidate.content.parts) {
        throw new Error('Invalid response format from Gemini API');
      }

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
  async transformBatch(
    textures: ExtractedTexture[],
    options: TransformOptions = {},
    onProgress?: (completed: number, total: number) => void
  ): Promise<TransformationResult[]> {
    const results: TransformationResult[] = [];

    for (let i = 0; i < textures.length; i++) {
      const texture = textures[i];
      const result = await this.transform(texture, options);
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
  async transformConcurrent(
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
      const chunkPromises = chunk.map(texture => this.transform(texture, options));

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
}

/**
 * Create Gemini client instance
 */
export function createGeminiClient(config?: GeminiConfig): GeminiClient {
  return new GeminiClient(config);
}

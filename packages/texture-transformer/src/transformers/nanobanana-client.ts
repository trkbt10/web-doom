/**
 * Nanobanana Image-to-Image Transformer
 *
 * Provides character image transformation using nanobanana i2i API
 */

import type {
  ExtractedTexture,
  TransformationResult,
  TransformOptions,
  NanobananaOptions,
  ImageTransformer,
} from '../core/types';
import { buildTransformPrompt } from '../groupers/texture-grouper';

/**
 * Nanobanana API configuration
 */
export interface NanobananaConfig {
  /** API endpoint URL */
  endpoint?: string;
  /** API key for authentication */
  apiKey?: string;
  /** Default model ID */
  defaultModel?: string;
  /** Request timeout (ms) */
  timeout?: number;
}

/**
 * Nanobanana API request payload
 */
interface NanobananaRequest {
  /** Input image (base64) */
  image: string;
  /** Text prompt */
  prompt: string;
  /** Optional negative prompt */
  negative_prompt?: string;
  /** Model ID */
  model?: string;
  /** Transformation strength (0-1) */
  strength?: number;
  /** Number of inference steps */
  num_inference_steps?: number;
  /** Guidance scale */
  guidance_scale?: number;
  /** Random seed */
  seed?: number;
  /** Output width */
  width?: number;
  /** Output height */
  height?: number;
}

/**
 * Nanobanana API response
 */
interface NanobananaResponse {
  /** Generated image (base64) */
  image: string;
  /** Generation metadata */
  metadata?: {
    seed?: number;
    steps?: number;
    model?: string;
  };
  /** Error message if failed */
  error?: string;
}

/**
 * Nanobanana Client for i2i transformations
 */
export class NanobananaClient implements ImageTransformer {
  private config: Required<NanobananaConfig>;

  constructor(config: NanobananaConfig = {}) {
    this.config = {
      endpoint: config.endpoint || process.env.NANOBANANA_ENDPOINT || 'https://api.nanobanana.ai/v1/i2i',
      apiKey: config.apiKey || process.env.NANOBANANA_API_KEY || '',
      defaultModel: config.defaultModel || 'nanobanana-i2i-v1',
      timeout: config.timeout || 60000,
    };

    if (!this.config.apiKey) {
      console.warn(
        'Nanobanana API key not provided. Set NANOBANANA_API_KEY environment variable or pass apiKey in config.'
      );
    }
  }

  /**
   * Convert base64 data URL to raw base64 string
   */
  private extractBase64(dataUrl: string): string {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new Error('Invalid base64 data URL format');
    }
    return match[2];
  }

  /**
   * Call Nanobanana API
   */
  private async callApi(request: NanobananaRequest): Promise<NanobananaResponse> {
    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Nanobanana API error: ${response.status} ${errorText}`);
    }

    return await response.json();
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
        targetSize,
        nanobananaOptions = {},
      } = options;

      // Build prompt
      let prompt = buildTransformPrompt(texture, style);

      if (customPrompt) {
        prompt += ` ${customPrompt}`;
      }

      if (preserveTransparency) {
        prompt += ' Preserve transparency in transparent areas.';
      }

      // Prepare negative prompt
      let negativePrompt = nanobananaOptions.negativePrompt || '';
      if (!preserveTransparency) {
        negativePrompt += ', transparent, alpha channel';
      }

      // Extract base64 image data
      const base64Image = this.extractBase64(texture.imageData);

      // Build API request
      const request: NanobananaRequest = {
        image: base64Image,
        prompt,
        negative_prompt: negativePrompt || undefined,
        model: nanobananaOptions.modelId || this.config.defaultModel,
        strength: nanobananaOptions.strength ?? 0.75,
        num_inference_steps: nanobananaOptions.steps ?? 30,
        guidance_scale: nanobananaOptions.guidanceScale ?? 7.5,
        seed: nanobananaOptions.seed,
        width: targetSize?.width || texture.width,
        height: targetSize?.height || texture.height,
      };

      // Call API
      const response = await this.callApi(request);

      if (response.error) {
        throw new Error(response.error);
      }

      // Format result as data URL
      const transformedImageData = `data:image/png;base64,${response.image}`;

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

      // Add delay to avoid rate limiting
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
 * Create Nanobanana client instance
 */
export function createNanobananaClient(config?: NanobananaConfig): NanobananaClient {
  return new NanobananaClient(config);
}

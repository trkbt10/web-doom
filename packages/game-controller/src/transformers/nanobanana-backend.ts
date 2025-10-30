/**
 * Nanobanana backend for controller image transformation
 */

import type {
  ImageTransformerBackend,
  ControllerImage,
  ControllerTransformOptions,
  ControllerTransformResult,
  NanobananaTransformOptions,
} from './types';
import { buildControllerPrompt } from './types';
import { extractBase64 } from './image-converter';

/**
 * Nanobanana API configuration
 */
export interface NanobananaBackendConfig {
  /** API endpoint URL */
  endpoint?: string;
  /** API key for authentication */
  apiKey?: string;
  /** Default model ID */
  defaultModel?: string;
  /** Request timeout (ms) */
  timeout?: number;
  /** Skip SSL certificate verification (dev only, not recommended for production) */
  skipSSLVerification?: boolean;
}

/**
 * Nanobanana API request payload
 */
interface NanobananaApiRequest {
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
interface NanobananaApiResponse {
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
 * Nanobanana backend implementation
 */
export class NanobananaBackend implements ImageTransformerBackend {
  readonly name = 'nanobanana';
  private config: Required<NanobananaBackendConfig>;

  constructor(config: NanobananaBackendConfig = {}) {
    this.config = {
      endpoint:
        config.endpoint ||
        process.env.NANOBANANA_ENDPOINT ||
        'https://api.nanobanana.ai/v1/i2i',
      apiKey: config.apiKey || process.env.NANOBANANA_API_KEY || '',
      defaultModel: config.defaultModel || 'nanobanana-i2i-v1',
      timeout: config.timeout || 60000,
      skipSSLVerification: config.skipSSLVerification || false,
    };
  }

  /**
   * Check if backend is available
   */
  isAvailable(): boolean {
    return Boolean(this.config.apiKey);
  }

  /**
   * Call Nanobanana API
   */
  private async callApi(
    request: NanobananaApiRequest
  ): Promise<NanobananaApiResponse> {
    if (!this.isAvailable()) {
      throw new Error(
        'Nanobanana API key not configured. Set NANOBANANA_API_KEY environment variable.'
      );
    }

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
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
   * Build transformation prompt
   */
  private buildPrompt(
    image: ControllerImage,
    options: ControllerTransformOptions
  ): string {
    // Use prompt override if provided
    if (options.promptOverride) {
      return options.promptOverride;
    }

    // Build base prompt from schema
    let prompt = buildControllerPrompt(image.schema, options.style);

    // Add custom prompt if provided
    if (options.customPrompt) {
      prompt += ` ${options.customPrompt}`;
    }

    return prompt;
  }

  /**
   * Transform controller image
   */
  async transform(
    image: ControllerImage,
    options: ControllerTransformOptions = {}
  ): Promise<ControllerTransformResult> {
    try {
      // Check if image is PNG format (required for API)
      if (image.format !== 'png') {
        throw new Error(
          'Image must be in PNG format. Convert SVG to PNG first using svgToPng().'
        );
      }

      // Build prompt
      const prompt = this.buildPrompt(image, options);

      // Get backend-specific options
      const backendOpts: NanobananaTransformOptions =
        options.backendOptions?.nanobanana || {};

      // Build negative prompt
      const negativePrompt =
        backendOpts.negativePrompt ||
        'low quality, blurry, distorted, broken buttons, text, watermark';

      // Extract base64 image data
      const base64Image = extractBase64(image.imageData);

      // Build API request
      const request: NanobananaApiRequest = {
        image: base64Image,
        prompt,
        negative_prompt: negativePrompt,
        model: backendOpts.modelId || this.config.defaultModel,
        strength: backendOpts.strength ?? 0.75,
        num_inference_steps: backendOpts.steps ?? 30,
        guidance_scale: backendOpts.guidanceScale ?? 7.5,
        seed: backendOpts.seed,
        width: image.width,
        height: image.height,
      };

      // Call API
      const response = await this.callApi(request);

      if (response.error) {
        throw new Error(response.error);
      }

      // Format result as data URL
      const transformedImageData = `data:image/png;base64,${response.image}`;

      return {
        original: image,
        transformed: transformedImageData,
        prompt,
        status: 'success',
        metadata: {
          model: response.metadata?.model || request.model,
          seed: response.metadata?.seed || request.seed,
          steps: response.metadata?.steps || request.num_inference_steps,
          strength: request.strength,
        },
      };
    } catch (error) {
      return {
        original: image,
        transformed: '',
        prompt: this.buildPrompt(image, options),
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

/**
 * Create Nanobanana backend instance
 */
export function createNanobananaBackend(
  config?: NanobananaBackendConfig
): NanobananaBackend {
  return new NanobananaBackend(config);
}

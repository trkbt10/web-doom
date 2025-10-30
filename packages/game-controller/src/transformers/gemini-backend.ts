/**
 * Google Gemini backend for controller image transformation
 * Uses Gemini's native image generation capabilities
 */

import { GoogleGenAI } from '@google/genai';
import type {
  ImageTransformerBackend,
  ControllerImage,
  ControllerTransformOptions,
  ControllerTransformResult,
  GeminiTransformOptions,
} from './types';
import { buildControllerPrompt } from './types';
import { extractBase64 } from './image-converter-node';

/**
 * Gemini backend configuration
 */
export interface GeminiBackendConfig {
  /** API key for authentication (or use GEMINI_API_KEY env var) */
  apiKey?: string;
  /** Default model to use */
  defaultModel?: string;
  /** Request timeout (ms) */
  timeout?: number;
}

/**
 * Gemini backend implementation
 */
export class GeminiBackend implements ImageTransformerBackend {
  readonly name = 'gemini';
  private client: GoogleGenAI;
  private config: Required<Omit<GeminiBackendConfig, 'apiKey'>>;

  constructor(config: GeminiBackendConfig = {}) {
    // GoogleGenAI client will automatically use GEMINI_API_KEY env var
    this.client = new GoogleGenAI({
      apiKey: config.apiKey,
    });

    this.config = {
      defaultModel: config.defaultModel || 'gemini-2.5-flash-image',
      timeout: config.timeout || 60000,
    };
  }

  /**
   * Check if backend is available
   */
  isAvailable(): boolean {
    // Check if API key is set (either in config or env var)
    return Boolean(process.env.GEMINI_API_KEY || this.client);
  }

  /**
   * Build transformation prompt with image context
   */
  private buildPrompt(
    image: ControllerImage,
    options: ControllerTransformOptions
  ): string {
    // Use prompt override if provided
    if (options.promptOverride) {
      return options.promptOverride;
    }

    // Build base prompt
    let prompt = `Transform this game controller image. `;
    prompt += buildControllerPrompt(image.schema, options.style);

    // Add custom prompt if provided
    if (options.customPrompt) {
      prompt += ` ${options.customPrompt}`;
    }

    // Add constraints
    prompt += ` Maintain the button layout and overall structure. `;
    prompt += `Preserve the transparency of the background. `;
    prompt += `Output size: ${image.width}x${image.height}px.`;

    return prompt;
  }

  /**
   * Transform controller image using Gemini
   */
  async transform(
    image: ControllerImage,
    options: ControllerTransformOptions = {}
  ): Promise<ControllerTransformResult> {
    try {
      // Check if image is PNG format
      if (image.format !== 'png') {
        throw new Error(
          'Image must be in PNG format. Convert SVG to PNG first.'
        );
      }

      // Build prompt
      const prompt = this.buildPrompt(image, options);

      // Get backend-specific options
      const backendOpts: GeminiTransformOptions =
        options.backendOptions?.gemini || {};

      // Extract base64 image data
      const base64Image = extractBase64(image.imageData);

      // Prepare request with image and prompt
      const model = backendOpts.modelVersion || this.config.defaultModel;

      console.log(`[Gemini] Using model: ${model}`);
      console.log(`[Gemini] Prompt: ${prompt}`);

      // Call Gemini API with image input
      const response = await this.client.models.generateContent({
        model,
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: base64Image,
                },
              },
            ],
          },
        ],
      });

      // Extract generated image from response
      let transformedImageData: string | null = null;

      for (const candidate of response.candidates || []) {
        for (const part of candidate.content?.parts || []) {
          if (part.inlineData && part.inlineData.mimeType === 'image/png') {
            // Found generated image
            transformedImageData = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
        if (transformedImageData) break;
      }

      if (!transformedImageData) {
        throw new Error('No image generated in response');
      }

      return {
        original: image,
        transformed: transformedImageData,
        prompt,
        status: 'success',
        metadata: {
          model,
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
 * Create Gemini backend instance
 */
export function createGeminiBackend(
  config?: GeminiBackendConfig
): GeminiBackend {
  return new GeminiBackend(config);
}

/**
 * Unified image transformer client for controller styling
 * Abstracts multiple AI backends for image transformation
 */

import type {
  ImageTransformerBackend,
  ImageTransformerConfig,
  ControllerImage,
  ControllerTransformOptions,
  ControllerTransformResult,
} from './types';
import type { ControllerSchema } from '../types';
import { NanobananaBackend, createNanobananaBackend } from './nanobanana-backend';
import { GeminiBackend, createGeminiBackend } from './gemini-backend';
import { svgToPng } from './image-converter';
import { svgToPngNode, isNodeEnvironment } from './image-converter-node';
import { generateControllerImage } from '../utils/svg-generator';

/**
 * Unified image transformer client
 * Manages multiple backends and provides a simple interface
 */
export class ImageTransformerClient {
  private backend: ImageTransformerBackend;

  constructor(config: ImageTransformerConfig) {
    // Initialize backend based on config
    switch (config.backend) {
      case 'nanobanana':
        this.backend = createNanobananaBackend({
          endpoint: config.endpoint,
          apiKey: config.apiKey,
          defaultModel: config.defaultModel,
          timeout: config.timeout,
        });
        break;

      case 'gemini':
        this.backend = createGeminiBackend({
          apiKey: config.apiKey,
          defaultModel: config.defaultModel,
          timeout: config.timeout,
        });
        break;

      case 'auto':
        // Auto-detect available backend
        // Try Gemini first (often better quality)
        const gemini = createGeminiBackend({
          apiKey: config.apiKey,
          defaultModel: config.defaultModel,
          timeout: config.timeout,
        });

        if (gemini.isAvailable()) {
          this.backend = gemini;
        } else {
          // Fallback to Nanobanana
          const nanobanana = createNanobananaBackend({
            endpoint: config.endpoint,
            apiKey: config.apiKey,
            defaultModel: config.defaultModel,
            timeout: config.timeout,
          });

          if (nanobanana.isAvailable()) {
            this.backend = nanobanana;
          } else {
            throw new Error(
              'No available backend found. Please configure GEMINI_API_KEY or NANOBANANA_API_KEY.'
            );
          }
        }
        break;

      default:
        throw new Error(`Unknown backend: ${config.backend}`);
    }
  }

  /**
   * Get current backend name
   */
  getBackendName(): string {
    return this.backend.name;
  }

  /**
   * Check if backend is available
   */
  isAvailable(): boolean {
    return this.backend.isAvailable();
  }

  /**
   * Transform a controller schema to styled image
   * Automatically handles SVG -> PNG conversion
   */
  async transformControllerSchema(
    schema: ControllerSchema,
    options: ControllerTransformOptions = {}
  ): Promise<ControllerTransformResult> {
    // Generate SVG from schema
    const svgDataUrl = generateControllerImage(schema);

    // Convert SVG to PNG (required for AI processing)
    // Use appropriate converter based on environment
    const pngDataUrl = isNodeEnvironment()
      ? await svgToPngNode(svgDataUrl, schema.width, schema.height, 2)
      : await svgToPng(svgDataUrl, schema.width, schema.height, 2);

    // Create controller image object
    const controllerImage: ControllerImage = {
      schema,
      imageData: pngDataUrl,
      format: 'png',
      width: schema.width * 2,
      height: schema.height * 2,
    };

    // Transform using backend
    return await this.backend.transform(controllerImage, options);
  }

  /**
   * Transform an existing controller image
   */
  async transformControllerImage(
    image: ControllerImage,
    options: ControllerTransformOptions = {}
  ): Promise<ControllerTransformResult> {
    // Convert to PNG if needed
    if (image.format === 'svg') {
      const pngDataUrl = isNodeEnvironment()
        ? await svgToPngNode(image.imageData, image.width, image.height, 2)
        : await svgToPng(image.imageData, image.width, image.height, 2);

      image = {
        ...image,
        imageData: pngDataUrl,
        format: 'png',
        width: image.width * 2,
        height: image.height * 2,
      };
    }

    return await this.backend.transform(image, options);
  }
}

/**
 * Create an image transformer client
 */
export function createImageTransformerClient(
  config: ImageTransformerConfig
): ImageTransformerClient {
  return new ImageTransformerClient(config);
}

/**
 * Quick helper to transform a controller with default settings
 */
export async function transformController(
  schema: ControllerSchema,
  style: string,
  apiKey?: string
): Promise<ControllerTransformResult> {
  const client = createImageTransformerClient({
    backend: 'auto',
    apiKey: apiKey || process.env.NANOBANANA_API_KEY,
  });

  return await client.transformControllerSchema(schema, { style });
}

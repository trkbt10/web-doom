/**
 * Unified image transformer client for texture transformation
 * Abstracts multiple AI backends (Gemini, Nanobanana) for texture transformation
 */

import type {
  ExtractedTexture,
  TransformationResult,
  TransformOptions,
  ImageTransformer,
} from '../core/types';
import { GeminiClient } from './gemini-client';
import { NanobananaClient } from './nanobanana-client';

/**
 * Supported backends
 */
export type TransformerBackend = 'auto' | 'gemini' | 'nanobanana';

/**
 * Unified transformer configuration
 */
export interface UnifiedTransformerConfig {
  /** Backend to use ('auto' will detect available backend) */
  backend?: TransformerBackend;
  /** API key (or set GEMINI_API_KEY / NANOBANANA_API_KEY env var) */
  apiKey?: string;
  /** API endpoint (for Nanobanana) */
  endpoint?: string;
  /** Default model ID */
  defaultModel?: string;
  /** Request timeout (ms) */
  timeout?: number;
  /** Skip SSL verification (dev only, for Nanobanana) */
  skipSSLVerification?: boolean;
}

/**
 * Unified image transformer client
 * Manages multiple backends and provides a simple interface
 */
export class UnifiedTransformerClient implements ImageTransformer {
  private backend: ImageTransformer;
  private backendName: string;

  constructor(config: UnifiedTransformerConfig = {}) {
    const backend = config.backend || 'auto';

    // Initialize backend based on config
    switch (backend) {
      case 'nanobanana':
        this.backend = new NanobananaClient({
          endpoint: config.endpoint,
          apiKey: config.apiKey,
          defaultModel: config.defaultModel,
          timeout: config.timeout,
          skipSSLVerification: config.skipSSLVerification,
        });
        this.backendName = 'nanobanana';
        break;

      case 'gemini':
        this.backend = new GeminiClient({
          apiKey: config.apiKey,
          model: config.defaultModel,
        });
        this.backendName = 'gemini';
        break;

      case 'auto':
        // Auto-detect available backend
        // Try Gemini first (often better quality and cheaper)
        const gemini = new GeminiClient({
          apiKey: config.apiKey || process.env.GEMINI_API_KEY,
          model: config.defaultModel,
        });

        if (this.hasApiKey(gemini)) {
          this.backend = gemini;
          this.backendName = 'gemini';
          console.log('✅ Using Gemini backend');
        } else {
          // Fallback to Nanobanana
          const nanobanana = new NanobananaClient({
            endpoint: config.endpoint,
            apiKey: config.apiKey || process.env.NANOBANANA_API_KEY,
            defaultModel: config.defaultModel,
            timeout: config.timeout,
            skipSSLVerification: config.skipSSLVerification,
          });

          if (this.hasApiKey(nanobanana)) {
            this.backend = nanobanana;
            this.backendName = 'nanobanana';
            console.log('✅ Using Nanobanana backend');
          } else {
            throw new Error(
              'No available backend found. Please configure GEMINI_API_KEY or NANOBANANA_API_KEY.'
            );
          }
        }
        break;

      default:
        throw new Error(`Unknown backend: ${backend}`);
    }
  }

  /**
   * Check if client has API key configured
   */
  private hasApiKey(client: any): boolean {
    return Boolean(client['config']?.apiKey);
  }

  /**
   * Get current backend name
   */
  getBackendName(): string {
    return this.backendName;
  }

  /**
   * Transform a single texture
   */
  async transform(
    texture: ExtractedTexture,
    options: TransformOptions = {}
  ): Promise<TransformationResult> {
    return await this.backend.transform(texture, options);
  }

  /**
   * Transform multiple textures in batch
   */
  async transformBatch(
    textures: ExtractedTexture[],
    options: TransformOptions = {},
    onProgress?: (completed: number, total: number) => void
  ): Promise<TransformationResult[]> {
    return await this.backend.transformBatch(textures, options, onProgress);
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
    // Check if backend has transformConcurrent method
    if ('transformConcurrent' in this.backend && typeof this.backend.transformConcurrent === 'function') {
      return await this.backend.transformConcurrent(textures, options, concurrency, onProgress);
    }

    // Fallback: implement concurrent processing ourselves
    const results: TransformationResult[] = [];
    let completed = 0;

    // Process in chunks
    for (let i = 0; i < textures.length; i += concurrency) {
      const chunk = textures.slice(i, i + concurrency);
      const chunkPromises = chunk.map(texture => this.backend.transform(texture, options));

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);

      completed += chunk.length;
      if (onProgress) {
        onProgress(completed, textures.length);
      }

      // Add delay between chunks to avoid rate limiting
      if (i + concurrency < textures.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return results;
  }
}

/**
 * Create a unified transformer client
 */
export function createImageTransformer(
  config?: UnifiedTransformerConfig
): UnifiedTransformerClient {
  return new UnifiedTransformerClient(config);
}

/**
 * Quick helper to transform a texture with default settings
 */
export async function transformTexture(
  texture: ExtractedTexture,
  style: string,
  apiKey?: string
): Promise<TransformationResult> {
  const client = createImageTransformer({
    backend: 'auto',
    apiKey,
  });

  return await client.transform(texture, { style });
}

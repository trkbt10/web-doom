/**
 * Transformer Pipeline
 *
 * Unified pipeline for texture transformation using different AI backends
 */

import type {
  ExtractedTexture,
  TransformationResult,
  TransformOptions,
  BatchTransformOptions,
  TextureGroup,
  GroupTransformConfig,
  ImageTransformer,
} from '../core/types';
import { GeminiClient, createGeminiClient, type GeminiConfig } from './gemini-client';
import { NanobananaClient, createNanobananaClient, type NanobananaConfig } from './nanobanana-client';

/**
 * Transformer pipeline configuration
 */
export interface TransformerPipelineConfig {
  /** Default transformer to use */
  defaultTransformer?: 'gemini' | 'nanobanana';
  /** Gemini configuration */
  gemini?: GeminiConfig;
  /** Nanobanana configuration */
  nanobanana?: NanobananaConfig;
}

/**
 * Unified transformer pipeline
 */
export class TransformerPipeline {
  private geminiClient?: GeminiClient;
  private nanobananaClient?: NanobananaClient;
  private defaultTransformer: 'gemini' | 'nanobanana';

  constructor(config: TransformerPipelineConfig = {}) {
    this.defaultTransformer = config.defaultTransformer || 'gemini';

    // Initialize Gemini client if configured
    if (config.gemini || this.defaultTransformer === 'gemini') {
      try {
        this.geminiClient = createGeminiClient(config.gemini);
      } catch (error) {
        console.warn('Failed to initialize Gemini client:', error);
      }
    }

    // Initialize Nanobanana client if configured
    if (config.nanobanana || this.defaultTransformer === 'nanobanana') {
      this.nanobananaClient = createNanobananaClient(config.nanobanana);
    }
  }

  /**
   * Get transformer instance based on options
   */
  private getTransformer(options: TransformOptions): ImageTransformer {
    const transformerType = options.transformer || this.defaultTransformer;

    if (transformerType === 'nanobanana') {
      if (!this.nanobananaClient) {
        throw new Error('Nanobanana client not initialized');
      }
      return this.nanobananaClient;
    } else {
      if (!this.geminiClient) {
        throw new Error('Gemini client not initialized');
      }
      return this.geminiClient;
    }
  }

  /**
   * Transform a single texture
   */
  async transform(
    texture: ExtractedTexture,
    options: TransformOptions = {}
  ): Promise<TransformationResult> {
    const transformer = this.getTransformer(options);
    return transformer.transform(texture, options);
  }

  /**
   * Transform multiple textures in batch
   */
  async transformBatch(
    textures: ExtractedTexture[],
    options: BatchTransformOptions = {}
  ): Promise<TransformationResult[]> {
    const transformer = this.getTransformer(options);
    const { concurrency, onProgress } = options;

    if (concurrency && concurrency > 1) {
      // Use concurrent processing if available
      if (transformer instanceof GeminiClient) {
        return transformer.transformConcurrent(textures, options, concurrency, onProgress);
      } else if (transformer instanceof NanobananaClient) {
        return transformer.transformConcurrent(textures, options, concurrency, onProgress);
      }
    }

    // Fall back to sequential batch processing
    return transformer.transformBatch(textures, options, onProgress);
  }

  /**
   * Transform a texture group
   */
  async transformGroup(
    group: TextureGroup,
    options: TransformOptions = {}
  ): Promise<TransformationResult[]> {
    console.log(`Transforming group: ${group.name} (${group.textures.length} textures)`);

    const groupOptions: TransformOptions = {
      ...options,
      customPrompt: options.customPrompt || group.prompt,
    };

    return this.transformBatch(group.textures, groupOptions);
  }

  /**
   * Transform multiple groups with different options for each
   */
  async transformGroups(
    configs: GroupTransformConfig[],
    onGroupProgress?: (groupIndex: number, totalGroups: number) => void
  ): Promise<Map<string, TransformationResult[]>> {
    const results = new Map<string, TransformationResult[]>();

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      const { group, options, promptOverride } = config;

      console.log(
        `[${i + 1}/${configs.length}] Processing group: ${group.name} (${group.textures.length} textures)`
      );

      const groupOptions: TransformOptions = {
        ...options,
        customPrompt: promptOverride || options.customPrompt || group.prompt,
      };

      const groupResults = await this.transformBatch(group.textures, groupOptions);
      results.set(group.name, groupResults);

      if (onGroupProgress) {
        onGroupProgress(i + 1, configs.length);
      }
    }

    return results;
  }

  /**
   * Save transformation results to files
   */
  async saveResults(
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

        fs.writeFileSync(filepath, new Uint8Array(buffer));
        console.log(`Saved: ${filepath}`);
      } else {
        console.error(`Failed to transform ${result.original.name}: ${result.error}`);
      }
    }
  }

  /**
   * Save grouped transformation results to organized directories
   */
  async saveGroupedResults(
    groupedResults: Map<string, TransformationResult[]>,
    outputDir: string
  ): Promise<void> {
    const fs = await import('node:fs');
    const path = await import('node:path');

    for (const [groupName, results] of groupedResults.entries()) {
      // Create subdirectory for this group
      const groupDir = path.join(outputDir, groupName.toLowerCase().replace(/\s+/g, '-'));

      await this.saveResults(results, groupDir);
    }
  }
}

/**
 * Create transformer pipeline instance
 */
export function createTransformerPipeline(config?: TransformerPipelineConfig): TransformerPipeline {
  return new TransformerPipeline(config);
}

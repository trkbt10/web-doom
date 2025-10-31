/**
 * @web-doom/texture-transformer
 *
 * WAD texture transformation using AI image-to-image generation
 *
 * Features:
 * - Extract textures from WAD files
 * - Categorize and group textures
 * - Transform textures using Gemini AI or Nanobanana i2i
 * - Batch processing with progress tracking
 * - Freedoom texture catalog with prompt templates
 *
 * @example Basic usage with Gemini
 * ```typescript
 * import { decode } from '@web-doom/wad';
 * import {
 *   extractTextures,
 *   groupTexturesByCategory,
 *   createTransformerPipeline,
 * } from '@web-doom/texture-transformer';
 *
 * // Load WAD file
 * const wadBuffer = await fs.readFile('freedoom1.wad');
 * const wad = decode(wadBuffer);
 *
 * // Extract and group textures
 * const textures = extractTextures(wad);
 * const groups = groupTexturesByCategory(textures);
 *
 * // Transform textures using Gemini
 * const pipeline = createTransformerPipeline({
 *   defaultTransformer: 'gemini',
 *   gemini: { apiKey: process.env.GEMINI_API_KEY },
 * });
 *
 * const results = await pipeline.transformGroup(
 *   groups[0],
 *   { style: 'with cyberpunk neon aesthetic' }
 * );
 * ```
 *
 * @example Using Nanobanana i2i
 * ```typescript
 * import {
 *   createTransformerPipeline,
 *   createBatchProcessor,
 * } from '@web-doom/texture-transformer';
 *
 * // Create pipeline with Nanobanana
 * const pipeline = createTransformerPipeline({
 *   defaultTransformer: 'nanobanana',
 *   nanobanana: {
 *     apiKey: process.env.NANOBANANA_API_KEY,
 *     endpoint: 'https://api.nanobanana.ai/v1/i2i',
 *   },
 * });
 *
 * // Process with batch processor
 * const processor = createBatchProcessor({
 *   pipeline: {
 *     defaultTransformer: 'nanobanana',
 *     nanobanana: { apiKey: process.env.NANOBANANA_API_KEY },
 *   },
 *   defaultConcurrency: 5,
 * });
 *
 * const { results, stats } = await processor.processGroups(groups, {
 *   transformer: 'nanobanana',
 *   nanobananaOptions: {
 *     strength: 0.8,
 *     steps: 30,
 *     guidanceScale: 7.5,
 *   },
 * });
 * ```
 *
 * @example Group batch transformation
 * ```typescript
 * import {
 *   createBatchProcessor,
 *   createSemanticGroups,
 * } from '@web-doom/texture-transformer';
 *
 * // Create semantic groups
 * const groups = createSemanticGroups(textures);
 *
 * // Create custom configurations for each group
 * const configs = [
 *   {
 *     group: groups.get('player-sprites')!,
 *     options: {
 *       transformer: 'nanobanana',
 *       nanobananaOptions: { strength: 0.7 },
 *     },
 *     promptOverride: 'Transform to anime-style character sprites',
 *   },
 *   {
 *     group: groups.get('weapons')!,
 *     options: {
 *       transformer: 'gemini',
 *       style: 'with sci-fi futuristic design',
 *     },
 *   },
 * ];
 *
 * const processor = createBatchProcessor();
 * const { results } = await processor.processGroupsWithConfig(configs);
 * await processor.saveResults(results, './output');
 * ```
 */

// Core types
export type {
  ExtractedTexture,
  TextureGroup,
  TransformationResult,
  CatalogEntry,
  TransformOptions,
  NanobananaOptions,
  ImageTransformer,
  BatchTransformOptions,
  GroupTransformConfig,
} from './core/types';

export { TextureCategory } from './core/types';

// Texture extraction
export {
  extractTextures,
  extractTexturesByCategory,
  extractTexturesByPattern,
  determineCategory,
  isPictureLump,
  pictureToBase64PNG,
} from './extractors/texture-extractor';

// Texture grouping
export {
  groupTexturesByCategory,
  groupTexturesByPrefix,
  createSemanticGroups,
  buildTransformPrompt,
  buildBatchPrompt,
  getCategoryDescription,
} from './groupers/texture-grouper';

// Transformers
export {
  GeminiClient,
  createGeminiClient,
  prepareImageForGemini,
  type GeminiConfig,
} from './transformers/gemini-client';

export {
  NanobananaClient,
  createNanobananaClient,
  type NanobananaConfig,
} from './transformers/nanobanana-client';

export {
  UnifiedTransformerClient,
  createImageTransformer,
  transformTexture,
  type UnifiedTransformerConfig,
  type TransformerBackend,
} from './transformers/unified-client';

export {
  TransformerPipeline,
  createTransformerPipeline,
  type TransformerPipelineConfig,
} from './transformers/transformer-pipeline';

export {
  BatchProcessor,
  createBatchProcessor,
  type BatchProcessConfig,
  type ProcessingStats,
} from './transformers/batch-processor';

// Freedoom catalog
export {
  FREEDOOM_CATALOG,
  getCatalogEntry,
  getCatalogByCategory,
  buildCatalogPrompt,
} from './catalog/freedoom-catalog';

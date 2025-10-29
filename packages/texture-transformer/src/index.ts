/**
 * @web-doom/texture-transformer
 *
 * WAD texture transformation using Gemini AI image-to-image generation
 *
 * Features:
 * - Extract textures from WAD files
 * - Categorize and group textures
 * - Transform textures using Gemini AI
 * - Freedoom texture catalog with prompt templates
 *
 * @example Basic usage
 * ```typescript
 * import { decode } from '@web-doom/wad';
 * import {
 *   extractTextures,
 *   groupTexturesByCategory,
 *   createGeminiClient,
 *   transformTextureBatch,
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
 * // Transform textures
 * const client = createGeminiClient(process.env.GEMINI_API_KEY);
 * const results = await transformTextureBatch(
 *   client,
 *   groups[0].textures,
 *   { style: 'with cyberpunk neon aesthetic' }
 * );
 * ```
 */

// Types
export type {
  ExtractedTexture,
  TextureGroup,
  TransformationResult,
  CatalogEntry,
  TransformOptions,
} from './types';

export { TextureCategory } from './types';

// Texture extraction
export {
  extractTextures,
  extractTexturesByCategory,
  extractTexturesByPattern,
  determineCategory,
  isPictureLump,
  pictureToBase64PNG,
} from './texture-extractor';

// Texture grouping
export {
  groupTexturesByCategory,
  groupTexturesByPrefix,
  createSemanticGroups,
  buildTransformPrompt,
  buildBatchPrompt,
  getCategoryDescription,
} from './texture-grouper';

// Image transformation
export {
  createGeminiClient,
  transformTexture,
  transformTextureBatch,
  transformTexturesConcurrent,
  saveTransformationResults,
  prepareImageForGemini,
} from './image-transformer';

// Freedoom catalog
export {
  FREEDOOM_CATALOG,
  getCatalogEntry,
  getCatalogByCategory,
  buildCatalogPrompt,
} from './freedoom-catalog';

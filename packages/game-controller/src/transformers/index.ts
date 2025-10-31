/**
 * Controller image transformation module
 *
 * Provides AI-powered styling for game controller images
 * using multiple backend services (Nanobanana, Gemini, etc.)
 */

// Types
export type {
  ControllerImage,
  ControllerTransformResult,
  ControllerTransformOptions,
  ImageTransformBackendOptions,
  NanobananaTransformOptions,
  GeminiTransformOptions,
  ImageTransformerBackend,
  ImageTransformerConfig,
} from './types';

export { buildControllerPrompt } from './types';

// Asset types for pre-generated controller images
export type { ControllerAsset, ControllerAssetsManifest } from './assets';
export { getAssetsByOrientation, getAssetById, getAssetUrl } from './assets';

// Theme system
export type { ControllerTheme } from './themes';
export {
  CONTROLLER_THEMES,
  THEME_CATEGORIES,
  getTheme,
  getAllThemes,
  getThemesByCategory,
  getDefaultTheme,
} from './themes';

// Image conversion utilities (browser)
export {
  svgToPng,
  extractBase64 as extractBase64Browser,
  getImageDimensions,
  isValidImageDataUrl,
} from './image-converter';

// Image conversion utilities (Node.js/Bun)
export {
  svgToPngNode,
  extractBase64,
  isNodeEnvironment,
} from './image-converter-node';

// Backends
export {
  NanobananaBackend,
  createNanobananaBackend,
  type NanobananaBackendConfig,
} from './nanobanana-backend';

export {
  GeminiBackend,
  createGeminiBackend,
  type GeminiBackendConfig,
} from './gemini-backend';

// Main client
export {
  ImageTransformerClient,
  createImageTransformerClient,
  transformController,
} from './image-transformer-client';

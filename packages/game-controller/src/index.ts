/**
 * @web-doom/game-controller
 *
 * Game controller library with touch, pointer events, and gamepad API support
 * for web-doom
 */

// Main component
export { GameController } from './components/GameController';
export type { GameControllerProps } from './components/GameController';

// Types
export type {
  ButtonType,
  ButtonState,
  Rect,
  Circle,
  HitRegion,
  ButtonSchema,
  DPadSchema,
  StickSchema,
  ControllerSchema,
  ControllerInputEvent,
  ControllerState,
  InputCallback,
  PointerInfo,
} from './types';

// Schemas
export { doomControllerSchema, doomControllerSchemaPortrait } from './schemas/doom-controller';

// Utilities
export {
  generateControllerSVG,
  generateControllerImage,
  svgToDataURL,
} from './utils/svg-generator';

export {
  hitTest,
  findHitButton,
  getButtonById,
  getRelativeCoordinates,
} from './utils/hit-detection';

// Input handler (for advanced usage)
export { InputHandler } from './input/input-handler';

// Image transformation (AI-powered styling)
export type {
  ControllerImage,
  ControllerTransformResult,
  ControllerTransformOptions,
  ImageTransformBackendOptions,
  NanobananaTransformOptions,
  GeminiTransformOptions,
  ImageTransformerBackend,
  ImageTransformerConfig,
  ControllerAsset,
  ControllerAssetsManifest,
  ControllerTheme,
} from './transformers';

export {
  buildControllerPrompt,
  svgToPng,
  svgToPngNode,
  extractBase64Browser,
  extractBase64,
  getImageDimensions,
  isValidImageDataUrl,
  isNodeEnvironment,
  NanobananaBackend,
  createNanobananaBackend,
  GeminiBackend,
  createGeminiBackend,
  ImageTransformerClient,
  createImageTransformerClient,
  transformController,
  getAssetsByOrientation,
  getAssetById,
  getAssetUrl,
  CONTROLLER_THEMES,
  THEME_CATEGORIES,
  getTheme,
  getAllThemes,
  getThemesByCategory,
  getDefaultTheme,
} from './transformers';

// Theme-aware components and hooks
export { ThemedController, ThemeSelector } from './components/ThemedController';
export type { ThemedControllerProps, ThemeSelectorProps } from './components/ThemedController';
export { useThemedController, usePreloadThemes } from './hooks/useThemedController';
export type { ThemedControllerOptions, ThemedControllerResult } from './hooks/useThemedController';

// Debug utilities
export function enableControllerDebug(enabled: boolean = true): void {
  (window as any).__CONTROLLER_DEBUG__ = enabled;
}

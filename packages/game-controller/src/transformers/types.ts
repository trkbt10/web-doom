/**
 * Type definitions for controller image transformation
 */

import type { ControllerSchema as BaseControllerSchema } from '../types';

// Re-export ControllerSchema for convenience
export type { ControllerSchema } from '../types';

/**
 * Controller image with metadata
 */
export interface ControllerImage {
  /** Controller schema */
  schema: BaseControllerSchema;
  /** Image data (base64 PNG or SVG) */
  imageData: string;
  /** Image format */
  format: 'svg' | 'png';
  /** Image width */
  width: number;
  /** Image height */
  height: number;
}

/**
 * Controller transformation result
 */
export interface ControllerTransformResult {
  /** Original controller image */
  original: ControllerImage;
  /** Transformed image data (base64 PNG) */
  transformed: string;
  /** Prompt used for transformation */
  prompt: string;
  /** Transformation status */
  status: 'success' | 'failed';
  /** Error message if failed */
  error?: string;
  /** Transformation metadata */
  metadata?: {
    model?: string;
    seed?: number;
    steps?: number;
    strength?: number;
  };
}

/**
 * Controller transformation options
 */
export interface ControllerTransformOptions {
  /** Style/theme to apply (e.g., "cyberpunk", "retro arcade", "neon") */
  style?: string;
  /** Custom prompt additions */
  customPrompt?: string;
  /** Full prompt override (ignores style and schema-based prompt) */
  promptOverride?: string;
  /** Backend-specific options */
  backendOptions?: ImageTransformBackendOptions;
}

/**
 * Image transformation backend options
 */
export interface ImageTransformBackendOptions {
  /** Nanobanana-specific options */
  nanobanana?: NanobananaTransformOptions;
  /** Gemini-specific options (future) */
  gemini?: GeminiTransformOptions;
}

/**
 * Nanobanana i2i transformation options
 */
export interface NanobananaTransformOptions {
  /** Model ID to use */
  modelId?: string;
  /** Strength of transformation (0-1) */
  strength?: number;
  /** Number of inference steps */
  steps?: number;
  /** Guidance scale for prompt adherence */
  guidanceScale?: number;
  /** Random seed for reproducibility */
  seed?: number;
  /** Negative prompt (what to avoid) */
  negativePrompt?: string;
}

/**
 * Gemini transformation options (future implementation)
 */
export interface GeminiTransformOptions {
  /** Model version */
  modelVersion?: string;
  /** Temperature for generation */
  temperature?: number;
}

/**
 * Image transformer backend interface
 */
export interface ImageTransformerBackend {
  /** Backend name */
  readonly name: string;

  /**
   * Transform a controller image
   */
  transform(
    image: ControllerImage,
    options: ControllerTransformOptions
  ): Promise<ControllerTransformResult>;

  /**
   * Check if backend is available and configured
   */
  isAvailable(): boolean;
}

/**
 * Image transformer client configuration
 */
export interface ImageTransformerConfig {
  /** Backend type */
  backend: 'nanobanana' | 'gemini' | 'auto';
  /** API endpoint URL */
  endpoint?: string;
  /** API key for authentication */
  apiKey?: string;
  /** Request timeout (ms) */
  timeout?: number;
  /** Default model to use */
  defaultModel?: string;
}

/**
 * Build a prompt for controller transformation
 */
export function buildControllerPrompt(
  schema: BaseControllerSchema,
  style?: string
): string {
  const basePrompt = `A ${schema.name} game controller with buttons and controls.`;

  const stylePrompt = style
    ? ` Style: ${style}.`
    : ' Maintain a clean, functional design.';

  const detailPrompt = ' High quality, detailed rendering. Preserve button layout and structure.';

  return basePrompt + stylePrompt + detailPrompt;
}

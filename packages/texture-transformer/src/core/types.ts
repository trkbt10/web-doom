/**
 * Type definitions for texture transformation
 */

/**
 * Extracted texture with metadata
 */
export interface ExtractedTexture {
  /** Lump name */
  name: string;
  /** PNG image data (base64) */
  imageData: string;
  /** Original width */
  width: number;
  /** Original height */
  height: number;
  /** Texture category (sprite, wall, flat, etc.) */
  category: TextureCategory;
}

/**
 * Texture category based on lump name patterns
 */
export enum TextureCategory {
  /** Sprite (things, monsters, items) - starts with specific prefixes */
  SPRITE = 'sprite',
  /** Wall texture - between TEXTURE1/TEXTURE2 or specific patterns */
  WALL = 'wall',
  /** Flat (floor/ceiling) - between F_START and F_END */
  FLAT = 'flat',
  /** Patch - between P_START and P_END */
  PATCH = 'patch',
  /** HUD graphics - starts with ST (status bar) */
  HUD = 'hud',
  /** Menu graphics - M_ prefix */
  MENU = 'menu',
  /** Unknown/Other */
  OTHER = 'other',
}

/**
 * Texture group with common characteristics
 */
export interface TextureGroup {
  /** Group category */
  category: TextureCategory;
  /** Group name/description */
  name: string;
  /** Textures in this group */
  textures: ExtractedTexture[];
  /** AI prompt for this group */
  prompt: string;
}

/**
 * Transformation result
 */
export interface TransformationResult {
  /** Original texture */
  original: ExtractedTexture;
  /** Transformed image data (base64 PNG) */
  transformed: string;
  /** Prompt used for transformation */
  prompt: string;
  /** Transformation status */
  status: 'success' | 'failed';
  /** Error message if failed */
  error?: string;
}

/**
 * Texture catalog entry
 */
export interface CatalogEntry {
  /** Lump name */
  name: string;
  /** Category */
  category: TextureCategory;
  /** Description */
  description: string;
  /** Suggested prompt template */
  promptTemplate?: string;
}

/**
 * Texture transformation options
 */
export interface TransformOptions {
  /** Style/theme to apply */
  style?: string;
  /** Custom prompt additions */
  customPrompt?: string;
  /** Whether to preserve transparency */
  preserveTransparency?: boolean;
  /** Target size (if different from original) */
  targetSize?: { width: number; height: number };
  /** Transformer type to use */
  transformer?: 'gemini' | 'nanobanana';
  /** Nanobanana-specific options */
  nanobananaOptions?: NanobananaOptions;
}

/**
 * Nanobanana i2i transformation options
 */
export interface NanobananaOptions {
  /** Model ID to use (e.g., 'nanobanana-i2i-v1') */
  modelId?: string;
  /** Strength of transformation (0-1, higher = more deviation from original) */
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
 * Image transformer interface
 */
export interface ImageTransformer {
  /** Transform a single texture */
  transform(
    texture: ExtractedTexture,
    options: TransformOptions
  ): Promise<TransformationResult>;

  /** Transform multiple textures in batch */
  transformBatch(
    textures: ExtractedTexture[],
    options: TransformOptions,
    onProgress?: (completed: number, total: number) => void
  ): Promise<TransformationResult[]>;
}

/**
 * Batch transformation options
 */
export interface BatchTransformOptions extends TransformOptions {
  /** Concurrency level for parallel processing */
  concurrency?: number;
  /** Delay between requests (ms) */
  delayMs?: number;
  /** Progress callback */
  onProgress?: (completed: number, total: number) => void;
}

/**
 * Group transformation configuration
 */
export interface GroupTransformConfig {
  /** Group to transform */
  group: TextureGroup;
  /** Options for this group */
  options: TransformOptions;
  /** Custom prompt override for this group */
  promptOverride?: string;
}

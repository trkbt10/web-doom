/**
 * Sprite Sheet Coordinate Transformation Utilities
 *
 * Provides common coordinate transformation logic for sprite sheet packing,
 * guideline rendering, and texture extraction to ensure consistency.
 */

/**
 * Configuration constants for sprite sheet layout
 */
export const SPRITE_LAYOUT_CONFIG = {
  /** Padding inside cell boundary (space for guidelines and labels) */
  PADDING: 12,
  /** Gap between sprite cells */
  GAP: 8,
  /** Height reserved for sprite name label */
  LABEL_HEIGHT: 20,
  /** Guideline offset from content area (ensures guidelines don't overlap sprites) */
  GUIDELINE_OFFSET: 3,
} as const;

/**
 * Represents the layout of a single sprite in the sprite sheet
 */
export interface SpriteLayout {
  /** Sprite name */
  name: string;
  /** Cell boundary (entire allocated space including padding) */
  cell: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Content area (actual sprite image) */
  content: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Guideline rectangle positions (outside content area) */
  guidelines: {
    outer: { x: number; y: number; width: number; height: number };
    inner: { x: number; y: number; width: number; height: number };
  };
  /** Label position */
  label: {
    x: number;
    y: number;
  };
}

/**
 * Calculate sprite layout from texture dimensions and position
 */
export function calculateSpriteLayout(
  name: string,
  cellX: number,
  cellY: number,
  textureWidth: number,
  textureHeight: number
): SpriteLayout {
  const { PADDING, LABEL_HEIGHT, GUIDELINE_OFFSET } = SPRITE_LAYOUT_CONFIG;

  // Cell dimensions (includes padding for guidelines and label)
  const cellWidth = textureWidth + PADDING * 2;
  const cellHeight = textureHeight + PADDING * 2 + LABEL_HEIGHT;

  // Content area (actual sprite image)
  const contentX = cellX + PADDING;
  const contentY = cellY + PADDING;

  // Guideline positions (offset from content to avoid overlap)
  const guidelineOuter = {
    x: cellX + GUIDELINE_OFFSET,
    y: cellY + GUIDELINE_OFFSET,
    width: cellWidth - GUIDELINE_OFFSET * 2,
    height: cellHeight - GUIDELINE_OFFSET * 2,
  };

  const guidelineInner = {
    x: contentX - GUIDELINE_OFFSET,
    y: contentY - GUIDELINE_OFFSET,
    width: textureWidth + GUIDELINE_OFFSET * 2,
    height: textureHeight + GUIDELINE_OFFSET * 2,
  };

  // Label position (centered below content)
  const labelX = contentX + textureWidth / 2;
  const labelY = contentY + textureHeight + 16;

  return {
    name,
    cell: {
      x: cellX,
      y: cellY,
      width: cellWidth,
      height: cellHeight,
    },
    content: {
      x: contentX,
      y: contentY,
      width: textureWidth,
      height: textureHeight,
    },
    guidelines: {
      outer: guidelineOuter,
      inner: guidelineInner,
    },
    label: {
      x: labelX,
      y: labelY,
    },
  };
}

/**
 * Calculate total cell dimensions for a texture
 */
export function calculateCellDimensions(
  textureWidth: number,
  textureHeight: number
): { width: number; height: number } {
  const { PADDING, LABEL_HEIGHT, GAP } = SPRITE_LAYOUT_CONFIG;

  return {
    width: textureWidth + PADDING * 2 + GAP,
    height: textureHeight + PADDING * 2 + LABEL_HEIGHT + GAP,
  };
}

/**
 * Get extraction rectangle for a sprite from transformed sprite sheet
 * This is the content area that should be extracted
 */
export function getExtractionRect(layout: SpriteLayout) {
  return {
    left: layout.content.x,
    top: layout.content.y,
    width: layout.content.width,
    height: layout.content.height,
  };
}

/**
 * Calculate optimal canvas size for given textures
 * Returns a power-of-2 size that can fit all textures
 */
export function calculateOptimalCanvasSize(
  textures: Array<{ width: number; height: number }>,
  maxSize: number = 2048
): { width: number; height: number } {
  // Calculate total area needed
  const totalArea = textures.reduce((sum, texture) => {
    const cell = calculateCellDimensions(texture.width, texture.height);
    return sum + cell.width * cell.height;
  }, 0);

  // Start with square canvas
  let size = nextPowerOf2(Math.ceil(Math.sqrt(totalArea) * 1.3));

  // Ensure within max size
  size = Math.min(size, maxSize);

  // Try to use rectangular canvas for better packing
  // If sprites are tall, use 2:1 ratio (width:height)
  // If sprites are wide, use 1:2 ratio
  const avgAspect = textures.reduce((sum, t) => sum + t.width / t.height, 0) / textures.length;

  if (avgAspect > 1.5) {
    // Wide sprites - prefer wider canvas
    return { width: size, height: Math.max(size / 2, 512) };
  } else if (avgAspect < 0.67) {
    // Tall sprites - prefer taller canvas
    return { width: Math.max(size / 2, 512), height: size };
  }

  // Default to square
  return { width: size, height: size };
}

/**
 * Get next power of 2 for a given number
 */
function nextPowerOf2(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(Math.max(n, 1))));
}

/**
 * Validate that a sprite layout fits within canvas bounds
 */
export function validateLayout(
  layout: SpriteLayout,
  canvasWidth: number,
  canvasHeight: number
): boolean {
  const { cell, content, label } = layout;

  // Check cell bounds
  if (cell.x < 0 || cell.y < 0) return false;
  if (cell.x + cell.width > canvasWidth) return false;
  if (cell.y + cell.height > canvasHeight) return false;

  // Check content bounds
  if (content.x < 0 || content.y < 0) return false;
  if (content.x + content.width > canvasWidth) return false;
  if (content.y + content.height > canvasHeight) return false;

  // Check label position
  if (label.y > canvasHeight) return false;

  return true;
}

/**
 * Sprite sheet packing utilities
 * Uses an improved bin-packing algorithm to arrange textures efficiently
 */

import {
  calculateSpriteLayout,
  calculateCellDimensions,
  calculateOptimalCanvasSize,
  validateLayout,
  type SpriteLayout,
} from './sprite-coordinates';

export interface PackedTexture {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  imageData: Buffer;
  // Content area (excluding padding)
  contentX: number;
  contentY: number;
  contentWidth: number;
  contentHeight: number;
  // Full layout information
  layout: SpriteLayout;
}

export interface PackResult {
  width: number;
  height: number;
  textures: PackedTexture[];
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TextureGroup {
  name: string;
  textures: Array<{ name: string; width: number; height: number; imageData: Buffer }>;
  sizeCategory: 'small' | 'medium' | 'large';
}

/**
 * Improved bin-packing algorithm with better space utilization
 * Features:
 * - Groups textures by size for better packing efficiency
 * - Uses shelf packing with height-based sorting
 * - Optimizes for target sizes (e.g., 512x512, 1024x1024)
 * - Places larger items around perimeter first
 */
export function packTextures(
  textures: Array<{ name: string; width: number; height: number; imageData: Buffer }>,
  options: {
    targetSize?: number;
    maxSize?: number;
    allowRectangular?: boolean;
  } = {}
): PackResult {
  if (textures.length === 0) {
    return { width: 0, height: 0, textures: [] };
  }

  const targetSize = options.targetSize || 1024;
  const maxSize = options.maxSize || 2048;
  // allowRectangular is currently always true, but kept in options for future use
  // const allowRectangular = options.allowRectangular ?? true;

  // Group textures by size
  const groups = groupTexturesBySize(textures);

  // Sort groups: large first (for perimeter placement), then medium, then small
  const sortedGroups = [
    ...groups.filter(g => g.sizeCategory === 'large'),
    ...groups.filter(g => g.sizeCategory === 'medium'),
    ...groups.filter(g => g.sizeCategory === 'small'),
  ];

  // Flatten and sort within groups by height (descending)
  const sorted = sortedGroups
    .flatMap(g => g.textures)
    .sort((a, b) => b.height - a.height);

  // Calculate optimal canvas size
  let { width: canvasWidth, height: canvasHeight } = calculateOptimalCanvasSize(sorted, maxSize);

  // Try to fit within target size first
  if (canvasWidth > targetSize || canvasHeight > targetSize) {
    canvasWidth = targetSize;
    canvasHeight = targetSize;
  }

  // Try to pack with increasing canvas sizes until successful
  let packed: PackedTexture[] | null = null;
  let attempts = 0;
  const maxAttempts = 10;

  while (packed === null && attempts < maxAttempts) {
    packed = tryPack(sorted, canvasWidth, canvasHeight);
    if (packed === null) {
      // Intelligently increase canvas size
      if (canvasWidth === canvasHeight) {
        // If square, try doubling width first for better aspect ratio
        canvasWidth = Math.min(canvasWidth * 2, maxSize);
      } else if (canvasWidth < canvasHeight) {
        canvasWidth = Math.min(canvasWidth * 2, maxSize);
      } else {
        canvasHeight = Math.min(canvasHeight * 2, maxSize);
      }

      // If both dimensions hit max, we failed
      if (canvasWidth === maxSize && canvasHeight === maxSize && packed === null) {
        break;
      }

      attempts++;
    }
  }

  if (packed === null) {
    throw new Error('Failed to pack textures into sprite sheet. Consider reducing texture count or sizes.');
  }

  return {
    width: canvasWidth,
    height: canvasHeight,
    textures: packed,
  };
}

/**
 * Group textures by size category for better packing
 */
function groupTexturesBySize(
  textures: Array<{ name: string; width: number; height: number; imageData: Buffer }>
): TextureGroup[] {
  const small: typeof textures = [];
  const medium: typeof textures = [];
  const large: typeof textures = [];

  for (const texture of textures) {
    const maxDim = Math.max(texture.width, texture.height);
    const area = texture.width * texture.height;

    if (maxDim > 128 || area > 16384) {
      large.push(texture);
    } else if (maxDim > 64 || area > 4096) {
      medium.push(texture);
    } else {
      small.push(texture);
    }
  }

  return [
    { name: 'large', textures: large, sizeCategory: 'large' },
    { name: 'medium', textures: medium, sizeCategory: 'medium' },
    { name: 'small', textures: small, sizeCategory: 'small' },
  ];
}

/**
 * Attempt to pack textures into given canvas size using improved shelf algorithm
 */
function tryPack(
  textures: Array<{ name: string; width: number; height: number; imageData: Buffer }>,
  canvasWidth: number,
  canvasHeight: number
): PackedTexture[] | null {
  const packed: PackedTexture[] = [];
  const shelves: Rectangle[] = [];

  for (const texture of textures) {
    // Calculate cell dimensions using shared utilities
    const cellDims = calculateCellDimensions(texture.width, texture.height);

    let placed = false;
    let placementX = 0;
    let placementY = 0;

    // Try to place on existing shelves
    for (const shelf of shelves) {
      if (cellDims.width <= shelf.width && cellDims.height <= shelf.height) {
        placementX = shelf.x;
        placementY = shelf.y;

        // Update shelf (reduce available width)
        shelf.x += cellDims.width;
        shelf.width -= cellDims.width;
        placed = true;
        break;
      }
    }

    if (!placed) {
      // Create new shelf
      const newShelfY = shelves.length > 0
        ? Math.max(...shelves.map(s => s.y + s.height))
        : 0;

      // Check if texture fits in canvas
      if (cellDims.width > canvasWidth || newShelfY + cellDims.height > canvasHeight) {
        return null; // Doesn't fit
      }

      placementX = 0;
      placementY = newShelfY;

      // Add new shelf
      shelves.push({
        x: cellDims.width,
        y: newShelfY,
        width: canvasWidth - cellDims.width,
        height: cellDims.height,
      });
    }

    // Calculate complete sprite layout using shared utilities
    const layout = calculateSpriteLayout(
      texture.name,
      placementX,
      placementY,
      texture.width,
      texture.height
    );

    // Validate layout fits in canvas
    if (!validateLayout(layout, canvasWidth, canvasHeight)) {
      return null;
    }

    // Create packed texture entry
    packed.push({
      name: texture.name,
      x: layout.cell.x,
      y: layout.cell.y,
      width: layout.cell.width,
      height: layout.cell.height,
      imageData: texture.imageData,
      // Content area (where actual image goes)
      contentX: layout.content.x,
      contentY: layout.content.y,
      contentWidth: layout.content.width,
      contentHeight: layout.content.height,
      layout,
    });
  }

  return packed;
}

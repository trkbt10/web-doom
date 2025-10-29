/**
 * Image Converter
 *
 * Convert between DOOM pictures and standard image formats using Canvas API
 */

import type { DoomPicture } from './picture';
import { decodePicture, createPicture, encodePicture } from './picture';

/**
 * Default DOOM palette (256 RGB colors)
 * This is a simplified version - for accurate colors, load PLAYPAL from WAD
 */
export const DEFAULT_DOOM_PALETTE: [number, number, number][] = (() => {
  const palette: [number, number, number][] = [];

  // Generate a basic grayscale palette as fallback
  for (let i = 0; i < 256; i++) {
    palette.push([i, i, i]);
  }

  return palette;
})();

/**
 * Options for picture to canvas conversion
 */
export interface PictureToCanvasOptions {
  /** Color palette (256 RGB colors). Defaults to grayscale */
  palette?: [number, number, number][];
  /** Background color for transparent pixels [R, G, B, A] */
  backgroundColor?: [number, number, number, number];
  /** Scale factor (default: 1) */
  scale?: number;
}

/**
 * Options for canvas to picture conversion
 */
export interface CanvasToPictureOptions {
  /** Color palette to match against */
  palette?: [number, number, number][];
  /** Threshold for considering a pixel transparent (alpha < threshold) */
  transparencyThreshold?: number;
  /** Left offset for sprite alignment */
  leftOffset?: number;
  /** Top offset for sprite alignment */
  topOffset?: number;
}

/**
 * Convert DOOM picture to Canvas
 */
export function pictureToCanvas(
  picture: DoomPicture,
  options: PictureToCanvasOptions = {}
): HTMLCanvasElement {
  const {
    palette = DEFAULT_DOOM_PALETTE,
    backgroundColor = [0, 0, 0, 0],
    scale = 1,
  } = options;

  const canvas = document.createElement('canvas');
  canvas.width = picture.header.width * scale;
  canvas.height = picture.header.height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }

  // Create image data
  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const data = imageData.data;

  for (let y = 0; y < picture.header.height; y++) {
    for (let x = 0; x < picture.header.width; x++) {
      const paletteIndex = picture.pixels[y][x];

      let r, g, b, a;
      if (paletteIndex === null || paletteIndex === undefined) {
        // Transparent pixel
        [r, g, b, a] = backgroundColor;
      } else {
        // Get color from palette
        const color = palette[paletteIndex] || [255, 0, 255]; // Magenta for missing colors
        [r, g, b] = color;
        a = 255;
      }

      // Apply scale
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const pixelIndex = ((y * scale + sy) * canvas.width + (x * scale + sx)) * 4;
          data[pixelIndex] = r;
          data[pixelIndex + 1] = g;
          data[pixelIndex + 2] = b;
          data[pixelIndex + 3] = a;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

/**
 * Find closest palette index for given RGB color
 */
function findClosestPaletteIndex(
  r: number,
  g: number,
  b: number,
  palette: [number, number, number][]
): number {
  let minDistance = Infinity;
  let closestIndex = 0;

  for (let i = 0; i < palette.length; i++) {
    const [pr, pg, pb] = palette[i];
    const distance =
      Math.pow(r - pr, 2) + Math.pow(g - pg, 2) + Math.pow(b - pb, 2);

    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = i;
    }
  }

  return closestIndex;
}

/**
 * Convert Canvas to DOOM picture
 */
export function canvasToPicture(
  canvas: HTMLCanvasElement,
  options: CanvasToPictureOptions = {}
): DoomPicture {
  const {
    palette = DEFAULT_DOOM_PALETTE,
    transparencyThreshold = 128,
    leftOffset = 0,
    topOffset = 0,
  } = options;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Convert to 2D pixel array
  const pixels: (number | null)[][] = [];
  for (let y = 0; y < canvas.height; y++) {
    pixels[y] = [];
    for (let x = 0; x < canvas.width; x++) {
      const pixelIndex = (y * canvas.width + x) * 4;
      const r = data[pixelIndex];
      const g = data[pixelIndex + 1];
      const b = data[pixelIndex + 2];
      const a = data[pixelIndex + 3];

      if (a < transparencyThreshold) {
        pixels[y][x] = null; // Transparent
      } else {
        pixels[y][x] = findClosestPaletteIndex(r, g, b, palette);
      }
    }
  }

  return createPicture(pixels, leftOffset, topOffset);
}

/**
 * Load image from URL and convert to canvas
 */
export async function loadImageToCanvas(url: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get 2D context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Load image from File and convert to canvas
 */
export async function loadFileToCanvas(file: File): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const canvas = await loadImageToCanvas(url);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Convert canvas to PNG Blob
 */
export async function canvasToPNG(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to convert canvas to blob'));
      }
    }, 'image/png');
  });
}

/**
 * Convert canvas to PNG Data URL
 */
export function canvasToDataURL(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

/**
 * Convert DOOM picture lump data to PNG Data URL
 */
export function pictureLumpToDataURL(
  lumpData: ArrayBuffer,
  options: PictureToCanvasOptions = {}
): string {
  const picture = decodePicture(lumpData);
  const canvas = pictureToCanvas(picture, options);
  return canvasToDataURL(canvas);
}

/**
 * Convert PNG file to DOOM picture lump data
 */
export async function pngFileToPictureLump(
  file: File,
  options: CanvasToPictureOptions = {}
): Promise<ArrayBuffer> {
  const canvas = await loadFileToCanvas(file);
  const picture = canvasToPicture(canvas, options);
  return encodePicture(picture);
}

/**
 * Parse PLAYPAL lump to get DOOM palette
 */
export function parsePaletteFromPLAYPAL(
  playpalData: ArrayBuffer
): [number, number, number][] {
  const palette: [number, number, number][] = [];
  const bytes = new Uint8Array(playpalData);

  // PLAYPAL contains 14 palettes of 256 colors each (RGB)
  // We use the first palette (first 768 bytes)
  for (let i = 0; i < 256; i++) {
    const offset = i * 3;
    palette.push([bytes[offset], bytes[offset + 1], bytes[offset + 2]]);
  }

  return palette;
}

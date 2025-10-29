/**
 * Image Conversion Test Helpers
 *
 * Utilities for testing image conversion round-trips
 */

import type { DoomPicture } from './picture';
import {
  decodePicture,
  encodePicture,
  createPicture,
} from './picture';
import {
  pictureToCanvas,
  canvasToPicture,
  type PictureToCanvasOptions,
  type CanvasToPictureOptions,
} from './image-converter';

/**
 * Create a test pattern picture
 */
export function createTestPicture(
  width: number = 64,
  height: number = 64
): DoomPicture {
  const pixels: (number | null)[][] = [];

  for (let y = 0; y < height; y++) {
    pixels[y] = [];
    for (let x = 0; x < width; x++) {
      // Create a test pattern
      if (x < width / 4 || x >= (width * 3) / 4) {
        pixels[y][x] = null; // Transparent edges
      } else if (y < height / 4) {
        pixels[y][x] = 255; // White top
      } else if (y < height / 2) {
        pixels[y][x] = 128; // Gray upper middle
      } else if (y < (height * 3) / 4) {
        pixels[y][x] = 64; // Dark gray lower middle
      } else {
        pixels[y][x] = 0; // Black bottom
      }
    }
  }

  return createPicture(pixels, width / 2, height);
}

/**
 * Compare two pictures for equality
 */
export function comparePictures(
  pic1: DoomPicture,
  pic2: DoomPicture
): {
  identical: boolean;
  differences: string[];
} {
  const differences: string[] = [];

  // Compare headers
  if (pic1.header.width !== pic2.header.width) {
    differences.push(
      `Width mismatch: ${pic1.header.width} !== ${pic2.header.width}`
    );
  }
  if (pic1.header.height !== pic2.header.height) {
    differences.push(
      `Height mismatch: ${pic1.header.height} !== ${pic2.header.height}`
    );
  }
  if (pic1.header.leftOffset !== pic2.header.leftOffset) {
    differences.push(
      `Left offset mismatch: ${pic1.header.leftOffset} !== ${pic2.header.leftOffset}`
    );
  }
  if (pic1.header.topOffset !== pic2.header.topOffset) {
    differences.push(
      `Top offset mismatch: ${pic1.header.topOffset} !== ${pic2.header.topOffset}`
    );
  }

  // Compare pixels
  const minHeight = Math.min(pic1.header.height, pic2.header.height);
  const minWidth = Math.min(pic1.header.width, pic2.header.width);

  for (let y = 0; y < minHeight; y++) {
    for (let x = 0; x < minWidth; x++) {
      const pixel1 = pic1.pixels[y][x];
      const pixel2 = pic2.pixels[y][x];

      if (pixel1 !== pixel2) {
        differences.push(
          `Pixel mismatch at (${x}, ${y}): ${pixel1} !== ${pixel2}`
        );
        // Limit number of pixel differences reported
        if (differences.length > 20) {
          differences.push('... and more pixel differences');
          return { identical: false, differences };
        }
      }
    }
  }

  return {
    identical: differences.length === 0,
    differences,
  };
}

/**
 * Test encode/decode round-trip for pictures
 */
export function testPictureRoundTrip(picture: DoomPicture): {
  success: boolean;
  originalSize: number;
  encodedSize: number;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    // Encode
    const encoded = encodePicture(picture);
    const encodedSize = encoded.byteLength;

    // Decode
    const decoded = decodePicture(encoded);

    // Compare
    const comparison = comparePictures(picture, decoded);
    if (!comparison.identical) {
      errors.push(...comparison.differences);
    }

    return {
      success: errors.length === 0,
      originalSize: 0, // Not easily calculable
      encodedSize,
      errors,
    };
  } catch (error) {
    errors.push(`Exception: ${error}`);
    return {
      success: false,
      originalSize: 0,
      encodedSize: 0,
      errors,
    };
  }
}

/**
 * Test canvas conversion round-trip
 */
export function testCanvasRoundTrip(
  picture: DoomPicture,
  canvasOptions: PictureToCanvasOptions = {},
  pictureOptions: CanvasToPictureOptions = {}
): {
  success: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Convert to canvas
    const canvas = pictureToCanvas(picture, canvasOptions);

    // Convert back to picture
    const roundTrip = canvasToPicture(canvas, {
      ...pictureOptions,
      palette: canvasOptions.palette,
    });

    // Compare dimensions
    if (picture.header.width !== roundTrip.header.width) {
      errors.push(
        `Width mismatch: ${picture.header.width} !== ${roundTrip.header.width}`
      );
    }
    if (picture.header.height !== roundTrip.header.height) {
      errors.push(
        `Height mismatch: ${picture.header.height} !== ${roundTrip.header.height}`
      );
    }

    // Compare pixels (allow some tolerance for color quantization)
    let pixelDifferences = 0;
    for (let y = 0; y < picture.header.height; y++) {
      for (let x = 0; x < picture.header.width; x++) {
        const original = picture.pixels[y][x];
        const converted = roundTrip.pixels[y][x];

        if (original !== converted) {
          pixelDifferences++;
          if (pixelDifferences <= 5) {
            warnings.push(
              `Pixel difference at (${x}, ${y}): ${original} -> ${converted}`
            );
          }
        }
      }
    }

    if (pixelDifferences > 0) {
      warnings.push(
        `Total pixel differences: ${pixelDifferences} / ${picture.header.width * picture.header.height}`
      );
    }

    // If too many differences, consider it an error
    const totalPixels = picture.header.width * picture.header.height;
    const differenceRatio = pixelDifferences / totalPixels;
    if (differenceRatio > 0.1) {
      // More than 10% different
      errors.push(
        `Too many pixel differences: ${(differenceRatio * 100).toFixed(2)}%`
      );
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    errors.push(`Exception: ${error}`);
    return {
      success: false,
      errors,
      warnings,
    };
  }
}

/**
 * Run all round-trip tests on a picture
 */
export function runAllRoundTripTests(picture: DoomPicture): {
  pictureRoundTrip: ReturnType<typeof testPictureRoundTrip>;
  canvasRoundTrip: ReturnType<typeof testCanvasRoundTrip>;
  overall: boolean;
} {
  const pictureRoundTrip = testPictureRoundTrip(picture);
  const canvasRoundTrip = testCanvasRoundTrip(picture);

  return {
    pictureRoundTrip,
    canvasRoundTrip,
    overall: pictureRoundTrip.success && canvasRoundTrip.success,
  };
}

/**
 * Create a simple test picture with known patterns
 */
export function createSimpleTestPicture(): DoomPicture {
  const width = 32;
  const height = 32;
  const pixels: (number | null)[][] = [];

  for (let y = 0; y < height; y++) {
    pixels[y] = [];
    for (let x = 0; x < width; x++) {
      // Checkerboard pattern
      if ((x + y) % 2 === 0) {
        pixels[y][x] = 255; // White
      } else {
        pixels[y][x] = 0; // Black
      }
    }
  }

  return createPicture(pixels, 16, 16);
}

/**
 * Create a test picture with transparency
 */
export function createTransparentTestPicture(): DoomPicture {
  const width = 32;
  const height = 32;
  const pixels: (number | null)[][] = [];

  for (let y = 0; y < height; y++) {
    pixels[y] = [];
    for (let x = 0; x < width; x++) {
      // Circle in center
      const dx = x - width / 2;
      const dy = y - height / 2;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < width / 3) {
        pixels[y][x] = Math.floor((distance / (width / 3)) * 255);
      } else {
        pixels[y][x] = null; // Transparent outside circle
      }
    }
  }

  return createPicture(pixels, 16, 16);
}

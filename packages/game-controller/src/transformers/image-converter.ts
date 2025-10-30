/**
 * Image conversion utilities for controller transformation
 */

/**
 * Convert SVG data URL to PNG data URL
 * Works in browser environment using Canvas API
 */
export async function svgToPng(
  svgDataUrl: string,
  width: number,
  height: number,
  scale: number = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create an image element
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // Create canvas with scaled dimensions for better quality
        const canvas = document.createElement('canvas');
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Scale the context for high-quality rendering
        ctx.scale(scale, scale);

        // Draw the SVG image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to PNG data URL
        const pngDataUrl = canvas.toDataURL('image/png');
        resolve(pngDataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load SVG image'));
    };

    // Start loading the SVG
    img.src = svgDataUrl;
  });
}

/**
 * Extract base64 data from data URL
 */
export function extractBase64(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid base64 data URL format');
  }
  return match[2];
}

/**
 * Get image dimensions from data URL
 */
export async function getImageDimensions(
  dataUrl: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = dataUrl;
  });
}

/**
 * Validate if data URL is valid image format
 */
export function isValidImageDataUrl(dataUrl: string): boolean {
  return /^data:image\/(png|jpeg|jpg|svg\+xml);base64,/.test(dataUrl);
}

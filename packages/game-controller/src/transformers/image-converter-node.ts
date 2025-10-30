/**
 * Server-side image conversion utilities for controller transformation
 * Uses resvg for SVG to PNG conversion in Node.js/Bun environments
 */

/**
 * Convert SVG data URL to PNG data URL (server-side)
 * Uses resvg-js for high-quality SVG rendering
 */
export async function svgToPngNode(
  svgDataUrl: string,
  width: number,
  height: number,
  scale: number = 2
): Promise<string> {
  // Dynamically import resvg-js only in Node environment
  // This prevents bundlers from trying to include it in browser builds
  const { Resvg } = await import('@resvg/resvg-js');

  // Extract SVG content from data URL
  const svgContent = extractSvgContent(svgDataUrl);

  // Render SVG to PNG using resvg
  const resvg = new Resvg(svgContent, {
    fitTo: {
      mode: 'width',
      value: width * scale,
    },
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  // Convert buffer to base64 data URL
  const base64 = Buffer.from(pngBuffer).toString('base64');
  return `data:image/png;base64,${base64}`;
}

/**
 * Extract SVG content from data URL
 */
function extractSvgContent(dataUrl: string): string {
  // Check if it's a data URL
  if (dataUrl.startsWith('data:image/svg+xml;base64,')) {
    // Base64 encoded
    const base64 = dataUrl.replace('data:image/svg+xml;base64,', '');
    return Buffer.from(base64, 'base64').toString('utf-8');
  } else if (dataUrl.startsWith('data:image/svg+xml,')) {
    // URL encoded or plain
    const encoded = dataUrl.replace('data:image/svg+xml,', '');
    return decodeURIComponent(encoded);
  } else if (dataUrl.startsWith('data:image/svg+xml;charset=utf-8,')) {
    // UTF-8 encoded
    const encoded = dataUrl.replace('data:image/svg+xml;charset=utf-8,', '');
    return decodeURIComponent(encoded);
  } else {
    // Assume it's raw SVG
    return dataUrl;
  }
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
 * Check if running in Node.js/Bun environment
 */
export function isNodeEnvironment(): boolean {
  return typeof window === 'undefined' && typeof process !== 'undefined';
}

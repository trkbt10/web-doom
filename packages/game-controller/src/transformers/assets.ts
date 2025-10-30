/**
 * Type definitions for transformed controller assets
 * Used by @web-doom/pages to load pre-generated controller images
 */

export interface ControllerAsset {
  /** Unique identifier for the asset */
  id: string;
  /** Human-readable name */
  name: string;
  /** Filename in the assets directory */
  filename: string;
  /** Controller orientation */
  orientation: 'landscape' | 'portrait';
  /** Style description used for transformation */
  style: string;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** AI model used for generation */
  model?: string;
  /** Random seed used (if applicable) */
  seed?: number;
  /** Full prompt used for transformation */
  prompt?: string;
  /** ISO timestamp of generation */
  generatedAt: string;
}

export interface ControllerAssetsManifest {
  /** Manifest version */
  version: string;
  /** ISO timestamp of manifest generation */
  generatedAt: string;
  /** Backend used for transformation */
  backend: string;
  /** Total number of assets */
  totalAssets: number;
  /** Asset counts by orientation */
  orientations: {
    landscape: number;
    portrait: number;
  };
  /** List of all assets */
  assets: ControllerAsset[];
}

/**
 * Helper to filter assets by orientation
 */
export function getAssetsByOrientation(
  manifest: ControllerAssetsManifest,
  orientation: 'landscape' | 'portrait'
): ControllerAsset[] {
  return manifest.assets.filter((asset) => asset.orientation === orientation);
}

/**
 * Helper to get asset by ID
 */
export function getAssetById(
  manifest: ControllerAssetsManifest,
  id: string
): ControllerAsset | undefined {
  return manifest.assets.find((asset) => asset.id === id);
}

/**
 * Helper to get asset URL (relative to public directory)
 */
export function getAssetUrl(asset: ControllerAsset, baseUrl = '/controllers'): string {
  return `${baseUrl}/${asset.filename}`;
}

/**
 * Example: How to load and use pre-generated controller assets in pages
 *
 * This demonstrates loading the manifest.json and using the styled
 * controller images in your React components.
 */

import type { ControllerAssetsManifest, ControllerAsset } from '@web-doom/game-controller';
import { getAssetsByOrientation, getAssetUrl } from '@web-doom/game-controller';

/**
 * Load controller assets manifest
 */
export async function loadControllerAssets(): Promise<ControllerAssetsManifest> {
  const response = await fetch('/controllers/manifest.json');
  if (!response.ok) {
    throw new Error('Failed to load controller assets manifest');
  }
  return await response.json();
}

/**
 * Example: React component using controller assets
 */
export function ControllerGallery() {
  const [manifest, setManifest] = React.useState<ControllerAssetsManifest | null>(null);
  const [selectedOrientation, setSelectedOrientation] = React.useState<'landscape' | 'portrait'>('landscape');

  React.useEffect(() => {
    loadControllerAssets().then(setManifest);
  }, []);

  if (!manifest) {
    return <div>Loading controller assets...</div>;
  }

  const assets = getAssetsByOrientation(manifest, selectedOrientation);

  return (
    <div>
      <h2>Controller Gallery</h2>
      <p>Generated with {manifest.backend} on {new Date(manifest.generatedAt).toLocaleString()}</p>

      <div>
        <button onClick={() => setSelectedOrientation('landscape')}>
          Landscape ({manifest.orientations.landscape})
        </button>
        <button onClick={() => setSelectedOrientation('portrait')}>
          Portrait ({manifest.orientations.portrait})
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {assets.map((asset) => (
          <div key={asset.id}>
            <img
              src={getAssetUrl(asset)}
              alt={asset.name}
              style={{ width: '100%', height: 'auto' }}
            />
            <h3>{asset.name}</h3>
            <p>{asset.style}</p>
            <small>
              {asset.width}×{asset.height} | Model: {asset.model}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example: Select controller by style
 */
export function selectControllerStyle(
  manifest: ControllerAssetsManifest,
  styleId: string,
  orientation: 'landscape' | 'portrait'
): ControllerAsset | undefined {
  const assetId = `${styleId}-${orientation}`;
  return manifest.assets.find((asset) => asset.id === assetId);
}

/**
 * Example: Get random controller
 */
export function getRandomController(
  manifest: ControllerAssetsManifest,
  orientation?: 'landscape' | 'portrait'
): ControllerAsset {
  const assets = orientation
    ? getAssetsByOrientation(manifest, orientation)
    : manifest.assets;

  const randomIndex = Math.floor(Math.random() * assets.length);
  return assets[randomIndex];
}

/**
 * Example: Preload controller images
 */
export async function preloadControllerImages(manifest: ControllerAssetsManifest): Promise<void> {
  const imagePromises = manifest.assets.map((asset) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = getAssetUrl(asset);
    });
  });

  await Promise.all(imagePromises);
}

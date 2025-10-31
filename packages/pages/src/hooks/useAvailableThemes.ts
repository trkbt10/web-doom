import { useState, useEffect } from 'react';

interface ManifestAsset {
  id: string;
  name: string;
  filename: string;
  orientation: 'landscape' | 'portrait';
  style: string;
}

interface ControllerManifest {
  version: string;
  generatedAt: string;
  backend: string;
  totalAssets: number;
  orientations: {
    landscape: number;
    portrait: number;
  };
  assets: ManifestAsset[];
}

/**
 * Hook to load available themes from manifest.json
 * @param manifestUrl - URL to the manifest.json file
 * @returns Array of available theme IDs
 */
export function useAvailableThemes(manifestUrl: string): {
  themes: string[];
  loading: boolean;
  error: Error | null;
} {
  const [themes, setThemes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadManifest() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(manifestUrl);
        if (!response.ok) {
          throw new Error(`Failed to load manifest: ${response.statusText}`);
        }

        const manifest: ControllerManifest = await response.json();

        // Extract unique theme IDs from asset IDs
        // Asset IDs are in format: "themeid-orientation" (e.g., "doom-landscape")
        const themeSet = new Set<string>();

        for (const asset of manifest.assets) {
          // Remove "-landscape" or "-portrait" suffix to get theme ID
          const themeId = asset.id.replace(/-(?:landscape|portrait)$/, '');
          themeSet.add(themeId);
        }

        if (mounted) {
          setThemes(Array.from(themeSet));
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setLoading(false);
        }
      }
    }

    loadManifest();

    return () => {
      mounted = false;
    };
  }, [manifestUrl]);

  return { themes, loading, error };
}

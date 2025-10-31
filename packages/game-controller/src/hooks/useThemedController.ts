/**
 * React hook for themed controller images
 * Automatically loads or generates themed controller images
 */

import { useState, useEffect, useCallback } from 'react';
import type { ControllerSchema } from '../types';
import type { ControllerTheme } from '../transformers/themes';
import { getTheme, getDefaultTheme } from '../transformers/themes';

export interface ThemedControllerOptions {
  /** Controller schema to use */
  schema: ControllerSchema;
  /** Theme ID or theme object */
  theme?: string | ControllerTheme;
  /** Whether to use cached version if available */
  useCache?: boolean;
  /** Base URL for pre-generated images */
  assetsBaseUrl?: string;
  /** Fallback to original schema if themed version not available */
  fallbackToOriginal?: boolean;
}

export interface ThemedControllerResult {
  /** Image data URL or path */
  imageUrl: string | null;
  /** Whether the image is loading */
  loading: boolean;
  /** Error if failed to load */
  error: Error | null;
  /** Current theme */
  theme: ControllerTheme;
  /** Whether using cached/pre-generated version */
  isCached: boolean;
  /** Retry loading */
  retry: () => void;
}

/**
 * Hook to load themed controller images
 *
 * Usage:
 * ```tsx
 * const { imageUrl, loading, theme } = useThemedController({
 *   schema: doomControllerSchema,
 *   theme: 'cyberpunk',
 * });
 *
 * if (loading) return <div>Loading...</div>;
 * return <img src={imageUrl} alt={theme.name} />;
 * ```
 */
export function useThemedController(
  options: ThemedControllerOptions
): ThemedControllerResult {
  const {
    schema,
    theme: themeInput,
    useCache = true,
    assetsBaseUrl = '/controllers',
    fallbackToOriginal = true,
  } = options;

  // Resolve theme
  const theme =
    typeof themeInput === 'string'
      ? getTheme(themeInput) || getDefaultTheme()
      : themeInput || getDefaultTheme();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isCached, setIsCached] = useState(false);

  const loadImage = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Determine orientation from schema - prefer explicit orientation over dimensions
      const orientation = schema.orientation || (schema.width > schema.height ? 'landscape' : 'portrait');

      console.log('[useThemedController] Loading image:', {
        schemaName: schema.name,
        schemaOrientation: schema.orientation,
        schemaDimensions: `${schema.width}x${schema.height}`,
        determinedOrientation: orientation,
        themeId: theme.id,
        assetsBaseUrl
      });

      // Try to load pre-generated image first
      if (useCache) {
        const cachedUrl = `${assetsBaseUrl}/controller-${orientation}-${theme.id}.png`;
        console.log('[useThemedController] Trying cached URL:', cachedUrl);

        try {
          const response = await fetch(cachedUrl, { method: 'HEAD' });
          if (response.ok) {
            setImageUrl(cachedUrl);
            setIsCached(true);
            setLoading(false);
            return;
          }
        } catch {
          // Pre-generated image not available, will generate or fallback
        }
      }

      // Fallback to original schema SVG
      if (fallbackToOriginal) {
        // Generate SVG from schema (no AI transformation)
        const { generateControllerImage } = await import('../utils/svg-generator');
        const svgUrl = generateControllerImage(schema);
        setImageUrl(svgUrl);
        setIsCached(false);
        setLoading(false);
        return;
      }

      throw new Error('Themed image not available and fallback disabled');
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }
  }, [schema, theme.id, useCache, assetsBaseUrl, fallbackToOriginal]);

  const retry = useCallback(() => {
    loadImage();
  }, [loadImage]);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  return {
    imageUrl,
    loading,
    error,
    theme,
    isCached,
    retry,
  };
}

/**
 * Hook to preload all themed images for a schema
 *
 * Usage:
 * ```tsx
 * const { progress, preloadThemes } = usePreloadThemes();
 *
 * useEffect(() => {
 *   preloadThemes(doomControllerSchema, ['cyberpunk', 'retro', 'neon']);
 * }, []);
 * ```
 */
export function usePreloadThemes() {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const preloadThemes = useCallback(
    async (schema: ControllerSchema, themeIds: string[], assetsBaseUrl = '/controllers') => {
      setLoading(true);
      setProgress(0);

      const orientation = schema.orientation || (schema.width > schema.height ? 'landscape' : 'portrait');
      const urls = themeIds.map(
        (themeId) => `${assetsBaseUrl}/controller-${orientation}-${themeId}.png`
      );

      let loaded = 0;

      await Promise.all(
        urls.map(
          (url) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = img.onerror = () => {
                loaded++;
                setProgress((loaded / urls.length) * 100);
                resolve();
              };
              img.src = url;
            })
        )
      );

      setLoading(false);
    },
    []
  );

  return { progress, loading, preloadThemes };
}

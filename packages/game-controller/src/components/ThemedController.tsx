/**
 * Themed controller component
 * Renders controller with automatic theme support
 */

import React from 'react';
import type { ControllerSchema, ControllerInputEvent } from '../types';
import type { ControllerTheme } from '../transformers/themes';
import { useThemedController } from '../hooks/useThemedController';
import { GameController, type GameControllerProps } from './GameController';

export interface ThemedControllerProps extends Omit<GameControllerProps, 'schema' | 'backgroundImage'> {
  /** Controller schema */
  schema: ControllerSchema;
  /** Theme ID or theme object */
  theme: string | ControllerTheme;
  /** Whether to use cached/pre-generated images */
  useCache?: boolean;
  /** Base URL for pre-generated theme images */
  assetsBaseUrl?: string;
  /** Show loading indicator while loading themed image */
  showLoading?: boolean;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Custom error component */
  errorComponent?: (error: Error, retry: () => void) => React.ReactNode;
}

/**
 * Themed Controller Component
 *
 * Automatically loads themed controller images and renders the interactive controller.
 *
 * Usage:
 * ```tsx
 * <ThemedController
 *   schema={doomControllerSchema}
 *   theme="cyberpunk"
 *   onInput={(event) => console.log(event)}
 * />
 * ```
 *
 * With pre-generated images:
 * ```tsx
 * <ThemedController
 *   schema={doomControllerSchema}
 *   theme="cyberpunk"
 *   useCache={true}
 *   assetsBaseUrl="/controllers"
 *   onInput={(event) => console.log(event)}
 * />
 * ```
 */
export function ThemedController({
  schema,
  theme,
  useCache = true,
  assetsBaseUrl = '/controllers',
  showLoading = true,
  loadingComponent,
  errorComponent,
  ...controllerProps
}: ThemedControllerProps) {
  const { imageUrl, loading, error, theme: resolvedTheme, retry } = useThemedController({
    schema,
    theme,
    useCache,
    assetsBaseUrl,
    fallbackToOriginal: true,
  });

  // Show loading state
  if (loading && showLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    return (
      <div
        style={{
          width: schema.width,
          height: schema.height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
        }}
      >
        <div>Loading {resolvedTheme.name}...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    if (errorComponent) {
      return <>{errorComponent(error, retry)}</>;
    }
    return (
      <div
        style={{
          width: schema.width,
          height: schema.height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          borderRadius: '8px',
          padding: '20px',
        }}
      >
        <div>Failed to load themed controller</div>
        <button onClick={retry} style={{ marginTop: '10px' }}>
          Retry
        </button>
      </div>
    );
  }

  // Render controller with themed background
  return (
    <GameController
      schema={schema}
      backgroundImage={imageUrl || undefined}
      {...controllerProps}
    />
  );
}

/**
 * Theme Selector Component
 *
 * Provides a UI for selecting themes.
 *
 * Usage:
 * ```tsx
 * const [selectedTheme, setSelectedTheme] = useState('cyberpunk');
 *
 * <ThemeSelector
 *   value={selectedTheme}
 *   onChange={setSelectedTheme}
 * />
 * ```
 */
export interface ThemeSelectorProps {
  /** Currently selected theme ID */
  value: string;
  /** Callback when theme changes */
  onChange: (themeId: string) => void;
  /** Available theme IDs (defaults to all themes) */
  themes?: string[];
  /** Display mode */
  mode?: 'grid' | 'list' | 'dropdown';
  /** Custom style */
  style?: React.CSSProperties;
  /** Custom class name */
  className?: string;
}

export function ThemeSelector({
  value,
  onChange,
  themes: themeIds,
  mode = 'grid',
  style,
  className,
}: ThemeSelectorProps) {
  const [allThemes, setAllThemes] = React.useState<Record<string, ControllerTheme>>({});

  React.useEffect(() => {
    import('../transformers/themes').then(({ CONTROLLER_THEMES }) => {
      setAllThemes(CONTROLLER_THEMES);
    });
  }, []);

  const availableThemes = themeIds
    ? themeIds.map((id) => allThemes[id]).filter(Boolean)
    : Object.values(allThemes);

  if (mode === 'dropdown') {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={style}
        className={className}
      >
        {availableThemes.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.name}
          </option>
        ))}
      </select>
    );
  }

  if (mode === 'list') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', ...style }} className={className}>
        {availableThemes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onChange(theme.id)}
            style={{
              padding: '12px',
              textAlign: 'left',
              backgroundColor: value === theme.id ? 'rgba(0, 120, 255, 0.2)' : 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontWeight: 'bold' }}>{theme.name}</div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>{theme.description}</div>
          </button>
        ))}
      </div>
    );
  }

  // Grid mode
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: '12px',
        ...style,
      }}
      className={className}
    >
      {availableThemes.map((theme) => (
        <button
          key={theme.id}
          onClick={() => onChange(theme.id)}
          style={{
            padding: '16px',
            textAlign: 'center',
            backgroundColor: value === theme.id ? 'rgba(0, 120, 255, 0.2)' : 'rgba(0, 0, 0, 0.3)',
            border: value === theme.id ? '2px solid #0078ff' : '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          {theme.previewColors && (
            <div
              style={{
                display: 'flex',
                gap: '4px',
                justifyContent: 'center',
                marginBottom: '8px',
              }}
            >
              {Object.values(theme.previewColors).map((color, i) => (
                <div
                  key={i}
                  style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: color,
                    borderRadius: '50%',
                  }}
                />
              ))}
            </div>
          )}
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{theme.name}</div>
          <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px' }}>{theme.category}</div>
        </button>
      ))}
    </div>
  );
}

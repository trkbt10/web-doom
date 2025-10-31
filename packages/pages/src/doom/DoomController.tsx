import { CSSProperties } from 'react';
import { ThemedController } from '@web-doom/game-controller';
import {
  doomControllerSchema,
  ControllerInputEvent,
  ControllerSchema,
  type ControllerTheme,
} from '@web-doom/game-controller';

export interface DoomControllerProps {
  /**
   * Callback for controller input
   */
  onInput: (buttonId: string, pressed: boolean) => void;

  /**
   * Controller schema to use (defaults to landscape schema)
   */
  schema?: ControllerSchema;

  /**
   * Whether the controller should be enabled
   */
  enabled?: boolean;

  /**
   * Additional CSS class name
   */
  className?: string;

  /**
   * Additional inline styles
   */
  style?: CSSProperties;

  /**
   * Whether to show visual feedback on button press
   */
  showFeedback?: boolean;

  /**
   * Controller theme (defaults to 'doom')
   */
  theme?: string | ControllerTheme;

  /**
   * Base URL for assets (defaults to import.meta.env.BASE_URL)
   */
  baseUrl?: string;
}

/**
 * DOOM-specific controller component
 * Wraps ThemedController with DOOM-specific button mappings and default theme
 */
export function DoomController({
  onInput,
  schema = doomControllerSchema,
  enabled = true,
  className,
  style,
  showFeedback = true,
  theme = 'doom',
  baseUrl,
}: DoomControllerProps): JSX.Element {
  const handleInput = (event: ControllerInputEvent) => {
    if (!enabled) return;

    // Send the original button event
    onInput(event.buttonId, event.pressed);

    // A button (fire) also acts as confirm for menu selection
    if (event.buttonId === 'fire') {
      onInput('confirm', event.pressed);
    }
  };

  const containerStyle: CSSProperties = {
    opacity: enabled ? 1 : 0.5,
    pointerEvents: enabled ? 'auto' : 'none',
    ...style,
  };

  // Construct assetsBaseUrl using BASE_URL
  const effectiveBaseUrl = baseUrl ?? import.meta.env.BASE_URL ?? '/';
  // Ensure trailing slash and append 'controllers'
  const normalizedBaseUrl = effectiveBaseUrl.endsWith('/') ? effectiveBaseUrl : `${effectiveBaseUrl}/`;
  const assetsBaseUrl = `${normalizedBaseUrl}controllers`;

  return (
    <ThemedController
      key={`${schema.name}-${schema.orientation || 'default'}`}
      schema={schema}
      theme={theme}
      onInput={handleInput}
      className={className}
      style={containerStyle}
      showFeedback={showFeedback}
      useCache={true}
      assetsBaseUrl={assetsBaseUrl}
    />
  );
}

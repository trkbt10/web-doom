import { CSSProperties } from 'react';
import { GameController } from '@web-doom/game-controller';
import {
  doomControllerSchema,
  ControllerInputEvent,
  ControllerSchema
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
}

/**
 * DOOM-specific controller component
 * Wraps the generic GameController with DOOM-specific button mappings
 */
export function DoomController({
  onInput,
  schema = doomControllerSchema,
  enabled = true,
  className,
  style,
  showFeedback = true,
}: DoomControllerProps): JSX.Element {
  const handleInput = (event: ControllerInputEvent) => {
    if (!enabled) return;
    onInput(event.buttonId, event.pressed);
  };

  const containerStyle: CSSProperties = {
    opacity: enabled ? 1 : 0.5,
    pointerEvents: enabled ? 'auto' : 'none',
    ...style,
  };

  return (
    <GameController
      schema={schema}
      onInput={handleInput}
      className={className}
      style={containerStyle}
      showFeedback={showFeedback}
    />
  );
}

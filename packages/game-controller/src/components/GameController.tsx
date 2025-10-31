import { useEffect, useRef, useMemo, useState, CSSProperties } from 'react';
import {
  ControllerSchema,
  ControllerInputEvent,
  InputCallback,
  ControllerState,
  ButtonState,
} from '../types';
import { generateControllerImage } from '../utils/svg-generator';
import { InputHandler } from '../input/input-handler';
import { ControllerOverlay } from './ControllerOverlay';

export interface GameControllerProps {
  /**
   * Controller layout schema
   */
  schema: ControllerSchema;

  /**
   * Callback for input events
   */
  onInput?: InputCallback;

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
   * Callback for state changes (called on every input)
   */
  onStateChange?: (state: ControllerState) => void;

  /**
   * Custom background image URL (overrides schema background)
   */
  backgroundImage?: string;
}

/**
 * Game controller component with touch, pointer, and gamepad support
 */
export function GameController({
  schema,
  onInput,
  className,
  style,
  showFeedback = true,
  onStateChange,
  backgroundImage,
}: GameControllerProps): JSX.Element {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const handlerRef = useRef<InputHandler | null>(null);
  const [pressedButtons, setPressedButtons] = useState<Map<string, ButtonState>>(
    new Map()
  );

  // Generate controller image from schema or use custom background
  const imageUrl = useMemo(
    () => backgroundImage || generateControllerImage(schema),
    [schema, backgroundImage]
  );

  // Initialize input handler
  useEffect(() => {
    const handler = new InputHandler(schema);
    handlerRef.current = handler;

    return () => {
      handler.destroy();
      handlerRef.current = null;
    };
  }, [schema]);

  // Attach handler to container element
  useEffect(() => {
    const handler = handlerRef.current;
    const container = containerRef.current;
    const img = imgRef.current;

    if (!handler || !container || !img) return;

    // Wait for image to load before attaching
    const handleLoad = () => {
      handler.attach(container);
    };

    if (img.complete) {
      handler.attach(container);
    } else {
      img.addEventListener('load', handleLoad);
    }

    return () => {
      img.removeEventListener('load', handleLoad);
      handler.detach();
    };
  }, []);

  // Setup input callback
  useEffect(() => {
    const handler = handlerRef.current;
    if (!handler) return;

    const handleInput = (event: ControllerInputEvent) => {
      if (onInput) {
        onInput(event);
      }

      // Update pressed buttons state for overlay
      if (showFeedback) {
        const state = handler.getState();
        const newPressedButtons = new Map<string, ButtonState>();

        for (const [buttonId, buttonState] of Object.entries(state)) {
          if (buttonState.pressed) {
            newPressedButtons.set(buttonId, buttonState);
          }
        }

        setPressedButtons(newPressedButtons);
      }

      if (onStateChange) {
        const state = handler.getState();
        onStateChange(state);
      }
    };

    return handler.onInput(handleInput);
  }, [onInput, onStateChange, showFeedback]);

  const containerStyle: CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none',
    ...style,
  };

  const imgStyle: CSSProperties = {
    display: 'block',
    maxWidth: '100%',
    height: 'auto',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    WebkitTouchCallout: 'none',
    touchAction: 'none',
  };

  return (
    <div ref={containerRef} className={className} style={containerStyle}>
      <img
        ref={imgRef}
        src={imageUrl}
        alt={schema.name}
        style={imgStyle}
        draggable={false}
        width={schema.width}
        height={schema.height}
      />
      {showFeedback && (
        <ControllerOverlay
          schema={schema}
          pressedButtons={pressedButtons}
          width={schema.width}
          height={schema.height}
          showHitRegions={true}
        />
      )}
    </div>
  );
}

export default GameController;

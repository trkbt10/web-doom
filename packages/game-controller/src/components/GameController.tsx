import { useEffect, useRef, useMemo, CSSProperties } from 'react';
import {
  ControllerSchema,
  ControllerInputEvent,
  InputCallback,
  ControllerState,
} from '../types';
import { generateControllerImage } from '../utils/svg-generator';
import { InputHandler } from '../input/input-handler';

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
}: GameControllerProps): JSX.Element {
  const imgRef = useRef<HTMLImageElement>(null);
  const handlerRef = useRef<InputHandler | null>(null);

  // Generate controller image from schema
  const imageUrl = useMemo(() => generateControllerImage(schema), [schema]);

  // Initialize input handler
  useEffect(() => {
    const handler = new InputHandler(schema);
    handlerRef.current = handler;

    return () => {
      handler.destroy();
      handlerRef.current = null;
    };
  }, [schema]);

  // Attach handler to image element
  useEffect(() => {
    const handler = handlerRef.current;
    const img = imgRef.current;

    if (!handler || !img) return;

    // Wait for image to load before attaching
    const handleLoad = () => {
      handler.attach(img);
    };

    if (img.complete) {
      handler.attach(img);
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

      if (onStateChange) {
        const state = handler.getState();
        onStateChange(state);
      }

      // Visual feedback
      if (showFeedback && imgRef.current) {
        const img = imgRef.current;

        if (event.pressed) {
          // Add press effect
          img.style.filter = 'brightness(1.1)';
          setTimeout(() => {
            img.style.filter = 'brightness(1.0)';
          }, 50);
        }
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
    transition: 'filter 0.05s ease',
  };

  return (
    <div className={className} style={containerStyle}>
      <img
        ref={imgRef}
        src={imageUrl}
        alt={schema.name}
        style={imgStyle}
        draggable={false}
        width={schema.width}
        height={schema.height}
      />
    </div>
  );
}

export default GameController;

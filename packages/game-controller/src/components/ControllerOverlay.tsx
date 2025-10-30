import { useMemo } from 'react';
import {
  ControllerSchema,
  ButtonSchema,
  DPadSchema,
  HitRegion,
  ButtonState,
} from '../types';

export interface ControllerOverlayProps {
  /**
   * Controller schema
   */
  schema: ControllerSchema;

  /**
   * Currently pressed buttons (button ID -> state)
   */
  pressedButtons: Map<string, ButtonState>;

  /**
   * Width of the overlay (should match controller image width)
   */
  width: number;

  /**
   * Height of the overlay (should match controller image height)
   */
  height: number;
}

/**
 * SVG overlay that highlights pressed buttons
 */
export function ControllerOverlay({
  schema,
  pressedButtons,
  width,
  height,
}: ControllerOverlayProps): JSX.Element {
  // Generate highlight paths for pressed buttons
  const highlights = useMemo(() => {
    const result: JSX.Element[] = [];

    for (const button of schema.buttons) {
      if (button.type === 'dpad') {
        const dpad = button as DPadSchema;
        // Check if any direction is pressed
        const hasAnyDirectionPressed = Object.values(dpad.directions).some(
          dir => pressedButtons.has(dir.id)
        );

        if (hasAnyDirectionPressed) {
          // Highlight the entire D-pad visual
          result.push(
            renderHighlightFromVisual(button.id, button.visual, 'dpad')
          );
        }
      } else {
        const btn = button as ButtonSchema;
        if (pressedButtons.has(btn.id)) {
          result.push(renderHighlightFromVisual(btn.id, btn.visual, btn.type));
        }
      }
    }

    return result;
  }, [schema, pressedButtons]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${schema.width} ${schema.height}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        display: 'block',
        maxWidth: '100%',
        height: 'auto',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {highlights}
    </svg>
  );
}

/**
 * Render a highlight shape based on button visual
 */
function renderHighlightFromVisual(
  buttonId: string,
  visual: ButtonSchema['visual'],
  buttonType: string
): JSX.Element {
  const color = getHighlightColor(buttonType);

  if (visual.type === 'circle') {
    const { x, y } = visual.position;
    const r = visual.size / 2;
    return (
      <g key={buttonId}>
        <circle
          cx={x}
          cy={y}
          r={r}
          fill={color}
          opacity={0.3}
        />
        <circle
          cx={x}
          cy={y}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={4}
          opacity={0.8}
        />
      </g>
    );
  }

  if (visual.type === 'rect') {
    const { x, y } = visual.position;
    const size = visual.size;
    const halfSize = size / 2;
    const rx = size * 0.15;
    return (
      <g key={buttonId}>
        <rect
          x={x - halfSize}
          y={y - halfSize}
          width={size}
          height={size}
          rx={rx}
          ry={rx}
          fill={color}
          opacity={0.3}
        />
        <rect
          x={x - halfSize}
          y={y - halfSize}
          width={size}
          height={size}
          rx={rx}
          ry={rx}
          fill="none"
          stroke={color}
          strokeWidth={4}
          opacity={0.8}
        />
      </g>
    );
  }

  if (visual.type === 'dpad') {
    const { x, y } = visual.position;
    const size = visual.size;
    const halfSize = size / 2;
    const armWidth = size / 3;
    const halfArm = armWidth / 2;

    // Create D-pad cross shape path
    const path = `
      M ${x - halfArm} ${y - halfSize}
      L ${x + halfArm} ${y - halfSize}
      L ${x + halfArm} ${y - halfArm}
      L ${x + halfSize} ${y - halfArm}
      L ${x + halfSize} ${y + halfArm}
      L ${x + halfArm} ${y + halfArm}
      L ${x + halfArm} ${y + halfSize}
      L ${x - halfArm} ${y + halfSize}
      L ${x - halfArm} ${y + halfArm}
      L ${x - halfSize} ${y + halfArm}
      L ${x - halfSize} ${y - halfArm}
      L ${x - halfArm} ${y - halfArm}
      Z
    `;

    return (
      <g key={buttonId}>
        <path
          d={path}
          fill={color}
          opacity={0.3}
        />
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={4}
          opacity={0.8}
        />
      </g>
    );
  }

  return <g key={buttonId} />;
}

/**
 * Get highlight color based on button type
 */
function getHighlightColor(buttonType: string): string {
  switch (buttonType) {
    case 'action':
      return '#ff4444'; // Red for action buttons
    case 'dpad':
      return '#4444ff'; // Blue for d-pad
    case 'shoulder':
      return '#ff8844'; // Orange for shoulder buttons
    case 'system':
      return '#44ff44'; // Green for system buttons
    default:
      return '#ffffff'; // White for others
  }
}

export default ControllerOverlay;

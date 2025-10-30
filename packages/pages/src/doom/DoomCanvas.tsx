import { forwardRef, CSSProperties } from 'react';

export interface DoomCanvasProps {
  /** Internal rendering resolution (width attribute) */
  width?: number;
  /** Internal rendering resolution (height attribute) */
  height?: number;
  /** Display width in CSS (if different from width) */
  displayWidth?: number;
  /** Display height in CSS (if different from height) */
  displayHeight?: number;
  style?: CSSProperties;
  className?: string;
}

/**
 * Canvas component for DOOM rendering
 *
 * Separates internal rendering resolution from display size for better quality.
 * - width/height: Internal canvas resolution (affects rendering quality)
 * - displayWidth/displayHeight: CSS display size (affects visual size)
 */
export const DoomCanvas = forwardRef<HTMLCanvasElement, DoomCanvasProps>(
  ({ width = 800, height = 600, displayWidth, displayHeight, style, className }, ref) => {
    const cssWidth = displayWidth || width;
    const cssHeight = displayHeight || height;

    return (
      <canvas
        ref={ref}
        id="canvas"
        onContextMenu={(e) => e.preventDefault()}
        tabIndex={-1}
        width={width}
        height={height}
        style={{
          display: 'block',
          width: `${cssWidth}px`,
          height: `${cssHeight}px`,
          backgroundColor: '#000',
          imageRendering: 'pixelated', // Use pixelated rendering for retro look
          ...style,
        }}
        className={className}
      />
    );
  }
);

DoomCanvas.displayName = 'DoomCanvas';

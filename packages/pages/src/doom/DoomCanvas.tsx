import { forwardRef, CSSProperties } from 'react';

export interface DoomCanvasProps {
  width?: number;
  height?: number;
  style?: CSSProperties;
  className?: string;
}

/**
 * Canvas component for DOOM rendering
 */
export const DoomCanvas = forwardRef<HTMLCanvasElement, DoomCanvasProps>(
  ({ width = 800, height = 600, style, className }, ref) => {
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
          margin: '0 auto',
          maxWidth: '100%',
          height: 'auto',
          aspectRatio: `${width} / ${height}`,
          backgroundColor: '#000',
          border: '1px solid #ccc',
          imageRendering: 'pixelated',
          ...style,
        }}
        className={className}
      />
    );
  }
);

DoomCanvas.displayName = 'DoomCanvas';

import {
  HitRegion,
  ButtonSchema,
  DPadSchema,
  ControllerSchema,
} from '../types';

/**
 * Check if a point hits a region
 */
export function hitTest(x: number, y: number, region: HitRegion): boolean {
  if (region.type === 'rect') {
    const { rect } = region;
    return (
      x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height
    );
  }

  if (region.type === 'circle') {
    const { circle } = region;
    const dx = x - circle.cx;
    const dy = y - circle.cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= circle.r;
  }

  return false;
}

/**
 * Find which button is hit at the given coordinates
 * Returns button ID or null if no hit
 */
export function findHitButton(
  x: number,
  y: number,
  schema: ControllerSchema
): string | null {
  for (const button of schema.buttons) {
    if (button.type === 'dpad') {
      const dpad = button as DPadSchema;
      const { directions } = dpad;

      // Check each direction
      if (hitTest(x, y, directions.up.hitRegion)) {
        return directions.up.id;
      }
      if (hitTest(x, y, directions.down.hitRegion)) {
        return directions.down.id;
      }
      if (hitTest(x, y, directions.left.hitRegion)) {
        return directions.left.id;
      }
      if (hitTest(x, y, directions.right.hitRegion)) {
        return directions.right.id;
      }
    } else {
      if (hitTest(x, y, button.hitRegion)) {
        return button.id;
      }
    }
  }

  return null;
}

/**
 * Get button by ID from schema
 */
export function getButtonById(
  id: string,
  schema: ControllerSchema
): ButtonSchema | null {
  for (const button of schema.buttons) {
    if (button.id === id) {
      return button;
    }

    if (button.type === 'dpad') {
      const dpad = button as DPadSchema;
      const { directions } = dpad;

      if (
        directions.up.id === id ||
        directions.down.id === id ||
        directions.left.id === id ||
        directions.right.id === id
      ) {
        // Return a pseudo-button for D-pad directions
        return button;
      }
    }
  }

  return null;
}

/**
 * Calculate relative coordinates from an element
 */
export function getRelativeCoordinates(
  event: PointerEvent | MouseEvent | Touch,
  element: HTMLImageElement
): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  const scaleX = element.width / rect.width;
  const scaleY = element.height / rect.height;

  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  return { x, y };
}

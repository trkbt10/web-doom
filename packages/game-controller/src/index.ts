/**
 * @web-doom/game-controller
 *
 * Game controller library with touch, pointer events, and gamepad API support
 * for web-doom
 */

// Main component
export { GameController } from './components/GameController';
export type { GameControllerProps } from './components/GameController';

// Types
export type {
  ButtonType,
  ButtonState,
  Rect,
  Circle,
  HitRegion,
  ButtonSchema,
  DPadSchema,
  StickSchema,
  ControllerSchema,
  ControllerInputEvent,
  ControllerState,
  InputCallback,
  PointerInfo,
} from './types';

// Schemas
export { doomControllerSchema, doomControllerSchemaPortrait } from './schemas/doom-controller';

// Utilities
export {
  generateControllerSVG,
  generateControllerImage,
  svgToDataURL,
} from './utils/svg-generator';

export {
  hitTest,
  findHitButton,
  getButtonById,
  getRelativeCoordinates,
} from './utils/hit-detection';

// Input handler (for advanced usage)
export { InputHandler } from './input/input-handler';

// Debug utilities
export function enableControllerDebug(enabled: boolean = true): void {
  (window as any).__CONTROLLER_DEBUG__ = enabled;
}

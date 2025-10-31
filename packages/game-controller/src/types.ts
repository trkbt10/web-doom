/**
 * Game controller types and schema definitions
 */

/**
 * Standard game button types
 */
export type ButtonType =
  | 'action'      // A, B, X, Y buttons
  | 'dpad'        // Directional pad (up, down, left, right)
  | 'shoulder'    // L1, R1 buttons
  | 'trigger'     // L2, R2 buttons
  | 'stick'       // Analog stick (L3, R3)
  | 'system';     // Start, Select, Home buttons

/**
 * Button state for tracking input
 */
export interface ButtonState {
  pressed: boolean;
  value: number; // 0-1 for analog inputs
  timestamp: number;
}

/**
 * Position and size for button regions
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Circle region for round buttons
 */
export interface Circle {
  cx: number;
  cy: number;
  r: number;
}

/**
 * Hit region can be rectangular or circular
 */
export type HitRegion =
  | { type: 'rect'; rect: Rect }
  | { type: 'circle'; circle: Circle };

/**
 * Button schema definition
 */
export interface ButtonSchema {
  id: string;
  type: ButtonType;
  label: string;
  hitRegion: HitRegion;
  gamepadIndex?: number; // Gamepad API button index
  visual: {
    type: 'circle' | 'rect' | 'dpad' | 'custom';
    position: { x: number; y: number };
    size: number;
    color?: string;
    icon?: string;
  };
}

/**
 * D-pad specific schema with directional regions
 */
export interface DPadSchema extends ButtonSchema {
  type: 'dpad';
  directions: {
    up: { id: string; hitRegion: HitRegion; gamepadIndex?: number };
    down: { id: string; hitRegion: HitRegion; gamepadIndex?: number };
    left: { id: string; hitRegion: HitRegion; gamepadIndex?: number };
    right: { id: string; hitRegion: HitRegion; gamepadIndex?: number };
  };
}

/**
 * Analog stick schema with axis mapping
 */
export interface StickSchema extends ButtonSchema {
  type: 'stick';
  axisX: number; // Gamepad API axis index for X
  axisY: number; // Gamepad API axis index for Y
  deadzone?: number; // 0-1, default 0.1
  range: number; // Visual range in pixels
}

/**
 * Complete controller layout schema
 */
export interface ControllerSchema {
  name: string;
  width: number;
  height: number;
  orientation?: 'landscape' | 'portrait';
  displayArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius?: number;
    borderColor?: string;
    borderWidth?: number;
    backgroundColor?: string;
  };
  buttons: (ButtonSchema | DPadSchema | StickSchema)[];
  background?: {
    color: string;
    opacity: number;
  };
}

/**
 * Input event data
 */
export interface ControllerInputEvent {
  buttonId: string;
  pressed: boolean;
  value: number;
  timestamp: number;
  source: 'touch' | 'pointer' | 'gamepad';
}

/**
 * Controller state tracking all button states
 */
export type ControllerState = Record<string, ButtonState>;

/**
 * Callback for input events
 */
export type InputCallback = (event: ControllerInputEvent) => void;

/**
 * Touch/Pointer tracking information
 */
export interface PointerInfo {
  id: number;
  buttonId: string | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  timestamp: number;
}

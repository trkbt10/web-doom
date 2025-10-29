/**
 * Input handling system using web standard APIs
 */

/**
 * Input state
 */
export interface InputState {
  keys: Map<string, boolean>;
  mouse: {
    x: number;
    y: number;
    deltaX: number;
    deltaY: number;
    buttons: boolean[];
    locked: boolean;
  };
  touch: {
    active: boolean;
    touches: Array<{
      id: number;
      x: number;
      y: number;
    }>;
  };
}

/**
 * Input actions
 */
export enum InputAction {
  MoveForward,
  MoveBackward,
  StrafeLeft,
  StrafeRight,
  TurnLeft,
  TurnRight,
  LookUp,
  LookDown,
  Fire,
  Use,
  Run,
  Weapon1,
  Weapon2,
  Weapon3,
  Weapon4,
  Weapon5,
  Weapon6,
  Weapon7,
  NextWeapon,
  PrevWeapon,
  Automap,
}

/**
 * Key bindings
 */
export type KeyBindings = Map<string, InputAction>;

/**
 * Default key bindings
 */
export const defaultKeyBindings: KeyBindings = new Map([
  ['KeyW', InputAction.MoveForward],
  ['ArrowUp', InputAction.MoveForward],
  ['KeyS', InputAction.MoveBackward],
  ['ArrowDown', InputAction.MoveBackward],
  ['KeyA', InputAction.StrafeLeft],
  ['KeyD', InputAction.StrafeRight],
  ['ArrowLeft', InputAction.TurnLeft],
  ['ArrowRight', InputAction.TurnRight],
  ['ControlLeft', InputAction.Fire],
  ['ControlRight', InputAction.Fire],
  ['Space', InputAction.Use],
  ['KeyE', InputAction.Use],
  ['ShiftLeft', InputAction.Run],
  ['ShiftRight', InputAction.Run],
  ['Digit1', InputAction.Weapon1],
  ['Digit2', InputAction.Weapon2],
  ['Digit3', InputAction.Weapon3],
  ['Digit4', InputAction.Weapon4],
  ['Digit5', InputAction.Weapon5],
  ['Digit6', InputAction.Weapon6],
  ['Digit7', InputAction.Weapon7],
  ['KeyQ', InputAction.PrevWeapon],
  ['KeyF', InputAction.NextWeapon],
  ['Tab', InputAction.Automap],
]);

/**
 * Create initial input state
 */
export function createInputState(): InputState {
  return {
    keys: new Map(),
    mouse: {
      x: 0,
      y: 0,
      deltaX: 0,
      deltaY: 0,
      buttons: [false, false, false],
      locked: false,
    },
    touch: {
      active: false,
      touches: [],
    },
  };
}

/**
 * Initialize input handlers
 */
export function initInput(
  element: HTMLElement,
  state: InputState,
  bindings: KeyBindings = defaultKeyBindings
): () => void {
  // Keyboard handlers
  const handleKeyDown = (e: KeyboardEvent) => {
    state.keys.set(e.code, true);

    // Prevent default for game keys
    if (bindings.has(e.code)) {
      e.preventDefault();
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    state.keys.set(e.code, false);
  };

  // Mouse handlers
  const handleMouseMove = (e: MouseEvent) => {
    const rect = element.getBoundingClientRect();
    state.mouse.x = e.clientX - rect.left;
    state.mouse.y = e.clientY - rect.top;
  };

  const handleMouseDown = (e: MouseEvent) => {
    state.mouse.buttons[e.button] = true;
    e.preventDefault();
  };

  const handleMouseUp = (e: MouseEvent) => {
    state.mouse.buttons[e.button] = false;
  };

  // Touch handlers
  const handleTouchStart = (e: TouchEvent) => {
    state.touch.active = true;
    state.touch.touches = Array.from(e.touches).map((touch) => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
    }));
    e.preventDefault();
  };

  const handleTouchMove = (e: TouchEvent) => {
    state.touch.touches = Array.from(e.touches).map((touch) => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
    }));
    e.preventDefault();
  };

  const handleTouchEnd = (e: TouchEvent) => {
    state.touch.touches = Array.from(e.touches).map((touch) => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
    }));
    if (e.touches.length === 0) {
      state.touch.active = false;
    }
    e.preventDefault();
  };

  // Add event listeners
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  element.addEventListener('mousemove', handleMouseMove);
  element.addEventListener('mousedown', handleMouseDown);
  element.addEventListener('mouseup', handleMouseUp);
  element.addEventListener('touchstart', handleTouchStart);
  element.addEventListener('touchmove', handleTouchMove);
  element.addEventListener('touchend', handleTouchEnd);

  // Return cleanup function
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    element.removeEventListener('mousemove', handleMouseMove);
    element.removeEventListener('mousedown', handleMouseDown);
    element.removeEventListener('mouseup', handleMouseUp);
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
  };
}

/**
 * Check if an action is active
 */
export function isActionActive(
  state: InputState,
  action: InputAction,
  bindings: KeyBindings = defaultKeyBindings
): boolean {
  // Check keyboard
  for (const [key, boundAction] of bindings.entries()) {
    if (boundAction === action && state.keys.get(key)) {
      return true;
    }
  }

  // Check mouse buttons for fire/use
  if (action === InputAction.Fire && state.mouse.buttons[0]) {
    return true;
  }
  if (action === InputAction.Use && state.mouse.buttons[2]) {
    return true;
  }

  return false;
}

/**
 * Get movement input (-1 to 1)
 */
export function getMovementInput(
  state: InputState,
  bindings: KeyBindings = defaultKeyBindings
): { forward: number; strafe: number } {
  let forward = 0;
  let strafe = 0;

  if (isActionActive(state, InputAction.MoveForward, bindings)) {
    forward += 1;
  }
  if (isActionActive(state, InputAction.MoveBackward, bindings)) {
    forward -= 1;
  }
  if (isActionActive(state, InputAction.StrafeLeft, bindings)) {
    strafe -= 1;
  }
  if (isActionActive(state, InputAction.StrafeRight, bindings)) {
    strafe += 1;
  }

  return { forward, strafe };
}

/**
 * Get turn input (in radians per second)
 */
export function getTurnInput(
  state: InputState,
  bindings: KeyBindings = defaultKeyBindings,
  mouseSensitivity = 0.002
): { yaw: number; pitch: number } {
  let yaw = 0;
  let pitch = 0;

  // Keyboard turning
  if (isActionActive(state, InputAction.TurnLeft, bindings)) {
    yaw += 1.5; // radians per second
  }
  if (isActionActive(state, InputAction.TurnRight, bindings)) {
    yaw -= 1.5;
  }
  if (isActionActive(state, InputAction.LookUp, bindings)) {
    pitch += 1.5;
  }
  if (isActionActive(state, InputAction.LookDown, bindings)) {
    pitch -= 1.5;
  }

  return { yaw, pitch };
}

/**
 * Clear one-frame input states (call at end of frame)
 */
export function clearFrameInput(state: InputState): void {
  state.mouse.deltaX = 0;
  state.mouse.deltaY = 0;
}

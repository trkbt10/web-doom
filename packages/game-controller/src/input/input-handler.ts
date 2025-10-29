import {
  ControllerSchema,
  ControllerState,
  ControllerInputEvent,
  InputCallback,
  PointerInfo,
  ButtonState,
  DPadSchema,
} from '../types';
import { findHitButton, getRelativeCoordinates } from '../utils/hit-detection';

/**
 * Unified input handler for touch, pointer, and gamepad events
 */
export class InputHandler {
  private schema: ControllerSchema;
  private element: HTMLImageElement | null = null;
  private state: ControllerState = {};
  private pointers: Map<number, PointerInfo> = new Map();
  private callbacks: Set<InputCallback> = new Set();
  private gamepadIndex: number | null = null;
  private rafId: number | null = null;

  constructor(schema: ControllerSchema) {
    this.schema = schema;
    this.initializeState();
  }

  /**
   * Initialize button state
   */
  private initializeState(): void {
    this.state = {};

    for (const button of this.schema.buttons) {
      if (button.type === 'dpad') {
        const dpad = button as DPadSchema;
        this.state[dpad.directions.up.id] = this.createButtonState();
        this.state[dpad.directions.down.id] = this.createButtonState();
        this.state[dpad.directions.left.id] = this.createButtonState();
        this.state[dpad.directions.right.id] = this.createButtonState();
      } else {
        this.state[button.id] = this.createButtonState();
      }
    }
  }

  private createButtonState(): ButtonState {
    return {
      pressed: false,
      value: 0,
      timestamp: 0,
    };
  }

  /**
   * Attach to a controller image element
   */
  attach(element: HTMLImageElement): void {
    this.detach(); // Clean up any previous attachment
    this.element = element;

    // Pointer Events (handles mouse and touch)
    element.addEventListener('pointerdown', this.handlePointerDown);
    element.addEventListener('pointermove', this.handlePointerMove);
    element.addEventListener('pointerup', this.handlePointerUp);
    element.addEventListener('pointercancel', this.handlePointerCancel);

    // Touch Events (for preventing default behaviors on iOS)
    element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    element.addEventListener('touchend', this.handleTouchEnd, { passive: false });

    // CSS to prevent default touch behaviors
    element.style.touchAction = 'none';
    element.style.userSelect = 'none';
    (element.style as any).webkitUserSelect = 'none';
    (element.style as any).webkitTouchCallout = 'none';

    // Start gamepad polling
    this.startGamepadPolling();
  }

  /**
   * Detach from the element
   */
  detach(): void {
    if (!this.element) return;

    this.element.removeEventListener('pointerdown', this.handlePointerDown);
    this.element.removeEventListener('pointermove', this.handlePointerMove);
    this.element.removeEventListener('pointerup', this.handlePointerUp);
    this.element.removeEventListener('pointercancel', this.handlePointerCancel);

    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);

    this.element = null;
    this.pointers.clear();

    this.stopGamepadPolling();
  }

  /**
   * Add input callback
   */
  onInput(callback: InputCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Get current controller state
   */
  getState(): ControllerState {
    return { ...this.state };
  }

  /**
   * Emit input event
   */
  private emit(event: ControllerInputEvent): void {
    this.callbacks.forEach(cb => cb(event));
  }

  /**
   * Update button state
   */
  private updateButton(
    buttonId: string,
    pressed: boolean,
    value: number,
    source: 'touch' | 'pointer' | 'gamepad'
  ): void {
    const currentState = this.state[buttonId];
    if (!currentState) return;

    const changed = currentState.pressed !== pressed;

    if (changed || value !== currentState.value) {
      const timestamp = performance.now();
      this.state[buttonId] = { pressed, value, timestamp };

      this.emit({
        buttonId,
        pressed,
        value,
        timestamp,
        source,
      });
    }
  }

  // ================== Pointer Events ==================

  private handlePointerDown = (event: PointerEvent): void => {
    if (!this.element) return;

    event.preventDefault();
    const { x, y } = getRelativeCoordinates(event, this.element);
    const buttonId = findHitButton(x, y, this.schema);

    if (buttonId) {
      const pointerInfo: PointerInfo = {
        id: event.pointerId,
        buttonId,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
        timestamp: performance.now(),
      };

      this.pointers.set(event.pointerId, pointerInfo);
      this.updateButton(buttonId, true, 1.0, 'pointer');

      // Capture pointer for continuous tracking
      this.element.setPointerCapture(event.pointerId);
    }
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (!this.element) return;

    const pointerInfo = this.pointers.get(event.pointerId);
    if (!pointerInfo) return;

    const { x, y } = getRelativeCoordinates(event, this.element);
    pointerInfo.currentX = x;
    pointerInfo.currentY = y;

    // Check if pointer has moved to a different button (for D-pad slide)
    const newButtonId = findHitButton(x, y, this.schema);

    if (newButtonId !== pointerInfo.buttonId) {
      // Release old button
      if (pointerInfo.buttonId) {
        this.updateButton(pointerInfo.buttonId, false, 0, 'pointer');
      }

      // Press new button
      if (newButtonId) {
        this.updateButton(newButtonId, true, 1.0, 'pointer');
      }

      pointerInfo.buttonId = newButtonId;
    }
  };

  private handlePointerUp = (event: PointerEvent): void => {
    this.releasePointer(event.pointerId, 'pointer');
  };

  private handlePointerCancel = (event: PointerEvent): void => {
    this.releasePointer(event.pointerId, 'pointer');
  };

  private releasePointer(
    pointerId: number,
    source: 'pointer' | 'touch'
  ): void {
    const pointerInfo = this.pointers.get(pointerId);
    if (!pointerInfo) return;

    if (pointerInfo.buttonId) {
      this.updateButton(pointerInfo.buttonId, false, 0, source);
    }

    this.pointers.delete(pointerId);

    if (this.element) {
      try {
        this.element.releasePointerCapture(pointerId);
      } catch (e) {
        // Ignore errors if capture was already released
      }
    }
  }

  // ================== Touch Events (for iOS scroll prevention) ==================

  private handleTouchStart = (event: TouchEvent): void => {
    // Prevent default to stop scrolling/zooming
    event.preventDefault();
  };

  private handleTouchMove = (event: TouchEvent): void => {
    // Prevent default to stop scrolling
    event.preventDefault();
  };

  private handleTouchEnd = (event: TouchEvent): void => {
    // Prevent default
    event.preventDefault();
  };

  // ================== Gamepad API ==================

  private startGamepadPolling(): void {
    if (this.rafId !== null) return;

    const poll = () => {
      this.pollGamepad();
      this.rafId = requestAnimationFrame(poll);
    };

    this.rafId = requestAnimationFrame(poll);
  }

  private stopGamepadPolling(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private pollGamepad(): void {
    const gamepads = navigator.getGamepads();

    // Find connected gamepad
    let gamepad: Gamepad | null = null;
    if (this.gamepadIndex !== null) {
      gamepad = gamepads[this.gamepadIndex];
    } else {
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
          gamepad = gamepads[i];
          this.gamepadIndex = i;
          break;
        }
      }
    }

    if (!gamepad) return;

    // Process buttons
    for (const button of this.schema.buttons) {
      if (button.type === 'dpad') {
        const dpad = button as DPadSchema;
        this.processGamepadButton(
          dpad.directions.up.id,
          dpad.directions.up.gamepadIndex,
          gamepad
        );
        this.processGamepadButton(
          dpad.directions.down.id,
          dpad.directions.down.gamepadIndex,
          gamepad
        );
        this.processGamepadButton(
          dpad.directions.left.id,
          dpad.directions.left.gamepadIndex,
          gamepad
        );
        this.processGamepadButton(
          dpad.directions.right.id,
          dpad.directions.right.gamepadIndex,
          gamepad
        );
      } else {
        this.processGamepadButton(button.id, button.gamepadIndex, gamepad);
      }
    }
  }

  private processGamepadButton(
    buttonId: string,
    gamepadIndex: number | undefined,
    gamepad: Gamepad
  ): void {
    if (gamepadIndex === undefined) return;

    const button = gamepad.buttons[gamepadIndex];
    if (!button) return;

    const pressed = button.pressed;
    const value = button.value;

    // Only update if this button is not currently being touched
    const isTouched = Array.from(this.pointers.values()).some(
      p => p.buttonId === buttonId
    );

    if (!isTouched) {
      this.updateButton(buttonId, pressed, value, 'gamepad');
    }
  }

  /**
   * Clean up
   */
  destroy(): void {
    this.detach();
    this.callbacks.clear();
  }
}

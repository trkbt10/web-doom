/**
 * Tests for input handling system
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInputState,
  isActionActive,
  getMovementInput,
  getTurnInput,
  clearFrameInput,
  InputAction,
  defaultKeyBindings,
  type InputState,
} from './input';

describe('input/input', () => {
  describe('createInputState', () => {
    it('should create initial input state with empty keys', () => {
      const state = createInputState();

      expect(state.keys.size).toBe(0);
    });

    it('should create initial mouse state at origin', () => {
      const state = createInputState();

      expect(state.mouse.x).toBe(0);
      expect(state.mouse.y).toBe(0);
      expect(state.mouse.deltaX).toBe(0);
      expect(state.mouse.deltaY).toBe(0);
      expect(state.mouse.buttons).toEqual([false, false, false]);
      expect(state.mouse.locked).toBe(false);
    });

    it('should create initial touch state as inactive', () => {
      const state = createInputState();

      expect(state.touch.active).toBe(false);
      expect(state.touch.touches).toEqual([]);
    });
  });

  describe('isActionActive', () => {
    let state: InputState;

    beforeEach(() => {
      state = createInputState();
    });

    it('should return false when no keys are pressed', () => {
      expect(isActionActive(state, InputAction.MoveForward)).toBe(false);
    });

    it('should return true when action key is pressed', () => {
      state.keys.set('KeyW', true);

      expect(isActionActive(state, InputAction.MoveForward)).toBe(true);
    });

    it('should return false when action key is released', () => {
      state.keys.set('KeyW', false);

      expect(isActionActive(state, InputAction.MoveForward)).toBe(false);
    });

    it('should work with multiple key bindings for same action', () => {
      // Both KeyW and ArrowUp are bound to MoveForward
      state.keys.set('ArrowUp', true);

      expect(isActionActive(state, InputAction.MoveForward)).toBe(true);
    });

    it('should return true if any bound key is pressed', () => {
      state.keys.set('KeyW', false);
      state.keys.set('ArrowUp', true);

      expect(isActionActive(state, InputAction.MoveForward)).toBe(true);
    });

    it('should detect mouse button for fire action', () => {
      state.mouse.buttons[0] = true;

      expect(isActionActive(state, InputAction.Fire)).toBe(true);
    });

    it('should detect mouse button for use action', () => {
      state.mouse.buttons[2] = true;

      expect(isActionActive(state, InputAction.Use)).toBe(true);
    });

    it('should work with strafe keys', () => {
      state.keys.set('KeyA', true);
      expect(isActionActive(state, InputAction.StrafeLeft)).toBe(true);

      state.keys.set('KeyD', true);
      expect(isActionActive(state, InputAction.StrafeRight)).toBe(true);
    });

    it('should work with turn keys', () => {
      state.keys.set('ArrowLeft', true);
      expect(isActionActive(state, InputAction.TurnLeft)).toBe(true);

      state.keys.set('ArrowRight', true);
      expect(isActionActive(state, InputAction.TurnRight)).toBe(true);
    });

    it('should work with run key', () => {
      state.keys.set('ShiftLeft', true);
      expect(isActionActive(state, InputAction.Run)).toBe(true);
    });

    it('should work with weapon keys', () => {
      state.keys.set('Digit1', true);
      expect(isActionActive(state, InputAction.Weapon1)).toBe(true);

      state.keys.set('Digit2', true);
      expect(isActionActive(state, InputAction.Weapon2)).toBe(true);
    });
  });

  describe('getMovementInput', () => {
    let state: InputState;

    beforeEach(() => {
      state = createInputState();
    });

    it('should return 0,0 when no keys pressed', () => {
      const movement = getMovementInput(state);

      expect(movement.forward).toBe(0);
      expect(movement.strafe).toBe(0);
    });

    it('should return forward=1 when W is pressed', () => {
      state.keys.set('KeyW', true);

      const movement = getMovementInput(state);

      expect(movement.forward).toBe(1);
      expect(movement.strafe).toBe(0);
    });

    it('should return forward=-1 when S is pressed', () => {
      state.keys.set('KeyS', true);

      const movement = getMovementInput(state);

      expect(movement.forward).toBe(-1);
      expect(movement.strafe).toBe(0);
    });

    it('should return strafe=-1 when A is pressed', () => {
      state.keys.set('KeyA', true);

      const movement = getMovementInput(state);

      expect(movement.forward).toBe(0);
      expect(movement.strafe).toBe(-1);
    });

    it('should return strafe=1 when D is pressed', () => {
      state.keys.set('KeyD', true);

      const movement = getMovementInput(state);

      expect(movement.forward).toBe(0);
      expect(movement.strafe).toBe(1);
    });

    it('should combine forward and strafe', () => {
      state.keys.set('KeyW', true);
      state.keys.set('KeyD', true);

      const movement = getMovementInput(state);

      expect(movement.forward).toBe(1);
      expect(movement.strafe).toBe(1);
    });

    it('should cancel opposite directions (forward/backward)', () => {
      state.keys.set('KeyW', true);
      state.keys.set('KeyS', true);

      const movement = getMovementInput(state);

      expect(movement.forward).toBe(0);
    });

    it('should cancel opposite directions (strafe left/right)', () => {
      state.keys.set('KeyA', true);
      state.keys.set('KeyD', true);

      const movement = getMovementInput(state);

      expect(movement.strafe).toBe(0);
    });

    it('should work with arrow keys for forward/backward', () => {
      state.keys.set('ArrowUp', true);
      let movement = getMovementInput(state);
      expect(movement.forward).toBe(1);

      state.keys.set('ArrowUp', false);
      state.keys.set('ArrowDown', true);
      movement = getMovementInput(state);
      expect(movement.forward).toBe(-1);
    });
  });

  describe('getTurnInput', () => {
    let state: InputState;

    beforeEach(() => {
      state = createInputState();
    });

    it('should return 0,0 when no keys pressed', () => {
      const turn = getTurnInput(state);

      expect(turn.yaw).toBe(0);
      expect(turn.pitch).toBe(0);
    });

    it('should return positive yaw when turning left', () => {
      state.keys.set('ArrowLeft', true);

      const turn = getTurnInput(state);

      expect(turn.yaw).toBeGreaterThan(0);
      expect(turn.pitch).toBe(0);
    });

    it('should return negative yaw when turning right', () => {
      state.keys.set('ArrowRight', true);

      const turn = getTurnInput(state);

      expect(turn.yaw).toBeLessThan(0);
      expect(turn.pitch).toBe(0);
    });

    it('should cancel opposite turn directions', () => {
      state.keys.set('ArrowLeft', true);
      state.keys.set('ArrowRight', true);

      const turn = getTurnInput(state);

      expect(turn.yaw).toBe(0);
    });

    it('should use consistent turn speed', () => {
      state.keys.set('ArrowLeft', true);
      const turn = getTurnInput(state);

      expect(turn.yaw).toBe(1.5); // Default turn speed
    });
  });

  describe('clearFrameInput', () => {
    let state: InputState;

    beforeEach(() => {
      state = createInputState();
    });

    it('should clear mouse deltas', () => {
      state.mouse.deltaX = 10;
      state.mouse.deltaY = 20;

      clearFrameInput(state);

      expect(state.mouse.deltaX).toBe(0);
      expect(state.mouse.deltaY).toBe(0);
    });

    it('should not clear mouse position', () => {
      state.mouse.x = 100;
      state.mouse.y = 200;

      clearFrameInput(state);

      expect(state.mouse.x).toBe(100);
      expect(state.mouse.y).toBe(200);
    });

    it('should not clear mouse buttons', () => {
      state.mouse.buttons[0] = true;
      state.mouse.buttons[1] = true;

      clearFrameInput(state);

      expect(state.mouse.buttons[0]).toBe(true);
      expect(state.mouse.buttons[1]).toBe(true);
    });

    it('should not clear keys', () => {
      state.keys.set('KeyW', true);
      state.keys.set('KeyA', true);

      clearFrameInput(state);

      expect(state.keys.get('KeyW')).toBe(true);
      expect(state.keys.get('KeyA')).toBe(true);
    });
  });

  describe('defaultKeyBindings', () => {
    it('should have movement bindings', () => {
      expect(defaultKeyBindings.get('KeyW')).toBe(InputAction.MoveForward);
      expect(defaultKeyBindings.get('KeyS')).toBe(InputAction.MoveBackward);
      expect(defaultKeyBindings.get('KeyA')).toBe(InputAction.StrafeLeft);
      expect(defaultKeyBindings.get('KeyD')).toBe(InputAction.StrafeRight);
    });

    it('should have arrow key bindings', () => {
      expect(defaultKeyBindings.get('ArrowUp')).toBe(InputAction.MoveForward);
      expect(defaultKeyBindings.get('ArrowDown')).toBe(InputAction.MoveBackward);
      expect(defaultKeyBindings.get('ArrowLeft')).toBe(InputAction.TurnLeft);
      expect(defaultKeyBindings.get('ArrowRight')).toBe(InputAction.TurnRight);
    });

    it('should have action bindings', () => {
      expect(defaultKeyBindings.get('Space')).toBe(InputAction.Use);
      expect(defaultKeyBindings.get('KeyE')).toBe(InputAction.Use);
      expect(defaultKeyBindings.get('ControlLeft')).toBe(InputAction.Fire);
      expect(defaultKeyBindings.get('ControlRight')).toBe(InputAction.Fire);
    });

    it('should have run bindings', () => {
      expect(defaultKeyBindings.get('ShiftLeft')).toBe(InputAction.Run);
      expect(defaultKeyBindings.get('ShiftRight')).toBe(InputAction.Run);
    });

    it('should have weapon number bindings', () => {
      expect(defaultKeyBindings.get('Digit1')).toBe(InputAction.Weapon1);
      expect(defaultKeyBindings.get('Digit2')).toBe(InputAction.Weapon2);
      expect(defaultKeyBindings.get('Digit3')).toBe(InputAction.Weapon3);
      expect(defaultKeyBindings.get('Digit4')).toBe(InputAction.Weapon4);
      expect(defaultKeyBindings.get('Digit5')).toBe(InputAction.Weapon5);
      expect(defaultKeyBindings.get('Digit6')).toBe(InputAction.Weapon6);
      expect(defaultKeyBindings.get('Digit7')).toBe(InputAction.Weapon7);
    });

    it('should have weapon switch bindings', () => {
      expect(defaultKeyBindings.get('KeyQ')).toBe(InputAction.PrevWeapon);
      expect(defaultKeyBindings.get('KeyF')).toBe(InputAction.NextWeapon);
    });

    it('should have automap binding', () => {
      expect(defaultKeyBindings.get('Tab')).toBe(InputAction.Automap);
    });
  });
});

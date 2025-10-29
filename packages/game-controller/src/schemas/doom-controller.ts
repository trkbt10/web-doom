import { ControllerSchema, DPadSchema, ButtonSchema } from '../types';

/**
 * Standard DOOM controller layout
 * Left side: D-pad for movement
 * Right side: Action buttons (Fire, Use, etc.)
 */
export const doomControllerSchema: ControllerSchema = {
  name: 'DOOM Controller',
  width: 800,
  height: 300,
  background: {
    color: '#1a1a1a',
    opacity: 0.8,
  },
  buttons: [
    // D-pad for movement (left side)
    {
      id: 'dpad',
      type: 'dpad',
      label: 'Movement',
      hitRegion: {
        type: 'rect',
        rect: { x: 50, y: 100, width: 150, height: 150 },
      },
      visual: {
        type: 'dpad',
        position: { x: 125, y: 175 },
        size: 150,
        color: '#4a4a4a',
      },
      directions: {
        up: {
          id: 'move-forward',
          hitRegion: {
            type: 'rect',
            rect: { x: 100, y: 100, width: 50, height: 50 },
          },
          gamepadIndex: 12, // D-pad up
        },
        down: {
          id: 'move-backward',
          hitRegion: {
            type: 'rect',
            rect: { x: 100, y: 200, width: 50, height: 50 },
          },
          gamepadIndex: 13, // D-pad down
        },
        left: {
          id: 'turn-left',
          hitRegion: {
            type: 'rect',
            rect: { x: 50, y: 150, width: 50, height: 50 },
          },
          gamepadIndex: 14, // D-pad left
        },
        right: {
          id: 'turn-right',
          hitRegion: {
            type: 'rect',
            rect: { x: 150, y: 150, width: 50, height: 50 },
          },
          gamepadIndex: 15, // D-pad right
        },
      },
    } as DPadSchema,

    // Strafe Left (shoulder button)
    {
      id: 'strafe-left',
      type: 'shoulder',
      label: 'L',
      hitRegion: {
        type: 'rect',
        rect: { x: 30, y: 30, width: 80, height: 40 },
      },
      gamepadIndex: 4, // L1
      visual: {
        type: 'rect',
        position: { x: 70, y: 50 },
        size: 60,
        color: '#5a5a5a',
      },
    } as ButtonSchema,

    // Strafe Right (shoulder button)
    {
      id: 'strafe-right',
      type: 'shoulder',
      label: 'R',
      hitRegion: {
        type: 'rect',
        rect: { x: 690, y: 30, width: 80, height: 40 },
      },
      gamepadIndex: 5, // R1
      visual: {
        type: 'rect',
        position: { x: 730, y: 50 },
        size: 60,
        color: '#5a5a5a',
      },
    } as ButtonSchema,

    // Fire button (right side, primary action)
    {
      id: 'fire',
      type: 'action',
      label: 'A',
      hitRegion: {
        type: 'circle',
        circle: { cx: 650, cy: 200, r: 40 },
      },
      gamepadIndex: 0, // A button
      visual: {
        type: 'circle',
        position: { x: 650, y: 200 },
        size: 80,
        color: '#d32f2f',
        icon: 'fire',
      },
    } as ButtonSchema,

    // Use button (right side, above fire)
    {
      id: 'use',
      type: 'action',
      label: 'B',
      hitRegion: {
        type: 'circle',
        circle: { cx: 710, cy: 140, r: 35 },
      },
      gamepadIndex: 1, // B button
      visual: {
        type: 'circle',
        position: { x: 710, y: 140 },
        size: 70,
        color: '#1976d2',
        icon: 'use',
      },
    } as ButtonSchema,

    // Weapon next (right side, left of fire)
    {
      id: 'weapon-next',
      type: 'action',
      label: 'X',
      hitRegion: {
        type: 'circle',
        circle: { cx: 590, cy: 140, r: 35 },
      },
      gamepadIndex: 2, // X button
      visual: {
        type: 'circle',
        position: { x: 590, y: 140 },
        size: 70,
        color: '#388e3c',
        icon: '+',
      },
    } as ButtonSchema,

    // Weapon previous (right side, above fire)
    {
      id: 'weapon-prev',
      type: 'action',
      label: 'Y',
      hitRegion: {
        type: 'circle',
        circle: { cx: 650, cy: 100, r: 30 },
      },
      gamepadIndex: 3, // Y button
      visual: {
        type: 'circle',
        position: { x: 650, y: 100 },
        size: 60,
        color: '#ffa000',
        icon: '-',
      },
    } as ButtonSchema,

    // Menu/Pause (center)
    {
      id: 'menu',
      type: 'system',
      label: 'Menu',
      hitRegion: {
        type: 'rect',
        rect: { x: 360, y: 120, width: 80, height: 40 },
      },
      gamepadIndex: 9, // Start button
      visual: {
        type: 'rect',
        position: { x: 400, y: 140 },
        size: 60,
        color: '#757575',
        icon: '☰',
      },
    } as ButtonSchema,
  ],
};

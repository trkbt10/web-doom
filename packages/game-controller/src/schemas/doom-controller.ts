import { ControllerSchema, DPadSchema, ButtonSchema } from '../types';

/**
 * Game Boy Color style DOOM controller layout (Landscape)
 * Mimics the classic handheld layout with proper proportions
 */
export const doomControllerSchema: ControllerSchema = {
  name: 'DOOM Controller',
  width: 640,
  height: 280,
  background: {
    color: 'transparent',
    opacity: 0,
  },
  buttons: [
    // D-pad for movement (left side) - Game Boy style cross
    {
      id: 'dpad',
      type: 'dpad',
      label: 'Movement',
      hitRegion: {
        type: 'rect',
        rect: { x: 40, y: 80, width: 120, height: 120 },
      },
      visual: {
        type: 'dpad',
        position: { x: 100, y: 140 },
        size: 120,
        color: '#2a2a2a',
      },
      directions: {
        up: {
          id: 'move-forward',
          hitRegion: {
            type: 'rect',
            rect: { x: 80, y: 80, width: 40, height: 40 },
          },
          gamepadIndex: 12,
        },
        down: {
          id: 'move-backward',
          hitRegion: {
            type: 'rect',
            rect: { x: 80, y: 160, width: 40, height: 40 },
          },
          gamepadIndex: 13,
        },
        left: {
          id: 'turn-left',
          hitRegion: {
            type: 'rect',
            rect: { x: 40, y: 120, width: 40, height: 40 },
          },
          gamepadIndex: 14,
        },
        right: {
          id: 'turn-right',
          hitRegion: {
            type: 'rect',
            rect: { x: 120, y: 120, width: 40, height: 40 },
          },
          gamepadIndex: 15,
        },
      },
    } as DPadSchema,

    // L Button (shoulder, top left)
    {
      id: 'strafe-left',
      type: 'shoulder',
      label: 'L',
      hitRegion: {
        type: 'rect',
        rect: { x: 20, y: 10, width: 80, height: 45 },
      },
      gamepadIndex: 4,
      visual: {
        type: 'rect',
        position: { x: 60, y: 32 },
        size: 70,
        color: '#3a3a3a',
      },
    } as ButtonSchema,

    // R Button (shoulder, top right)
    {
      id: 'strafe-right',
      type: 'shoulder',
      label: 'R',
      hitRegion: {
        type: 'rect',
        rect: { x: 540, y: 10, width: 80, height: 45 },
      },
      gamepadIndex: 5,
      visual: {
        type: 'rect',
        position: { x: 580, y: 32 },
        size: 70,
        color: '#3a3a3a',
      },
    } as ButtonSchema,

    // B Button (right side, lower) - Use/Open doors
    {
      id: 'use',
      type: 'action',
      label: 'B',
      hitRegion: {
        type: 'circle',
        circle: { cx: 470, cy: 140, r: 32 },
      },
      gamepadIndex: 1,
      visual: {
        type: 'circle',
        position: { x: 470, y: 140 },
        size: 64,
        color: '#2a2a2a',
        icon: 'B',
      },
    } as ButtonSchema,

    // A Button (right side, upper-right) - Fire
    {
      id: 'fire',
      type: 'action',
      label: 'A',
      hitRegion: {
        type: 'circle',
        circle: { cx: 530, cy: 110, r: 32 },
      },
      gamepadIndex: 0,
      visual: {
        type: 'circle',
        position: { x: 530, y: 110 },
        size: 64,
        color: '#2a2a2a',
        icon: 'A',
      },
    } as ButtonSchema,

    // SELECT Button (center-left) - Weapon previous
    {
      id: 'weapon-prev',
      type: 'system',
      label: 'SELECT',
      hitRegion: {
        type: 'rect',
        rect: { x: 230, y: 200, width: 80, height: 28 },
      },
      gamepadIndex: 8,
      visual: {
        type: 'rect',
        position: { x: 270, y: 214 },
        size: 70,
        color: '#2a2a2a',
        icon: 'SELECT',
      },
    } as ButtonSchema,

    // START Button (center-right) - Menu/Pause
    {
      id: 'menu',
      type: 'system',
      label: 'START',
      hitRegion: {
        type: 'rect',
        rect: { x: 330, y: 200, width: 80, height: 28 },
      },
      gamepadIndex: 9,
      visual: {
        type: 'rect',
        position: { x: 370, y: 214 },
        size: 70,
        color: '#2a2a2a',
        icon: 'START',
      },
    } as ButtonSchema,

    // Weapon next - mapped to both shoulder buttons together or as hidden button
    {
      id: 'weapon-next',
      type: 'action',
      label: 'Next Weapon',
      hitRegion: {
        type: 'rect',
        rect: { x: 450, y: 200, width: 50, height: 50 },
      },
      gamepadIndex: 2,
      visual: {
        type: 'circle',
        position: { x: 475, y: 225 },
        size: 40,
        color: '#3a3a3a',
        icon: '+',
      },
    } as ButtonSchema,

    // Y Button (right side, upper-left) - Confirm/Enter for menus
    {
      id: 'confirm',
      type: 'action',
      label: 'Y',
      hitRegion: {
        type: 'circle',
        circle: { cx: 470, cy: 80, r: 28 },
      },
      gamepadIndex: 3,
      visual: {
        type: 'circle',
        position: { x: 470, y: 80 },
        size: 56,
        color: '#2a2a2a',
        icon: 'Y',
      },
    } as ButtonSchema,

    // X Button (right side, lower-left) - Automap
    {
      id: 'automap',
      type: 'action',
      label: 'X',
      hitRegion: {
        type: 'circle',
        circle: { cx: 410, cy: 140, r: 28 },
      },
      gamepadIndex: 2,
      visual: {
        type: 'circle',
        position: { x: 410, y: 140 },
        size: 56,
        color: '#2a2a2a',
        icon: 'X',
      },
    } as ButtonSchema,
  ],
};

/**
 * DOOM controller layout optimized for portrait (vertical) screens
 * Larger buttons and more vertical space utilization
 */
export const doomControllerSchemaPortrait: ControllerSchema = {
  name: 'DOOM Controller (Portrait)',
  width: 480,
  height: 420,
  background: {
    color: 'transparent',
    opacity: 0,
  },
  buttons: [
    // D-pad for movement (left side) - Larger for portrait
    {
      id: 'dpad',
      type: 'dpad',
      label: 'Movement',
      hitRegion: {
        type: 'rect',
        rect: { x: 30, y: 140, width: 140, height: 140 },
      },
      visual: {
        type: 'dpad',
        position: { x: 100, y: 210 },
        size: 140,
        color: '#2a2a2a',
      },
      directions: {
        up: {
          id: 'move-forward',
          hitRegion: {
            type: 'rect',
            rect: { x: 77, y: 140, width: 46, height: 46 },
          },
          gamepadIndex: 12,
        },
        down: {
          id: 'move-backward',
          hitRegion: {
            type: 'rect',
            rect: { x: 77, y: 234, width: 46, height: 46 },
          },
          gamepadIndex: 13,
        },
        left: {
          id: 'turn-left',
          hitRegion: {
            type: 'rect',
            rect: { x: 30, y: 187, width: 46, height: 46 },
          },
          gamepadIndex: 14,
        },
        right: {
          id: 'turn-right',
          hitRegion: {
            type: 'rect',
            rect: { x: 124, y: 187, width: 46, height: 46 },
          },
          gamepadIndex: 15,
        },
      },
    } as DPadSchema,

    // L Button (shoulder, top left)
    {
      id: 'strafe-left',
      type: 'shoulder',
      label: 'L',
      hitRegion: {
        type: 'rect',
        rect: { x: 20, y: 10, width: 90, height: 50 },
      },
      gamepadIndex: 4,
      visual: {
        type: 'rect',
        position: { x: 65, y: 35 },
        size: 80,
        color: '#3a3a3a',
      },
    } as ButtonSchema,

    // R Button (shoulder, top right)
    {
      id: 'strafe-right',
      type: 'shoulder',
      label: 'R',
      hitRegion: {
        type: 'rect',
        rect: { x: 370, y: 10, width: 90, height: 50 },
      },
      gamepadIndex: 5,
      visual: {
        type: 'rect',
        position: { x: 415, y: 35 },
        size: 80,
        color: '#3a3a3a',
      },
    } as ButtonSchema,

    // B Button (right side, lower) - Use/Open doors
    {
      id: 'use',
      type: 'action',
      label: 'B',
      hitRegion: {
        type: 'circle',
        circle: { cx: 340, cy: 210, r: 38 },
      },
      gamepadIndex: 1,
      visual: {
        type: 'circle',
        position: { x: 340, y: 210 },
        size: 76,
        color: '#2a2a2a',
        icon: 'B',
      },
    } as ButtonSchema,

    // A Button (right side, upper-right) - Fire
    {
      id: 'fire',
      type: 'action',
      label: 'A',
      hitRegion: {
        type: 'circle',
        circle: { cx: 410, cy: 165, r: 38 },
      },
      gamepadIndex: 0,
      visual: {
        type: 'circle',
        position: { x: 410, y: 165 },
        size: 76,
        color: '#2a2a2a',
        icon: 'A',
      },
    } as ButtonSchema,

    // SELECT Button (center-left) - Weapon previous
    {
      id: 'weapon-prev',
      type: 'system',
      label: 'SELECT',
      hitRegion: {
        type: 'rect',
        rect: { x: 140, y: 340, width: 90, height: 35 },
      },
      gamepadIndex: 8,
      visual: {
        type: 'rect',
        position: { x: 185, y: 357 },
        size: 80,
        color: '#2a2a2a',
        icon: 'SELECT',
      },
    } as ButtonSchema,

    // START Button (center-right) - Menu/Pause
    {
      id: 'menu',
      type: 'system',
      label: 'START',
      hitRegion: {
        type: 'rect',
        rect: { x: 250, y: 340, width: 90, height: 35 },
      },
      gamepadIndex: 9,
      visual: {
        type: 'rect',
        position: { x: 295, y: 357 },
        size: 80,
        color: '#2a2a2a',
        icon: 'START',
      },
    } as ButtonSchema,

    // Weapon next - bottom right corner
    {
      id: 'weapon-next',
      type: 'action',
      label: 'Next Weapon',
      hitRegion: {
        type: 'rect',
        rect: { x: 360, y: 320, width: 60, height: 60 },
      },
      gamepadIndex: 2,
      visual: {
        type: 'circle',
        position: { x: 390, y: 350 },
        size: 50,
        color: '#3a3a3a',
        icon: '+',
      },
    } as ButtonSchema,

    // Y Button (right side, upper-left) - Confirm/Enter for menus
    {
      id: 'confirm',
      type: 'action',
      label: 'Y',
      hitRegion: {
        type: 'circle',
        circle: { cx: 340, cy: 120, r: 34 },
      },
      gamepadIndex: 3,
      visual: {
        type: 'circle',
        position: { x: 340, y: 120 },
        size: 68,
        color: '#2a2a2a',
        icon: 'Y',
      },
    } as ButtonSchema,

    // X Button (right side, lower-left) - Automap
    {
      id: 'automap',
      type: 'action',
      label: 'X',
      hitRegion: {
        type: 'circle',
        circle: { cx: 270, cy: 210, r: 34 },
      },
      gamepadIndex: 2,
      visual: {
        type: 'circle',
        position: { x: 270, y: 210 },
        size: 68,
        color: '#2a2a2a',
        icon: 'X',
      },
    } as ButtonSchema,
  ],
};

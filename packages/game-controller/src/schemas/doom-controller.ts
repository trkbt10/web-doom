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
        rect: { x: 20, y: 15, width: 70, height: 35 },
      },
      gamepadIndex: 4,
      visual: {
        type: 'rect',
        position: { x: 55, y: 33 },
        size: 50,
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
        rect: { x: 550, y: 15, width: 70, height: 35 },
      },
      gamepadIndex: 5,
      visual: {
        type: 'rect',
        position: { x: 585, y: 33 },
        size: 50,
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
        rect: { x: 240, y: 200, width: 65, height: 28 },
      },
      gamepadIndex: 8,
      visual: {
        type: 'rect',
        position: { x: 272, y: 214 },
        size: 45,
        color: '#2a2a2a',
        icon: 'SEL',
      },
    } as ButtonSchema,

    // START Button (center-right) - Menu/Pause
    {
      id: 'menu',
      type: 'system',
      label: 'START',
      hitRegion: {
        type: 'rect',
        rect: { x: 335, y: 200, width: 65, height: 28 },
      },
      gamepadIndex: 9,
      visual: {
        type: 'rect',
        position: { x: 367, y: 214 },
        size: 45,
        color: '#2a2a2a',
        icon: 'STA',
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
        rect: { x: 20, y: 15, width: 85, height: 45 },
      },
      gamepadIndex: 4,
      visual: {
        type: 'rect',
        position: { x: 62, y: 38 },
        size: 60,
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
        rect: { x: 375, y: 15, width: 85, height: 45 },
      },
      gamepadIndex: 5,
      visual: {
        type: 'rect',
        position: { x: 418, y: 38 },
        size: 60,
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
        rect: { x: 150, y: 340, width: 75, height: 35 },
      },
      gamepadIndex: 8,
      visual: {
        type: 'rect',
        position: { x: 187, y: 357 },
        size: 55,
        color: '#2a2a2a',
        icon: 'SEL',
      },
    } as ButtonSchema,

    // START Button (center-right) - Menu/Pause
    {
      id: 'menu',
      type: 'system',
      label: 'START',
      hitRegion: {
        type: 'rect',
        rect: { x: 255, y: 340, width: 75, height: 35 },
      },
      gamepadIndex: 9,
      visual: {
        type: 'rect',
        position: { x: 292, y: 357 },
        size: 55,
        color: '#2a2a2a',
        icon: 'STA',
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
  ],
};

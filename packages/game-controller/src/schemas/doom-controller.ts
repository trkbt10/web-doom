import { ControllerSchema, DPadSchema, ButtonSchema } from '../types';

/**
 * Helper function to create XYAB button group in Nintendo Switch layout
 * @param centerX - Center X position
 * @param centerY - Center Y position
 * @param spacing - Distance from center to each button
 * @param buttonRadius - Radius of each button
 * @returns Array of 4 button schemas (X, A, B, Y)
 */
function createXYABButtons(
  centerX: number,
  centerY: number,
  spacing: number,
  buttonRadius: number
): ButtonSchema[] {
  return [
    // X Button (top)
    {
      id: 'weapon-prev',
      type: 'action',
      label: 'Weapon -',
      hitRegion: {
        type: 'circle',
        circle: { cx: centerX, cy: centerY - spacing, r: buttonRadius },
      },
      gamepadIndex: 2,
      visual: {
        type: 'circle',
        position: { x: centerX, y: centerY - spacing },
        size: buttonRadius,
        color: '#2a2a2a',
        icon: 'X',
      },
    },
    // A Button (right)
    {
      id: 'fire',
      type: 'action',
      label: 'Fire',
      hitRegion: {
        type: 'circle',
        circle: { cx: centerX + spacing, cy: centerY, r: buttonRadius },
      },
      gamepadIndex: 0,
      visual: {
        type: 'circle',
        position: { x: centerX + spacing, y: centerY },
        size: buttonRadius,
        color: '#8B0000',
        icon: 'A',
      },
    },
    // B Button (bottom)
    {
      id: 'use',
      type: 'action',
      label: 'Use',
      hitRegion: {
        type: 'circle',
        circle: { cx: centerX, cy: centerY + spacing, r: buttonRadius },
      },
      gamepadIndex: 1,
      visual: {
        type: 'circle',
        position: { x: centerX, y: centerY + spacing },
        size: buttonRadius,
        color: '#2a2a2a',
        icon: 'B',
      },
    },
    // Y Button (left)
    {
      id: 'weapon-next',
      type: 'action',
      label: 'Weapon +',
      hitRegion: {
        type: 'circle',
        circle: { cx: centerX - spacing, cy: centerY, r: buttonRadius },
      },
      gamepadIndex: 3,
      visual: {
        type: 'circle',
        position: { x: centerX - spacing, y: centerY },
        size: buttonRadius,
        color: '#2a2a2a',
        icon: 'Y',
      },
    },
  ];
}

/**
 * Helper function to create D-pad
 */
function createDPad(
  centerX: number,
  centerY: number,
  size: number
): DPadSchema {
  const halfSize = size / 2;
  const armSize = size / 3;

  return {
    id: 'dpad',
    type: 'dpad',
    label: 'Movement',
    hitRegion: {
      type: 'rect',
      rect: {
        x: centerX - halfSize,
        y: centerY - halfSize,
        width: size,
        height: size
      },
    },
    visual: {
      type: 'dpad',
      position: { x: centerX, y: centerY },
      size,
      color: '#2a2a2a',
    },
    directions: {
      up: {
        id: 'move-forward',
        hitRegion: {
          type: 'rect',
          rect: {
            x: centerX - armSize / 2,
            y: centerY - halfSize,
            width: armSize,
            height: armSize
          },
        },
        gamepadIndex: 12,
      },
      down: {
        id: 'move-backward',
        hitRegion: {
          type: 'rect',
          rect: {
            x: centerX - armSize / 2,
            y: centerY + halfSize - armSize,
            width: armSize,
            height: armSize
          },
        },
        gamepadIndex: 13,
      },
      left: {
        id: 'strafe-left',
        hitRegion: {
          type: 'rect',
          rect: {
            x: centerX - halfSize,
            y: centerY - armSize / 2,
            width: armSize,
            height: armSize
          },
        },
        gamepadIndex: 14,
      },
      right: {
        id: 'strafe-right',
        hitRegion: {
          type: 'rect',
          rect: {
            x: centerX + halfSize - armSize,
            y: centerY - armSize / 2,
            width: armSize,
            height: armSize
          },
        },
        gamepadIndex: 15,
      },
    },
  } as DPadSchema;
}

/**
 * Helper function to create shoulder buttons (L/R)
 */
function createShoulderButton(
  id: string,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  gamepadIndex: number
): ButtonSchema {
  return {
    id,
    type: 'shoulder',
    label,
    hitRegion: {
      type: 'rect',
      rect: { x, y, width, height },
    },
    gamepadIndex,
    visual: {
      type: 'rect',
      position: { x: x + width / 2, y: y + height / 2 },
      size: width,
      color: '#2a2a2a',
      icon: label,
    },
  };
}

/**
 * Helper function to create system buttons (MAP/START)
 */
function createSystemButton(
  id: string,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  gamepadIndex: number
): ButtonSchema {
  return {
    id,
    type: 'system',
    label,
    hitRegion: {
      type: 'rect',
      rect: { x, y, width, height },
    },
    gamepadIndex,
    visual: {
      type: 'rect',
      position: { x: x + width / 2, y: y + height / 2 },
      size: width,
      color: '#2a2a2a',
      icon: label,
    },
  };
}

/**
 * Game Boy style DOOM controller layout (Landscape)
 * Optimized for iPhone landscape orientation (e.g., iPhone 14 Pro: 852x393)
 * Controls are vertically centered
 */
export const doomControllerSchema: ControllerSchema = {
  name: 'DOOM Controller',
  width: 844,
  height: 390,
  orientation: 'landscape',
  displayArea: {
    x: 262,
    y: 75,
    width: 320,
    height: 240,
    borderRadius: 4,
    borderColor: '#444444',
    borderWidth: 3,
    backgroundColor: '#000000',
  },
  background: {
    color: 'transparent',
    opacity: 0,
  },
  buttons: [
    // L/R shoulder buttons
    createShoulderButton('turn-left', 'L', 30, 20, 80, 30, 4),
    createShoulderButton('turn-right', 'R', 734, 20, 80, 30, 5),

    // D-pad - vertically centered
    createDPad(100, 195, 150),

    // XYAB buttons - vertically centered, larger
    ...createXYABButtons(744, 195, 50, 45),

    // System buttons - below display
    createSystemButton('automap', 'MAP', 362, 325, 50, 26, 8),
    createSystemButton('menu', 'START', 432, 325, 50, 26, 9),
  ],
};

/**
 * DOOM controller layout optimized for portrait (vertical) screens
 * Game Boy-inspired compact layout with display at top and controls below
 */
export const doomControllerSchemaPortrait: ControllerSchema = {
  name: 'DOOM Controller (Portrait)',
  width: 400,
  height: 710,
  orientation: 'portrait',
  displayArea: {
    x: 20,
    y: 30,
    width: 360,
    height: 270,
    borderRadius: 4,
    borderColor: '#444444',
    borderWidth: 3,
    backgroundColor: '#000000',
  },
  background: {
    color: 'transparent',
    opacity: 0,
  },
  buttons: [
    // L/R shoulder buttons - directly below display
    createShoulderButton('turn-left', 'L', 30, 320, 70, 30, 4),
    createShoulderButton('turn-right', 'R', 300, 320, 70, 30, 5),

    // D-pad - compact position
    createDPad(90, 490, 140),

    // XYAB buttons - compact position, larger
    ...createXYABButtons(310, 490, 50, 45),

    // System buttons - below controls
    createSystemButton('automap', 'MAP', 130, 640, 60, 28, 8),
    createSystemButton('menu', 'START', 210, 640, 60, 28, 9),
  ],
};

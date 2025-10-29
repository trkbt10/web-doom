# @web-doom/game-controller

Game controller library for web-doom with touch, pointer events, and gamepad API support.

## Features

- **Multi-input Support**: Touch, pointer events (mouse), and Gamepad API
- **iOS Optimized**: Touch event handling with scroll prevention
- **Multi-touch**: Support for multiple simultaneous inputs
- **D-pad Slide Detection**: Smooth directional input when sliding finger
- **Schema-based**: Define controller layouts with JSON schemas
- **SVG Generation**: Dynamic controller graphics from schemas
- **React Component**: Ready-to-use React component
- **TypeScript**: Full type definitions

## Installation

```bash
bun add @web-doom/game-controller
```

## Basic Usage

```tsx
import { GameController, doomControllerSchema } from '@web-doom/game-controller';

function App() {
  const handleInput = (event) => {
    console.log('Button:', event.buttonId);
    console.log('Pressed:', event.pressed);
    console.log('Source:', event.source); // 'touch', 'pointer', or 'gamepad'
  };

  return (
    <GameController
      schema={doomControllerSchema}
      onInput={handleInput}
    />
  );
}
```

## Controller Schema

Define custom controller layouts:

```typescript
import { ControllerSchema } from '@web-doom/game-controller';

const mySchema: ControllerSchema = {
  name: 'My Controller',
  width: 800,
  height: 300,
  background: {
    color: '#1a1a1a',
    opacity: 0.8,
  },
  buttons: [
    {
      id: 'fire',
      type: 'action',
      label: 'Fire',
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
      },
    },
    // ... more buttons
  ],
};
```

## Input Events

The `onInput` callback receives events with the following structure:

```typescript
interface ControllerInputEvent {
  buttonId: string;       // Button identifier
  pressed: boolean;       // Whether button is pressed
  value: number;          // 0-1 for analog inputs
  timestamp: number;      // High-resolution timestamp
  source: 'touch' | 'pointer' | 'gamepad';
}
```

## State Tracking

Track full controller state:

```tsx
<GameController
  schema={doomControllerSchema}
  onStateChange={(state) => {
    // state is a Record<string, ButtonState>
    console.log(state['fire'].pressed);
    console.log(state['move-forward'].value);
  }}
/>
```

## Gamepad API

The controller automatically detects and uses connected gamepads. Button mappings are defined in the schema via `gamepadIndex`:

```typescript
{
  id: 'fire',
  gamepadIndex: 0, // Standard gamepad A button
  // ...
}
```

## Touch and Pointer Events

The controller uses:
- **Pointer Events** for unified touch/mouse handling
- **Touch Events** for iOS scroll prevention
- **CSS `touch-action: none`** for additional OS event suppression

All events are automatically prevented from causing scrolling, zooming, or other default behaviors.

## Multi-touch Support

The controller tracks multiple simultaneous touches:

```tsx
// Press fire with right thumb while moving with left thumb
// Both inputs are tracked independently
```

## D-pad Slide Detection

When sliding your finger from one D-pad direction to another, the controller automatically:
1. Releases the old direction
2. Presses the new direction
3. Maintains smooth transitions

This enables natural diagonal movement and direction changes.

## API Reference

### Components

#### `GameController`

Main controller component.

**Props:**
- `schema: ControllerSchema` - Controller layout definition
- `onInput?: (event: ControllerInputEvent) => void` - Input event callback
- `onStateChange?: (state: ControllerState) => void` - State change callback
- `className?: string` - Additional CSS class
- `style?: CSSProperties` - Additional inline styles
- `showFeedback?: boolean` - Show visual feedback on press (default: true)

### Utilities

#### `generateControllerImage(schema: ControllerSchema): string`

Generate a data URL for controller image from schema.

#### `hitTest(x: number, y: number, region: HitRegion): boolean`

Test if a point hits a button region.

#### `findHitButton(x: number, y: number, schema: ControllerSchema): string | null`

Find which button is hit at coordinates.

## License

MIT

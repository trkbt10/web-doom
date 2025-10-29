# @web-doom/core

A functional, web-standard DOOM engine implementation with decoupled rendering architecture.

## Features

- **Functional Architecture**: Pure functions and immutable state management
- **Web Standards First**: Built on Canvas API, Web Audio API, and standard event APIs
- **Renderer Agnostic**: Clean separation between game engine and rendering layer
- **TypeScript**: Fully typed for excellent developer experience
- **Modular Design**: Easy to extend and customize

## Architecture

The engine is designed with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│          Game Engine Core               │
│  (State, Logic, Physics, Entities)      │
└─────────────┬───────────────────────────┘
              │
              │ Renderer Interface
              │
    ┌─────────┴─────────┬─────────────┐
    │                   │             │
┌───▼────┐      ┌──────▼─────┐   ┌──▼────────┐
│Canvas2D│      │   WebGL    │   │  Custom   │
│Renderer│      │  Renderer  │   │ Renderer  │
└────────┘      └────────────┘   └───────────┘
```

### Core Modules

- **types.ts**: Core type definitions (Vec2, Vec3, enums, configs)
- **game-state.ts**: Game state management (functional state updates)
- **game-loop.ts**: Fixed timestep game loop with RAF
- **renderer.ts**: Renderer interface abstraction

### Subsystems

- **map/**: WAD map parsing and data structures
  - `parser.ts`: Parse map lumps from WAD files
  - `types.ts`: Map data types (vertices, sectors, linedefs, etc.)

- **player/**: Player management
  - `types.ts`: Player state, inventory, weapons
  - Functions for player actions (movement, damage, items)

- **entities/**: Thing/entity system
  - `types.ts`: Entity types, definitions, AI states

- **input/**: Input handling
  - `input.ts`: Keyboard, mouse, touch input with web standard APIs
  - Configurable key bindings

- **physics/**: Physics and collision
  - `collision.ts`: Line collision, BSP traversal, sector detection

- **renderers/**: Renderer implementations
  - `canvas2d-renderer.ts`: Simple 2D top-down renderer (reference implementation)

## Installation

```bash
npm install @web-doom/wad @web-doom/core
```

## Usage

### Basic Setup

```typescript
import { createDoomEngine } from '@web-doom/core';
import { createCanvas2DRenderer } from '@web-doom/core/renderers';
import { decode } from '@web-doom/wad';

// Load WAD file
const wadBuffer = await fetch('doom1.wad').then(r => r.arrayBuffer());
const wad = decode(wadBuffer);

// Create canvas
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

// Create renderer
const renderer = createCanvas2DRenderer(canvas);
renderer.init({ width: 800, height: 600 });

// Create engine
const engine = await createDoomEngine({
  wad,
  renderer,
  element: canvas,
  initialMap: 'E1M1',
  difficulty: 2,
});

// Start game
engine.start();
```

### Custom Renderer

Implement the `Renderer` interface to create your own renderer:

```typescript
import type { Renderer } from '@web-doom/core';

class MyCustomRenderer implements Renderer {
  init(options: RenderOptions): void {
    // Initialize your renderer
  }

  beginFrame(): void {
    // Start frame
  }

  endFrame(): void {
    // Present frame
  }

  // Implement other methods...
}
```

### Game State Access

```typescript
const state = engine.getState();

// Access player
const player = state.players[state.activePlayer];
console.log('Health:', player.stats.health);
console.log('Position:', player.position);

// Access map
if (state.map) {
  console.log('Map:', state.map.name);
  console.log('Sectors:', state.map.sectors.length);
}
```

### Input Customization

```typescript
import { defaultKeyBindings, InputAction } from '@web-doom/core';

const customBindings = new Map(defaultKeyBindings);
customBindings.set('KeyR', InputAction.Use);

const engine = await createDoomEngine({
  // ...
  keyBindings: customBindings,
});
```

## API Reference

### `createDoomEngine(config: CreateDoomEngineConfig): Promise<DoomEngine>`

Creates a new DOOM engine instance.

**Config Options:**
- `wad: WadFile` - Decoded WAD file
- `renderer: Renderer` - Renderer implementation
- `element: HTMLElement` - Element for input capture
- `difficulty?: Difficulty` - Game difficulty (1-4)
- `gameMode?: GameMode` - Game mode
- `initialMap?: string` - Map to load on start
- `keyBindings?: KeyBindings` - Custom key bindings
- `gameLoopConfig?: GameLoopConfig` - Game loop settings

**Returns:** `DoomEngine` instance with methods:
- `start()` - Start game loop
- `stop()` - Stop game loop
- `loadMap(name: string)` - Load a different map
- `getState()` - Get current game state
- `getRenderer()` - Get renderer instance
- `dispose()` - Clean up resources

### Renderer Interface

```typescript
interface Renderer {
  init(options: RenderOptions): void;
  beginFrame(): void;
  endFrame(): void;
  clear(color?: string): void;
  setCamera(camera: Camera): void;
  renderWall(start: Vec2, end: Vec2, height: number, textureName: string, sidedef: Sidedef): void;
  renderFloor(sector: Sector, vertices: Vec2[]): void;
  renderCeiling(sector: Sector, vertices: Vec2[]): void;
  renderSprite(thing: Thing, screenPos: Vec2, scale: number): void;
  renderAutomap(linedefs: Linedef[], playerPos: Vec2, playerAngle: Angle, scale: number): void;
  renderHUD(data: HUDData): void;
  getRenderTarget(): unknown;
  dispose(): void;
}
```

## Game Loop

The engine uses a fixed timestep game loop running at 35 FPS (matching original DOOM):

- **Fixed Update Rate**: 35 updates per second
- **Variable Render Rate**: Renders as fast as possible
- **Frame Skipping**: Up to 5 frames to maintain update rate
- **Delta Time**: Consistent physics simulation

## Input Controls

Default key bindings:

| Action | Keys |
|--------|------|
| Move Forward | W, Up Arrow |
| Move Backward | S, Down Arrow |
| Strafe Left | A |
| Strafe Right | D |
| Turn Left | Left Arrow |
| Turn Right | Right Arrow |
| Fire | Space, Left Mouse |
| Use | E, Right Mouse |
| Run | Shift |
| Weapons | 1-7 |
| Next Weapon | F |
| Previous Weapon | Q |
| Automap | Tab |

## Performance

- **Memory Efficient**: Functional updates minimize allocations
- **Predictable**: Fixed timestep ensures consistent behavior
- **Optimized Collision**: BSP tree traversal and blockmap
- **RAF-based**: Smooth rendering at display refresh rate

## Development

```bash
# Install dependencies
npm install

# Type check
npm run lint

# Build
npm run build

# Test
npm test
```

## Future Enhancements

- [ ] WebGL renderer for 3D perspective
- [ ] Software renderer (like original DOOM)
- [ ] Monster AI implementation
- [ ] Weapon system
- [ ] Sound effects and music (Web Audio API)
- [ ] Multiplayer support (WebRTC)
- [ ] Mobile touch controls
- [ ] VR support (WebXR)

## License

MIT

## Credits

Based on the original DOOM engine by id Software.

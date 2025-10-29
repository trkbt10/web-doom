/**
 * Game loop with fixed timestep
 */

import type { DoomGameState } from './game-state';
import { updateGameState, updateFPS, getActivePlayer, updatePlayer } from './game-state';
import type { Renderer } from './renderer';
import { getMovementInput, getTurnInput, clearFrameInput, isActionActive } from './input/input';
import { InputAction } from './input/input';
import { tryMove, getHeightAt } from './physics/collision';
import type { TimeSeconds } from './types';

/**
 * Game loop configuration
 */
export interface GameLoopConfig {
  /** Target updates per second */
  updatesPerSecond: number;
  /** Maximum frame skip */
  maxFrameSkip: number;
}

/**
 * Default game loop configuration
 */
export const defaultGameLoopConfig: GameLoopConfig = {
  updatesPerSecond: 35, // DOOM's original 35 FPS
  maxFrameSkip: 5,
};

/**
 * Game loop state
 */
interface GameLoopState {
  running: boolean;
  lastTime: number;
  accumulator: number;
  frameId: number | null;
  fpsTime: number;
  fpsFrames: number;
}

/**
 * Create a game loop
 */
export function createGameLoop(
  getState: () => DoomGameState,
  setState: (state: DoomGameState) => void,
  renderer: Renderer,
  config: GameLoopConfig = defaultGameLoopConfig
): {
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
} {
  const fixedDeltaTime = 1 / config.updatesPerSecond;

  const loopState: GameLoopState = {
    running: false,
    lastTime: 0,
    accumulator: 0,
    frameId: null,
    fpsTime: 0,
    fpsFrames: 0,
  };

  const loop = (currentTime: number): void => {
    if (!loopState.running) return;

    // Calculate delta time in seconds
    const deltaTime = Math.min((currentTime - loopState.lastTime) / 1000, 0.1);
    loopState.lastTime = currentTime;

    // Add to accumulator
    loopState.accumulator += deltaTime;

    // Fixed timestep updates
    let steps = 0;
    while (loopState.accumulator >= fixedDeltaTime && steps < config.maxFrameSkip) {
      // Update game state
      let state = getState();
      state = update(state, fixedDeltaTime);
      setState(state);

      loopState.accumulator -= fixedDeltaTime;
      steps++;
    }

    // Render
    const state = getState();
    render(state, renderer);

    // Update FPS
    loopState.fpsFrames++;
    if (currentTime - loopState.fpsTime >= 1000) {
      const fps = (loopState.fpsFrames * 1000) / (currentTime - loopState.fpsTime);
      setState(updateFPS(state, Math.round(fps)));
      loopState.fpsFrames = 0;
      loopState.fpsTime = currentTime;
    }

    // Clear frame-based input
    clearFrameInput(state.input);

    // Request next frame
    loopState.frameId = requestAnimationFrame(loop);
  };

  return {
    start: () => {
      if (loopState.running) return;

      loopState.running = true;
      loopState.lastTime = performance.now();
      loopState.accumulator = 0;
      loopState.fpsTime = performance.now();
      loopState.fpsFrames = 0;

      loopState.frameId = requestAnimationFrame(loop);
    },

    stop: () => {
      loopState.running = false;
      if (loopState.frameId !== null) {
        cancelAnimationFrame(loopState.frameId);
        loopState.frameId = null;
      }
    },

    isRunning: () => loopState.running,
  };
}

/**
 * Update game logic
 */
function update(state: DoomGameState, deltaTime: TimeSeconds): DoomGameState {
  // Update base state
  state = updateGameState(state, deltaTime);

  // Update player
  state = updatePlayerLogic(state, deltaTime);

  // Update things/entities
  state = updateThings(state, deltaTime);

  return state;
}

/**
 * Update player logic
 */
function updatePlayerLogic(state: DoomGameState, deltaTime: TimeSeconds): DoomGameState {
  if (!state.map) return state;

  const player = getActivePlayer(state);
  if (!player) return state;

  // Get input
  const movement = getMovementInput(state.input);
  const turn = getTurnInput(state.input);
  const isRunning = isActionActive(state.input, InputAction.Run);

  // Movement speed
  const moveSpeed = isRunning ? 100 : 50; // Units per second
  const turnSpeed = 3.0; // Radians per second

  // Update angle
  let newAngle = player.angle + turn.yaw * deltaTime * turnSpeed;
  // Normalize angle
  while (newAngle < 0) newAngle += Math.PI * 2;
  while (newAngle >= Math.PI * 2) newAngle -= Math.PI * 2;

  // Update pitch
  let newPitch = player.pitch + turn.pitch * deltaTime;
  newPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, newPitch));

  // Calculate movement
  const forwardX = Math.cos(newAngle) * movement.forward * moveSpeed * deltaTime;
  const forwardY = Math.sin(newAngle) * movement.forward * moveSpeed * deltaTime;
  const strafeX = Math.cos(newAngle - Math.PI / 2) * movement.strafe * moveSpeed * deltaTime;
  const strafeY = Math.sin(newAngle - Math.PI / 2) * movement.strafe * moveSpeed * deltaTime;

  const moveX = forwardX + strafeX;
  const moveY = forwardY + strafeY;

  // Try to move
  const from = { x: player.position.x, y: player.position.y };
  const to = { x: player.position.x + moveX, y: player.position.y + moveY };

  const collision = tryMove(state.map, from, to, 16, 56); // Player radius and height

  // Update position
  let newPosition = { ...player.position, x: collision.position.x, y: collision.position.y };

  // Update Z position based on sector height
  const heights = getHeightAt(state.map, collision.position);
  if (heights) {
    newPosition.z = heights.floor + 41; // Player view height from floor
  }

  // Update player
  const newPlayer = {
    ...player,
    position: newPosition,
    angle: newAngle,
    pitch: newPitch,
    forwardMove: movement.forward,
    sideMove: movement.strafe,
    attacking: isActionActive(state.input, InputAction.Fire),
    using: isActionActive(state.input, InputAction.Use),
  };

  return updatePlayer(state, state.activePlayer, newPlayer);
}

/**
 * Update things/entities
 */
function updateThings(state: DoomGameState, _deltaTime: TimeSeconds): DoomGameState {
  // TODO: Implement AI and entity updates
  return state;
}

/**
 * Render game
 */
function render(state: DoomGameState, renderer: Renderer): void {
  renderer.beginFrame();
  renderer.clear('#000000');

  if (!state.map) {
    renderer.endFrame();
    return;
  }

  const player = getActivePlayer(state);
  if (!player) {
    renderer.endFrame();
    return;
  }

  // Set camera
  renderer.setCamera({
    position: player.position,
    angle: player.angle,
    pitch: player.pitch,
    fov: Math.PI / 2, // 90 degrees
  });

  // Pass map data to renderer if it supports it (for Canvas3DRenderer)
  if ('setMapData' in renderer && typeof renderer.setMapData === 'function') {
    renderer.setMapData(state.map);
  }

  // Render world
  renderWorld(state, renderer);

  // Render player indicator (always visible in top-down view)
  renderer.renderAutomap(
    state.showAutomap ? state.map.linedefs : [],
    { x: player.position.x, y: player.position.y },
    player.angle,
    1.0
  );

  // Render HUD
  renderer.renderHUD({
    health: player.stats.health,
    armor: player.stats.armor,
    ammo: player.inventory.ammo[0], // Current weapon ammo
    maxAmmo: player.inventory.maxAmmo[0],
    weapons: player.inventory.weapons,
    currentWeapon: player.currentWeapon,
    keys: {
      blue: player.inventory.keys.blue || player.inventory.keys.blueSkull,
      yellow: player.inventory.keys.yellow || player.inventory.keys.yellowSkull,
      red: player.inventory.keys.red || player.inventory.keys.redSkull,
    },
    face: 'STFST01', // TODO: Dynamic face based on health/state
    fps: state.fps,
  });

  renderer.endFrame();
}

/**
 * Render the game world
 */
function renderWorld(state: DoomGameState, renderer: Renderer): void {
  if (!state.map) return;

  const player = getActivePlayer(state);
  if (!player) return;

  // TODO: Implement proper 3D rendering with BSP traversal
  // For now, just render a basic representation

  // Render all sectors (simplified)
  for (let i = 0; i < state.map.sectors.length; i++) {
    const sector = state.map.sectors[i];

    // Find vertices for this sector (by checking linedefs)
    const vertices: Array<{ x: number; y: number }> = [];
    for (const linedef of state.map.linedefs) {
      const sidedef =
        linedef.rightSidedef >= 0 ? state.map.sidedefs[linedef.rightSidedef] : null;
      if (sidedef && sidedef.sector === i) {
        const v = state.map.vertices[linedef.startVertex];
        vertices.push({ x: v.x, y: v.y });
      }
    }

    if (vertices.length > 0) {
      renderer.renderFloor(sector, vertices);
      renderer.renderCeiling(sector, vertices);
    }
  }

  // Render all walls (linedefs)
  for (const linedef of state.map.linedefs) {
    const v1 = state.map.vertices[linedef.startVertex];
    const v2 = state.map.vertices[linedef.endVertex];

    if (linedef.rightSidedef >= 0) {
      const sidedef = state.map.sidedefs[linedef.rightSidedef];
      const sector = state.map.sectors[sidedef.sector];

      renderer.renderWall(
        { x: v1.x, y: v1.y },
        { x: v2.x, y: v2.y },
        sector.ceilingHeight - sector.floorHeight,
        sidedef.middleTexture || sidedef.upperTexture || 'GRAY',
        sidedef
      );
    }
  }

  // Render things
  for (const thing of state.things) {
    // TODO: Project thing to screen space
    const screenPos = { x: 0, y: 0 }; // Placeholder
    renderer.renderSprite(thing, screenPos, 1.0);
  }
}

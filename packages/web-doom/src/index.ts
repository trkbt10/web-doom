/**
 * Web DOOM - DOOM engine implementation for web
 * Functional, web-standard approach with renderer decoupling
 */

import { WadFile } from '@web-doom/wad';
import { parseMap, getMapNames, parseThings } from './map/parser';
import { createGameState, setMap, addPlayer, addThing, GameState } from './game-state';
import type { DoomGameState } from './game-state';
import { createPlayer } from './player/types';
import { initInput } from './input/input';
import type { KeyBindings } from './input/input';
import { createGameLoop } from './game-loop';
import type { GameLoopConfig } from './game-loop';
import { Difficulty, GameMode } from './types';
import type { Renderer } from './renderer';
import { ThingType, getThingDef, ThingState } from './entities/types';
import type { Thing } from './entities/types';

/**
 * DOOM Engine instance
 */
export interface DoomEngine {
  /** Get current game state */
  getState: () => DoomGameState;

  /** Load a map */
  loadMap: (mapName: string) => Promise<void>;

  /** Get available map names */
  getMapNames: () => string[];

  /** Start the game */
  start: () => void;

  /** Stop the game */
  stop: () => void;

  /** Check if running */
  isRunning: () => boolean;

  /** Get renderer */
  getRenderer: () => Renderer;

  /** Cleanup */
  dispose: () => void;
}

/**
 * Configuration for creating a DOOM engine instance
 */
export interface CreateDoomEngineConfig {
  /** WAD file */
  wad: WadFile;

  /** Renderer implementation */
  renderer: Renderer;

  /** HTML element for input handling */
  element: HTMLElement;

  /** Game difficulty */
  difficulty?: Difficulty;

  /** Game mode */
  gameMode?: GameMode;

  /** Initial map to load */
  initialMap?: string;

  /** Key bindings */
  keyBindings?: KeyBindings;

  /** Game loop configuration */
  gameLoopConfig?: GameLoopConfig;
}

/**
 * Create a DOOM engine instance
 */
export async function createDoomEngine(config: CreateDoomEngineConfig): Promise<DoomEngine> {
  // Create game state
  let gameState = createGameState(config.wad, config.difficulty, config.gameMode);

  // Initialize input
  const inputCleanup = initInput(config.element, gameState.input, config.keyBindings);

  // Create game loop
  const gameLoop = createGameLoop(
    () => gameState,
    (newState) => {
      gameState = newState;
    },
    config.renderer,
    config.gameLoopConfig
  );

  // Load initial map if specified
  if (config.initialMap) {
    const map = parseMap(config.wad, config.initialMap);
    if (map) {
      gameState = setMap(gameState, map);

      // Load things from map
      const thingsData = parseThings(config.wad, config.initialMap);
      gameState = loadThingsIntoGame(gameState, thingsData);

      // Find player start
      const playerStart = findPlayerStart(config.wad, config.initialMap);
      if (playerStart) {
        const player = createPlayer(
          0,
          { x: playerStart.x, y: playerStart.y, z: 0 },
          playerStart.angle
        );
        gameState = addPlayer(gameState, player);
      }
    }
  }

  return {
    getState: () => gameState,

    loadMap: async (mapName: string) => {
      const map = parseMap(config.wad, mapName);
      if (!map) {
        throw new Error(`Failed to load map: ${mapName}`);
      }

      gameState = setMap(gameState, map);

      // Load things from map
      const thingsData = parseThings(config.wad, mapName);
      gameState = loadThingsIntoGame(gameState, thingsData);

      // Find player start
      const playerStart = findPlayerStart(config.wad, mapName);
      if (playerStart) {
        const player = createPlayer(
          0,
          { x: playerStart.x, y: playerStart.y, z: 0 },
          playerStart.angle
        );
        gameState = addPlayer(gameState, player);
      }

      gameState.state = GameState.Playing;
    },

    getMapNames: () => getMapNames(config.wad),

    start: () => {
      gameState.state = GameState.Playing;
      gameLoop.start();
    },

    stop: () => {
      gameLoop.stop();
      gameState.state = GameState.Paused;
    },

    isRunning: () => gameLoop.isRunning(),

    getRenderer: () => config.renderer,

    dispose: () => {
      gameLoop.stop();
      inputCleanup();
      config.renderer.dispose();
    },
  };
}

/**
 * Load things from raw thing data into game state
 */
function loadThingsIntoGame(
  state: DoomGameState,
  thingsData: Array<{ x: number; y: number; angle: number; type: number; flags: number }>
): DoomGameState {
  let nextThingId = 1;

  for (const thingData of thingsData) {
    // Skip player starts
    if (
      thingData.type === ThingType.Player1Start ||
      thingData.type === ThingType.Player2Start ||
      thingData.type === ThingType.Player3Start ||
      thingData.type === ThingType.Player4Start ||
      thingData.type === ThingType.DeathmatchStart
    ) {
      continue;
    }

    // Get thing definition
    const def = getThingDef(thingData.type as ThingType);
    if (!def) {
      // Unknown thing type, skip
      continue;
    }

    // Convert angle from degrees to radians
    const angleRad = (thingData.angle * Math.PI) / 180;

    // Create thing
    const thing: Thing = {
      id: nextThingId++,
      type: thingData.type as ThingType,
      position: { x: thingData.x, y: thingData.y, z: 0 },
      angle: angleRad,
      velocity: { x: 0, y: 0, z: 0 },
      state: ThingState.Idle,
      flags: thingData.flags,
      health: def.health,
      radius: def.radius,
      height: def.height,
      sprite: def.sprite,
      frame: 0,
      tics: 0,
      threshold: 0,
      moveDir: 0,
      moveCount: 0,
    };

    state = addThing(state, thing);
  }

  return state;
}

/**
 * Find player start position in a map
 */
function findPlayerStart(
  wad: WadFile,
  mapName: string
): { x: number; y: number; angle: number } | null {
  const thingsData = parseThings(wad, mapName);

  for (const thingData of thingsData) {
    if (thingData.type === ThingType.Player1Start) {
      // Convert DOOM angle (0-359) to radians
      const radians = (thingData.angle * Math.PI) / 180;
      return { x: thingData.x, y: thingData.y, angle: radians };
    }
  }

  return null;
}

// Re-export types and utilities
export * from './types';
export * from './game-state';
export * from './renderer';
export * from './renderers';
export * from './map/types';
export * from './map/parser';
export * from './player/types';
export * from './entities/types';
export * from './input/input';
export * from './physics/collision';
export * from './game-loop';
export * from './graphics';
export * from './weapons/weapon-system';
export * from './weapons/weapon-hud';
export * from './effects/particle-system';
export * from './save-system';
export * from './map/sector-actions';
export * from './ai/monster-ai';

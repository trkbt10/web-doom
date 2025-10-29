/**
 * Web DOOM - DOOM engine implementation for web
 * Functional, web-standard approach with renderer decoupling
 */

import { WadFile } from '@web-doom/wad';
import { parseMap, getMapNames } from './map/parser';
import { createGameState, setMap, addPlayer, GameState } from './game-state';
import type { DoomGameState } from './game-state';
import { createPlayer } from './player/types';
import { initInput } from './input/input';
import type { KeyBindings } from './input/input';
import { createGameLoop } from './game-loop';
import type { GameLoopConfig } from './game-loop';
import { Difficulty, GameMode } from './types';
import type { Renderer } from './renderer';
import { ThingType } from './entities/types';

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
 * Find player start position in a map
 */
function findPlayerStart(
  wad: WadFile,
  mapName: string
): { x: number; y: number; angle: number } | null {
  const map = parseMap(wad, mapName);
  if (!map) return null;

  // Parse THINGS lump to find player start
  const mapIndex = wad.lumps.findIndex((lump: { name: string }) => lump.name === mapName);
  if (mapIndex === -1) return null;

  const thingsLump = wad.lumps[mapIndex + 1]; // THINGS is first after map marker
  if (!thingsLump || !thingsLump.name.startsWith('THINGS')) return null;

  const data = new DataView(thingsLump.data);
  const thingCount = thingsLump.size / 10; // Each thing is 10 bytes

  for (let i = 0; i < thingCount; i++) {
    const offset = i * 10;
    const x = data.getInt16(offset, true);
    const y = data.getInt16(offset + 2, true);
    const angle = data.getInt16(offset + 4, true);
    const type = data.getInt16(offset + 6, true);

    if (type === ThingType.Player1Start) {
      // Convert DOOM angle (0-359) to radians
      const radians = (angle * Math.PI) / 180;
      return { x, y, angle: radians };
    }
  }

  return null;
}

// Re-export types and utilities
export * from './types';
export * from './game-state';
export * from './renderer';
export * from './map/types';
export * from './map/parser';
export * from './player/types';
export * from './entities/types';
export * from './input/input';
export * from './physics/collision';
export * from './game-loop';

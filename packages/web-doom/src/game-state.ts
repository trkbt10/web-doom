/**
 * Game state management
 */

import { WadFile } from '@web-doom/wad';
import type { MapData } from './map/types';
import type { Player } from './player/types';
import type { Thing } from './entities/types';
import type { InputState } from './input/input';
import { Difficulty, GameMode, type TimeSeconds } from './types';
import { SectorActionManager } from './map/sector-actions';

/**
 * Game state
 */
export enum GameState {
  Menu,
  Loading,
  Playing,
  Paused,
  GameOver,
}

/**
 * Main game state structure
 */
export interface DoomGameState {
  /** Current state */
  state: GameState;

  /** WAD file */
  wad: WadFile;

  /** Current map */
  map: MapData | null;

  /** Players */
  players: Player[];

  /** Active player index */
  activePlayer: number;

  /** Things/entities */
  things: Thing[];

  /** Game time in seconds */
  time: TimeSeconds;

  /** Difficulty */
  difficulty: Difficulty;

  /** Game mode */
  gameMode: GameMode;

  /** Input state */
  input: InputState;

  /** Show automap */
  showAutomap: boolean;

  /** FPS counter */
  fps: number;

  /** Frame counter */
  frameCount: number;

  /** Sector action manager */
  sectorActionManager: SectorActionManager;
}

/**
 * Create initial game state
 */
export function createGameState(
  wad: WadFile,
  difficulty: Difficulty = 2,
  gameMode: GameMode = GameMode.Shareware
): DoomGameState {
  return {
    state: GameState.Menu,
    wad,
    map: null,
    players: [],
    activePlayer: 0,
    things: [],
    time: 0,
    difficulty,
    gameMode,
    input: { keys: new Map(), mouse: { x: 0, y: 0, deltaX: 0, deltaY: 0, buttons: [], locked: false }, touch: { active: false, touches: [] } },
    showAutomap: false,
    fps: 0,
    frameCount: 0,
    sectorActionManager: new SectorActionManager(),
  };
}

/**
 * Update game state
 */
export function updateGameState(state: DoomGameState, deltaTime: TimeSeconds): DoomGameState {
  if (state.state !== GameState.Playing) {
    return state;
  }

  return {
    ...state,
    time: state.time + deltaTime,
    frameCount: state.frameCount + 1,
  };
}

/**
 * Set current map
 */
export function setMap(state: DoomGameState, map: MapData): DoomGameState {
  return {
    ...state,
    map,
  };
}

/**
 * Add player to game
 */
export function addPlayer(state: DoomGameState, player: Player): DoomGameState {
  return {
    ...state,
    players: [...state.players, player],
  };
}

/**
 * Update player in game state
 */
export function updatePlayer(state: DoomGameState, playerIndex: number, player: Player): DoomGameState {
  const newPlayers = [...state.players];
  newPlayers[playerIndex] = player;

  return {
    ...state,
    players: newPlayers,
  };
}

/**
 * Get active player
 */
export function getActivePlayer(state: DoomGameState): Player | null {
  if (state.activePlayer >= 0 && state.activePlayer < state.players.length) {
    return state.players[state.activePlayer];
  }
  return null;
}

/**
 * Add thing to game
 */
export function addThing(state: DoomGameState, thing: Thing): DoomGameState {
  return {
    ...state,
    things: [...state.things, thing],
  };
}

/**
 * Remove thing from game
 */
export function removeThing(state: DoomGameState, thingId: number): DoomGameState {
  return {
    ...state,
    things: state.things.filter((t) => t.id !== thingId),
  };
}

/**
 * Update thing in game state
 */
export function updateThing(state: DoomGameState, thingId: number, thing: Thing): DoomGameState {
  const newThings = state.things.map((t) => (t.id === thingId ? thing : t));

  return {
    ...state,
    things: newThings,
  };
}

/**
 * Toggle pause
 */
export function togglePause(state: DoomGameState): DoomGameState {
  if (state.state === GameState.Playing) {
    return { ...state, state: GameState.Paused };
  } else if (state.state === GameState.Paused) {
    return { ...state, state: GameState.Playing };
  }
  return state;
}

/**
 * Toggle automap
 */
export function toggleAutomap(state: DoomGameState): DoomGameState {
  return {
    ...state,
    showAutomap: !state.showAutomap,
  };
}

/**
 * Update FPS
 */
export function updateFPS(state: DoomGameState, fps: number): DoomGameState {
  return {
    ...state,
    fps,
  };
}

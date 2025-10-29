/**
 * Save/Load system for game state persistence
 * Uses LocalStorage to save game progress
 */

import type { DoomGameState } from './game-state';
import type { Thing } from './entities/types';
import { getActivePlayer } from './game-state';

export interface SaveGameData {
  version: number;
  timestamp: number;
  mapName: string;
  player: {
    x: number;
    y: number;
    z: number;
    angle: number;
    health: number;
    armor: number;
    weapons: number[];
    currentWeapon: number;
    ammo: Record<number, number>;
  };
  things: Array<{
    id: number;
    type: number;
    x: number;
    y: number;
    z: number;
    angle: number;
    health: number;
    state: number;
    flags: number;
  }>;
  sectors: Array<{
    index: number;
    floorHeight: number;
    ceilingHeight: number;
  }>;
}

const SAVE_KEY_PREFIX = 'web-doom-save-';
const SAVE_VERSION = 1;
const MAX_SAVE_SLOTS = 10;

/**
 * Save the current game state to a slot
 */
export function saveGame(state: DoomGameState, slot: number): boolean {
  if (slot < 0 || slot >= MAX_SAVE_SLOTS) {
    console.error(`Invalid save slot: ${slot}`);
    return false;
  }

  try {
    const player = getActivePlayer(state);
    if (!player) {
      console.error('No active player to save');
      return false;
    }

    const saveData: SaveGameData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      mapName: 'E1M1', // TODO: Store map name in game state
      player: {
        x: player.position.x,
        y: player.position.y,
        z: player.position.z,
        angle: player.angle,
        health: player.stats.health,
        armor: player.stats.armor,
        weapons: Array.from(player.inventory.weapons),
        currentWeapon: player.currentWeapon,
        ammo: { ...player.inventory.ammo },
      },
      things: state.things.map((thing: Thing) => ({
        id: thing.id,
        type: thing.type,
        x: thing.position.x,
        y: thing.position.y,
        z: thing.position.z,
        angle: thing.angle,
        health: thing.health,
        state: thing.state,
        flags: thing.flags,
      })),
      sectors: [],
    };

    // Save sector states (for doors, lifts, etc.)
    if (state.map) {
      saveData.sectors = state.map.sectors.map((sector, index) => ({
        index,
        floorHeight: sector.floorHeight,
        ceilingHeight: sector.ceilingHeight,
      }));
    }

    const json = JSON.stringify(saveData);
    localStorage.setItem(`${SAVE_KEY_PREFIX}${slot}`, json);

    console.log(`Game saved to slot ${slot}`);
    return true;
  } catch (error) {
    console.error('Failed to save game:', error);
    return false;
  }
}

/**
 * Load game state from a slot
 */
export function loadGame(state: DoomGameState, slot: number): DoomGameState | null {
  if (slot < 0 || slot >= MAX_SAVE_SLOTS) {
    console.error(`Invalid save slot: ${slot}`);
    return null;
  }

  try {
    const json = localStorage.getItem(`${SAVE_KEY_PREFIX}${slot}`);
    if (!json) {
      console.log(`No save data in slot ${slot}`);
      return null;
    }

    const saveData: SaveGameData = JSON.parse(json);

    // Version check
    if (saveData.version !== SAVE_VERSION) {
      console.warn(`Save version mismatch: ${saveData.version} !== ${SAVE_VERSION}`);
      // Could implement migration logic here
    }

    // Get current player to update
    const player = getActivePlayer(state);
    if (!player) {
      console.error('No active player to load into');
      return null;
    }

    // Create new state based on loaded data
    const newState: DoomGameState = { ...state };

    // Update player with saved data
    const updatedPlayer = {
      ...player,
      position: {
        x: saveData.player.x,
        y: saveData.player.y,
        z: saveData.player.z,
      },
      angle: saveData.player.angle,
      stats: {
        ...player.stats,
        health: saveData.player.health,
        armor: saveData.player.armor,
      },
      inventory: {
        ...player.inventory,
        weapons: new Set(saveData.player.weapons),
        ammo: { ...saveData.player.ammo },
      },
      currentWeapon: saveData.player.currentWeapon,
    };

    newState.players = [...state.players];
    newState.players[state.activePlayer] = updatedPlayer;

    // Restore things
    const thingMap = new Map<number, Thing>();
    for (const savedThing of saveData.things) {
      const thing: Thing = {
        id: savedThing.id,
        type: savedThing.type,
        position: {
          x: savedThing.x,
          y: savedThing.y,
          z: savedThing.z,
        },
        angle: savedThing.angle,
        health: savedThing.health,
        state: savedThing.state,
        flags: savedThing.flags,
        radius: 20, // Will be overwritten by thing def
        height: 56,
        sprite: '',
        speed: 0,
      };

      // Apply thing definition defaults
      // (In a full implementation, we'd look up the thing def here)
      thingMap.set(thing.id, thing);
    }
    newState.things = Array.from(thingMap.values());

    // Restore sector states
    if (newState.map && saveData.sectors.length > 0) {
      for (const savedSector of saveData.sectors) {
        if (savedSector.index < newState.map.sectors.length) {
          newState.map.sectors[savedSector.index].floorHeight = savedSector.floorHeight;
          newState.map.sectors[savedSector.index].ceilingHeight = savedSector.ceilingHeight;
        }
      }
    }

    console.log(`Game loaded from slot ${slot}`);
    return newState;
  } catch (error) {
    console.error('Failed to load game:', error);
    return null;
  }
}

/**
 * Delete a save slot
 */
export function deleteSave(slot: number): boolean {
  if (slot < 0 || slot >= MAX_SAVE_SLOTS) {
    return false;
  }

  try {
    localStorage.removeItem(`${SAVE_KEY_PREFIX}${slot}`);
    console.log(`Save slot ${slot} deleted`);
    return true;
  } catch (error) {
    console.error('Failed to delete save:', error);
    return false;
  }
}

/**
 * Get save slot info
 */
export function getSaveInfo(slot: number): { exists: boolean; timestamp?: number; mapName?: string } {
  if (slot < 0 || slot >= MAX_SAVE_SLOTS) {
    return { exists: false };
  }

  try {
    const json = localStorage.getItem(`${SAVE_KEY_PREFIX}${slot}`);
    if (!json) {
      return { exists: false };
    }

    const saveData: SaveGameData = JSON.parse(json);
    return {
      exists: true,
      timestamp: saveData.timestamp,
      mapName: saveData.mapName,
    };
  } catch (error) {
    return { exists: false };
  }
}

/**
 * List all save slots with their info
 */
export function listSaves(): Array<{ slot: number; exists: boolean; timestamp?: number; mapName?: string }> {
  const saves = [];
  for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
    saves.push({ slot: i, ...getSaveInfo(i) });
  }
  return saves;
}

/**
 * Quick save to slot 0
 */
export function quickSave(state: DoomGameState): boolean {
  return saveGame(state, 0);
}

/**
 * Quick load from slot 0
 */
export function quickLoad(state: DoomGameState): DoomGameState | null {
  return loadGame(state, 0);
}

/**
 * Auto-save (uses slot 9)
 */
export function autoSave(state: DoomGameState): boolean {
  return saveGame(state, MAX_SAVE_SLOTS - 1);
}

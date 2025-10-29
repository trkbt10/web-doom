/**
 * Tests for game state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createGameState,
  updateGameState,
  setMap,
  addPlayer,
  updatePlayer,
  getActivePlayer,
  addThing,
  removeThing,
  updateThing,
  togglePause,
  toggleAutomap,
  updateFPS,
  GameState,
  type DoomGameState,
} from './game-state';
import { Difficulty, GameMode } from './types';
import { createPlayer } from './player/types';
import type { MapData } from './map/types';
import type { Thing } from './entities/types';
import { ThingType, ThingState } from './entities/types';

// Mock WAD file
const mockWad = {
  type: 'IWAD' as const,
  lumps: [],
  directory: {},
};

describe('game-state', () => {
  describe('createGameState', () => {
    it('should create initial game state with defaults', () => {
      const state = createGameState(mockWad);

      expect(state.state).toBe(GameState.Menu);
      expect(state.wad).toBe(mockWad);
      expect(state.map).toBeNull();
      expect(state.players).toEqual([]);
      expect(state.activePlayer).toBe(0);
      expect(state.things).toEqual([]);
      expect(state.time).toBe(0);
      expect(state.difficulty).toBe(2);
      expect(state.gameMode).toBe(GameMode.Shareware);
      expect(state.showAutomap).toBe(false);
      expect(state.fps).toBe(0);
      expect(state.frameCount).toBe(0);
    });

    it('should create game state with custom difficulty and game mode', () => {
      const state = createGameState(mockWad, Difficulty.Hard, GameMode.Commercial);

      expect(state.difficulty).toBe(Difficulty.Hard);
      expect(state.gameMode).toBe(GameMode.Commercial);
    });
  });

  describe('updateGameState', () => {
    let state: DoomGameState;

    beforeEach(() => {
      state = createGameState(mockWad);
    });

    it('should not update time when not playing', () => {
      state.state = GameState.Menu;
      const updated = updateGameState(state, 1.0);

      expect(updated.time).toBe(0);
      expect(updated.frameCount).toBe(0);
    });

    it('should update time and frame count when playing', () => {
      state.state = GameState.Playing;
      const updated = updateGameState(state, 0.5);

      expect(updated.time).toBe(0.5);
      expect(updated.frameCount).toBe(1);
    });

    it('should accumulate time correctly', () => {
      state.state = GameState.Playing;
      let updated = updateGameState(state, 0.1);
      updated = updateGameState(updated, 0.2);
      updated = updateGameState(updated, 0.3);

      expect(updated.time).toBeCloseTo(0.6);
      expect(updated.frameCount).toBe(3);
    });
  });

  describe('setMap', () => {
    it('should set the current map', () => {
      const state = createGameState(mockWad);
      const mockMap: MapData = {
        name: 'E1M1',
        vertices: [],
        sectors: [],
        sidedefs: [],
        linedefs: [],
        segs: [],
        subsectors: [],
        nodes: [],
        blockmap: { originX: 0, originY: 0, columns: 0, rows: 0, blockLists: [] },
        reject: { data: new Uint8Array(), sectorCount: 0 },
        boundingBox: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
      };

      const updated = setMap(state, mockMap);

      expect(updated.map).toBe(mockMap);
      expect(updated.map?.name).toBe('E1M1');
    });
  });

  describe('player management', () => {
    let state: DoomGameState;
    let player1: any;
    let player2: any;

    beforeEach(() => {
      state = createGameState(mockWad);
      player1 = createPlayer(0, { x: 100, y: 200, z: 0 }, Math.PI / 2);
      player2 = createPlayer(1, { x: 300, y: 400, z: 0 }, Math.PI);
    });

    describe('addPlayer', () => {
      it('should add a player to empty list', () => {
        const updated = addPlayer(state, player1);

        expect(updated.players).toHaveLength(1);
        expect(updated.players[0]).toBe(player1);
      });

      it('should add multiple players', () => {
        let updated = addPlayer(state, player1);
        updated = addPlayer(updated, player2);

        expect(updated.players).toHaveLength(2);
        expect(updated.players[0]).toBe(player1);
        expect(updated.players[1]).toBe(player2);
      });
    });

    describe('updatePlayer', () => {
      it('should update specific player', () => {
        let stateWithPlayers = addPlayer(state, player1);
        stateWithPlayers = addPlayer(stateWithPlayers, player2);

        const modifiedPlayer = { ...player1, angle: Math.PI };
        const updated = updatePlayer(stateWithPlayers, 0, modifiedPlayer);

        expect(updated.players[0].angle).toBe(Math.PI);
        expect(updated.players[1]).toBe(player2); // Other player unchanged
      });
    });

    describe('getActivePlayer', () => {
      it('should return null when no players exist', () => {
        const player = getActivePlayer(state);
        expect(player).toBeNull();
      });

      it('should return the active player', () => {
        const stateWithPlayer = addPlayer(state, player1);
        const player = getActivePlayer(stateWithPlayer);

        expect(player).toBe(player1);
      });

      it('should return null when active player index is out of bounds', () => {
        const stateWithPlayer = addPlayer(state, player1);
        const modifiedState = { ...stateWithPlayer, activePlayer: 5 };
        const player = getActivePlayer(modifiedState);

        expect(player).toBeNull();
      });
    });
  });

  describe('thing management', () => {
    let state: DoomGameState;
    let thing1: Thing;
    let thing2: Thing;

    beforeEach(() => {
      state = createGameState(mockWad);
      thing1 = {
        id: 1,
        type: ThingType.Imp,
        position: { x: 100, y: 200, z: 0 },
        angle: 0,
        velocity: { x: 0, y: 0, z: 0 },
        state: ThingState.Idle,
        flags: 0,
        health: 60,
        radius: 20,
        height: 56,
        sprite: 'TROO',
        frame: 0,
        tics: 10,
        threshold: 0,
        moveDir: 0,
        moveCount: 0,
      };
      thing2 = {
        ...thing1,
        id: 2,
        type: ThingType.FormerHuman,
        position: { x: 300, y: 400, z: 0 },
      };
    });

    describe('addThing', () => {
      it('should add a thing to empty list', () => {
        const updated = addThing(state, thing1);

        expect(updated.things).toHaveLength(1);
        expect(updated.things[0]).toBe(thing1);
      });

      it('should add multiple things', () => {
        let updated = addThing(state, thing1);
        updated = addThing(updated, thing2);

        expect(updated.things).toHaveLength(2);
        expect(updated.things[0]).toBe(thing1);
        expect(updated.things[1]).toBe(thing2);
      });
    });

    describe('removeThing', () => {
      it('should remove thing by id', () => {
        let stateWithThings = addThing(state, thing1);
        stateWithThings = addThing(stateWithThings, thing2);

        const updated = removeThing(stateWithThings, 1);

        expect(updated.things).toHaveLength(1);
        expect(updated.things[0].id).toBe(2);
      });

      it('should not change state when removing non-existent thing', () => {
        const stateWithThing = addThing(state, thing1);
        const updated = removeThing(stateWithThing, 999);

        expect(updated.things).toHaveLength(1);
        expect(updated.things[0]).toBe(thing1);
      });
    });

    describe('updateThing', () => {
      it('should update specific thing', () => {
        let stateWithThings = addThing(state, thing1);
        stateWithThings = addThing(stateWithThings, thing2);

        const modifiedThing = { ...thing1, health: 30 };
        const updated = updateThing(stateWithThings, 1, modifiedThing);

        expect(updated.things[0].health).toBe(30);
        expect(updated.things[1]).toBe(thing2); // Other thing unchanged
      });

      it('should not change state when updating non-existent thing', () => {
        const stateWithThing = addThing(state, thing1);
        const modifiedThing = { ...thing1, health: 30 };
        const updated = updateThing(stateWithThing, 999, modifiedThing);

        expect(updated.things[0].health).toBe(60); // Original health
      });
    });
  });

  describe('togglePause', () => {
    it('should pause when playing', () => {
      const state = createGameState(mockWad);
      state.state = GameState.Playing;

      const updated = togglePause(state);

      expect(updated.state).toBe(GameState.Paused);
    });

    it('should unpause when paused', () => {
      const state = createGameState(mockWad);
      state.state = GameState.Paused;

      const updated = togglePause(state);

      expect(updated.state).toBe(GameState.Playing);
    });

    it('should not change state when in menu', () => {
      const state = createGameState(mockWad);
      state.state = GameState.Menu;

      const updated = togglePause(state);

      expect(updated.state).toBe(GameState.Menu);
    });
  });

  describe('toggleAutomap', () => {
    it('should toggle automap from false to true', () => {
      const state = createGameState(mockWad);
      expect(state.showAutomap).toBe(false);

      const updated = toggleAutomap(state);

      expect(updated.showAutomap).toBe(true);
    });

    it('should toggle automap from true to false', () => {
      const state = createGameState(mockWad);
      state.showAutomap = true;

      const updated = toggleAutomap(state);

      expect(updated.showAutomap).toBe(false);
    });
  });

  describe('updateFPS', () => {
    it('should update FPS value', () => {
      const state = createGameState(mockWad);
      expect(state.fps).toBe(0);

      const updated = updateFPS(state, 60);

      expect(updated.fps).toBe(60);
    });
  });
});

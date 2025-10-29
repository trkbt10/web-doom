/**
 * Tests for collision detection system
 */

import { describe, it, expect } from 'vitest';
import {
  checkLineCollision,
  tryMove,
  checkThingCollision,
  findSector,
  getHeightAt,
} from './collision';
import type { Vec2 } from '../types';
import type { MapData } from '../map/types';
import { LineFlags } from '../types';
import { ThingType, ThingState } from '../entities/types';
import type { Thing } from '../entities/types';

describe('physics/collision', () => {
  describe('checkLineCollision', () => {
    it('should detect collision when point is within radius of line', () => {
      const position: Vec2 = { x: 50, y: 10 };
      const radius = 15;
      const lineStart: Vec2 = { x: 0, y: 0 };
      const lineEnd: Vec2 = { x: 100, y: 0 };

      const collides = checkLineCollision(position, radius, lineStart, lineEnd);

      expect(collides).toBe(true);
    });

    it('should not detect collision when point is too far from line', () => {
      const position: Vec2 = { x: 50, y: 50 };
      const radius = 15;
      const lineStart: Vec2 = { x: 0, y: 0 };
      const lineEnd: Vec2 = { x: 100, y: 0 };

      const collides = checkLineCollision(position, radius, lineStart, lineEnd);

      expect(collides).toBe(false);
    });

    it('should not detect collision when projection is outside line segment', () => {
      const position: Vec2 = { x: 150, y: 5 };
      const radius = 10;
      const lineStart: Vec2 = { x: 0, y: 0 };
      const lineEnd: Vec2 = { x: 100, y: 0 };

      const collides = checkLineCollision(position, radius, lineStart, lineEnd);

      expect(collides).toBe(false);
    });

    it('should detect collision at line endpoints', () => {
      const position: Vec2 = { x: 0, y: 5 };
      const radius = 10;
      const lineStart: Vec2 = { x: 0, y: 0 };
      const lineEnd: Vec2 = { x: 100, y: 0 };

      const collides = checkLineCollision(position, radius, lineStart, lineEnd);

      expect(collides).toBe(true);
    });

    it('should handle zero-length lines', () => {
      const position: Vec2 = { x: 5, y: 5 };
      const radius = 10;
      const lineStart: Vec2 = { x: 0, y: 0 };
      const lineEnd: Vec2 = { x: 0, y: 0 };

      const collides = checkLineCollision(position, radius, lineStart, lineEnd);

      expect(collides).toBe(false);
    });

    it('should work with vertical lines', () => {
      const position: Vec2 = { x: 10, y: 50 };
      const radius = 15;
      const lineStart: Vec2 = { x: 0, y: 0 };
      const lineEnd: Vec2 = { x: 0, y: 100 };

      const collides = checkLineCollision(position, radius, lineStart, lineEnd);

      expect(collides).toBe(true);
    });

    it('should work with diagonal lines', () => {
      const position: Vec2 = { x: 50, y: 60 };
      const radius = 10;
      const lineStart: Vec2 = { x: 0, y: 0 };
      const lineEnd: Vec2 = { x: 100, y: 100 };

      const collides = checkLineCollision(position, radius, lineStart, lineEnd);

      expect(collides).toBe(true);
    });
  });

  describe('checkThingCollision', () => {
    it('should detect collision when things overlap', () => {
      const thing1: Thing = {
        id: 1,
        type: ThingType.Imp,
        position: { x: 100, y: 100, z: 0 },
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

      const thing2: Thing = {
        ...thing1,
        id: 2,
        position: { x: 130, y: 100, z: 0 },
        radius: 20,
      };

      const collides = checkThingCollision(thing1, thing2);

      expect(collides).toBe(true);
    });

    it('should not detect collision when things are far apart', () => {
      const thing1: Thing = {
        id: 1,
        type: ThingType.Imp,
        position: { x: 100, y: 100, z: 0 },
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

      const thing2: Thing = {
        ...thing1,
        id: 2,
        position: { x: 200, y: 200, z: 0 },
      };

      const collides = checkThingCollision(thing1, thing2);

      expect(collides).toBe(false);
    });

    it('should detect collision exactly at radius boundary', () => {
      const thing1: Thing = {
        id: 1,
        type: ThingType.Imp,
        position: { x: 0, y: 0, z: 0 },
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

      const thing2: Thing = {
        ...thing1,
        id: 2,
        position: { x: 30, y: 0, z: 0 }, // Distance = 30, radii sum = 40
        radius: 10,
      };

      const collides = checkThingCollision(thing1, thing2);

      expect(collides).toBe(true);
    });

    it('should work with different sized things', () => {
      const thing1: Thing = {
        id: 1,
        type: ThingType.Demon,
        position: { x: 0, y: 0, z: 0 },
        angle: 0,
        velocity: { x: 0, y: 0, z: 0 },
        state: ThingState.Idle,
        flags: 0,
        health: 150,
        radius: 30,
        height: 56,
        sprite: 'SARG',
        frame: 0,
        tics: 10,
        threshold: 0,
        moveDir: 0,
        moveCount: 0,
      };

      const thing2: Thing = {
        ...thing1,
        id: 2,
        type: ThingType.FormerHuman,
        position: { x: 40, y: 0, z: 0 },
        radius: 20,
      };

      const collides = checkThingCollision(thing1, thing2);

      expect(collides).toBe(true); // Distance 40 < radius sum 50
    });
  });

  describe('tryMove with simple map', () => {
    // Create a simple test map with a rectangular room
    const createSimpleMap = (): MapData => {
      return {
        name: 'TEST',
        vertices: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 },
        ],
        sectors: [
          {
            floorHeight: 0,
            ceilingHeight: 128,
            floorTexture: 'FLOOR',
            ceilingTexture: 'CEIL',
            lightLevel: 160,
            specialType: 0,
            tag: 0,
          },
        ],
        sidedefs: [
          {
            xOffset: 0,
            yOffset: 0,
            upperTexture: '-',
            lowerTexture: '-',
            middleTexture: 'WALL',
            sector: 0,
          },
        ],
        linedefs: [
          {
            startVertex: 0,
            endVertex: 1,
            flags: LineFlags.BLOCKING,
            specialType: 0,
            sectorTag: 0,
            rightSidedef: 0,
            leftSidedef: -1,
          },
          {
            startVertex: 1,
            endVertex: 2,
            flags: LineFlags.BLOCKING,
            specialType: 0,
            sectorTag: 0,
            rightSidedef: 0,
            leftSidedef: -1,
          },
          {
            startVertex: 2,
            endVertex: 3,
            flags: LineFlags.BLOCKING,
            specialType: 0,
            sectorTag: 0,
            rightSidedef: 0,
            leftSidedef: -1,
          },
          {
            startVertex: 3,
            endVertex: 0,
            flags: LineFlags.BLOCKING,
            specialType: 0,
            sectorTag: 0,
            rightSidedef: 0,
            leftSidedef: -1,
          },
        ],
        segs: [],
        subsectors: [],
        nodes: [],
        blockmap: {
          originX: 0,
          originY: 0,
          columns: 1,
          rows: 1,
          blockLists: [[0, 1, 2, 3]], // All lines in single block
        },
        reject: {
          data: new Uint8Array(),
          sectorCount: 1,
        },
        boundingBox: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
      };
    };

    it('should allow free movement in open space', () => {
      const map = createSimpleMap();
      const from: Vec2 = { x: 50, y: 50 };
      const to: Vec2 = { x: 60, y: 50 };
      const radius = 16;
      const height = 56;

      const result = tryMove(map, from, to, radius, height);

      expect(result.blocked).toBe(false);
      expect(result.position.x).toBeCloseTo(60);
      expect(result.position.y).toBeCloseTo(50);
    });

    it('should block movement into walls', () => {
      const map = createSimpleMap();
      const from: Vec2 = { x: 20, y: 50 };
      const to: Vec2 = { x: -10, y: 50 }; // Try to move through left wall
      const radius = 16;
      const height = 56;

      const result = tryMove(map, from, to, radius, height);

      expect(result.blocked).toBe(true);
      expect(result.blockingLine).toBeDefined();
      // Position should be adjusted (slid along wall or stopped)
      expect(result.position.x).not.toBe(-10);
    });
  });

  describe('findSector', () => {
    it('should return undefined for empty node list', () => {
      const map: MapData = {
        name: 'TEST',
        vertices: [],
        sectors: [],
        sidedefs: [],
        linedefs: [],
        segs: [],
        subsectors: [],
        nodes: [],
        blockmap: { originX: 0, originY: 0, columns: 0, rows: 0, blockLists: [] },
        reject: { data: new Uint8Array(), sectorCount: 0 },
        boundingBox: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
      };

      const sector = findSector(map, { x: 50, y: 50 });

      expect(sector).toBeUndefined();
    });
  });

  describe('getHeightAt', () => {
    it('should return null when sector not found', () => {
      const map: MapData = {
        name: 'TEST',
        vertices: [],
        sectors: [],
        sidedefs: [],
        linedefs: [],
        segs: [],
        subsectors: [],
        nodes: [],
        blockmap: { originX: 0, originY: 0, columns: 0, rows: 0, blockLists: [] },
        reject: { data: new Uint8Array(), sectorCount: 0 },
        boundingBox: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
      };

      const heights = getHeightAt(map, { x: 50, y: 50 });

      expect(heights).toBeNull();
    });

    it('should return floor and ceiling heights when sector found', () => {
      // Create a simple map where we can find a sector
      const map: MapData = {
        name: 'TEST',
        vertices: [{ x: 0, y: 0 }],
        sectors: [
          {
            floorHeight: 10,
            ceilingHeight: 128,
            floorTexture: 'FLOOR',
            ceilingTexture: 'CEIL',
            lightLevel: 160,
            specialType: 0,
            tag: 0,
          },
        ],
        sidedefs: [
          {
            xOffset: 0,
            yOffset: 0,
            upperTexture: '-',
            lowerTexture: '-',
            middleTexture: 'WALL',
            sector: 0,
          },
        ],
        linedefs: [
          {
            startVertex: 0,
            endVertex: 0,
            flags: 0,
            specialType: 0,
            sectorTag: 0,
            rightSidedef: 0,
            leftSidedef: -1,
          },
        ],
        segs: [
          {
            startVertex: 0,
            endVertex: 0,
            angle: 0,
            linedef: 0,
            direction: 0,
            offset: 0,
          },
        ],
        subsectors: [
          {
            segCount: 1,
            firstSeg: 0,
          },
        ],
        nodes: [
          {
            x: 50,
            y: 50,
            dx: 100,
            dy: 0,
            rightBox: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
            leftBox: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
            rightChild: 0x8000, // Subsector 0
            leftChild: 0x8000,
          },
        ],
        blockmap: { originX: 0, originY: 0, columns: 0, rows: 0, blockLists: [] },
        reject: { data: new Uint8Array(), sectorCount: 1 },
        boundingBox: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
      };

      const heights = getHeightAt(map, { x: 30, y: 50 });

      expect(heights).not.toBeNull();
      if (heights) {
        expect(heights.floor).toBe(10);
        expect(heights.ceiling).toBe(128);
      }
    });
  });
});

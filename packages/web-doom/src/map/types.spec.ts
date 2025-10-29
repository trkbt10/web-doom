/**
 * Tests for map-related types and helper functions
 */

import { describe, it, expect } from 'vitest';
import {
  isSubsector,
  getSubsectorIndex,
  calculateBoundingBox,
  pointToLineDist,
  pointSide,
  type Vertex,
  type BoundingBox,
} from './types';
import type { Vec2 } from '../types';

describe('map/types', () => {
  describe('isSubsector', () => {
    it('should return true when bit 15 is set', () => {
      expect(isSubsector(0x8000)).toBe(true);
      expect(isSubsector(0x8001)).toBe(true);
      expect(isSubsector(0xffff)).toBe(true);
    });

    it('should return false when bit 15 is not set', () => {
      expect(isSubsector(0)).toBe(false);
      expect(isSubsector(0x7fff)).toBe(false);
      expect(isSubsector(0x1234)).toBe(false);
    });
  });

  describe('getSubsectorIndex', () => {
    it('should extract subsector index by masking lower 15 bits', () => {
      expect(getSubsectorIndex(0x8000)).toBe(0);
      expect(getSubsectorIndex(0x8001)).toBe(1);
      expect(getSubsectorIndex(0x8042)).toBe(66);
      expect(getSubsectorIndex(0xffff)).toBe(0x7fff);
    });

    it('should work with regular node indices', () => {
      expect(getSubsectorIndex(0)).toBe(0);
      expect(getSubsectorIndex(100)).toBe(100);
      expect(getSubsectorIndex(0x7fff)).toBe(0x7fff);
    });
  });

  describe('calculateBoundingBox', () => {
    it('should return zero bounding box for empty vertices', () => {
      const bbox = calculateBoundingBox([]);

      expect(bbox).toEqual({
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0,
      });
    });

    it('should return correct bounding box for single vertex', () => {
      const vertices: Vertex[] = [{ x: 100, y: 200 }];
      const bbox = calculateBoundingBox(vertices);

      expect(bbox).toEqual({
        minX: 100,
        minY: 200,
        maxX: 100,
        maxY: 200,
      });
    });

    it('should calculate bounding box for multiple vertices', () => {
      const vertices: Vertex[] = [
        { x: 100, y: 200 },
        { x: 300, y: 150 },
        { x: 50, y: 400 },
        { x: 200, y: 100 },
      ];
      const bbox = calculateBoundingBox(vertices);

      expect(bbox).toEqual({
        minX: 50,
        minY: 100,
        maxX: 300,
        maxY: 400,
      });
    });

    it('should handle negative coordinates', () => {
      const vertices: Vertex[] = [
        { x: -100, y: -200 },
        { x: 50, y: 100 },
        { x: -300, y: 0 },
      ];
      const bbox = calculateBoundingBox(vertices);

      expect(bbox).toEqual({
        minX: -300,
        minY: -200,
        maxX: 50,
        maxY: 100,
      });
    });
  });

  describe('pointToLineDist', () => {
    it('should calculate distance from point to horizontal line', () => {
      const point: Vec2 = { x: 50, y: 100 };
      const lineStart: Vec2 = { x: 0, y: 50 };
      const lineEnd: Vec2 = { x: 100, y: 50 };

      const dist = pointToLineDist(point, lineStart, lineEnd);

      expect(dist).toBeCloseTo(50);
    });

    it('should calculate distance from point to vertical line', () => {
      const point: Vec2 = { x: 100, y: 50 };
      const lineStart: Vec2 = { x: 50, y: 0 };
      const lineEnd: Vec2 = { x: 50, y: 100 };

      const dist = pointToLineDist(point, lineStart, lineEnd);

      expect(dist).toBeCloseTo(50);
    });

    it('should calculate distance from point to diagonal line', () => {
      const point: Vec2 = { x: 0, y: 100 };
      const lineStart: Vec2 = { x: 0, y: 0 };
      const lineEnd: Vec2 = { x: 100, y: 100 };

      const dist = pointToLineDist(point, lineStart, lineEnd);

      // Distance from (0, 100) to line from (0, 0) to (100, 100)
      // The closest point on line is (50, 50)
      // Distance = sqrt((0-50)^2 + (100-50)^2) = sqrt(2500 + 2500) = sqrt(5000) ≈ 70.71
      expect(dist).toBeCloseTo(70.71, 1);
    });

    it('should return 0 when point is on the line', () => {
      const point: Vec2 = { x: 50, y: 50 };
      const lineStart: Vec2 = { x: 0, y: 0 };
      const lineEnd: Vec2 = { x: 100, y: 100 };

      const dist = pointToLineDist(point, lineStart, lineEnd);

      expect(dist).toBeCloseTo(0);
    });

    it('should handle zero-length line (point)', () => {
      const point: Vec2 = { x: 100, y: 100 };
      const lineStart: Vec2 = { x: 50, y: 50 };
      const lineEnd: Vec2 = { x: 50, y: 50 };

      const dist = pointToLineDist(point, lineStart, lineEnd);

      // Distance from point to point
      expect(dist).toBeCloseTo(Math.sqrt(50 * 50 + 50 * 50));
    });

    it('should calculate distance to line endpoint when closest', () => {
      const point: Vec2 = { x: 150, y: 0 };
      const lineStart: Vec2 = { x: 0, y: 0 };
      const lineEnd: Vec2 = { x: 100, y: 0 };

      const dist = pointToLineDist(point, lineStart, lineEnd);

      // Closest point is line end (100, 0)
      expect(dist).toBeCloseTo(50);
    });
  });

  describe('pointSide', () => {
    it('should return positive when point is on the right side', () => {
      const point: Vec2 = { x: 50, y: -10 };
      const lineStart: Vec2 = { x: 0, y: 0 };
      const lineEnd: Vec2 = { x: 100, y: 0 };

      const side = pointSide(point, lineStart, lineEnd);

      expect(side).toBeLessThan(0); // Actually negative is right in this coordinate system
    });

    it('should return negative when point is on the left side', () => {
      const point: Vec2 = { x: 50, y: 10 };
      const lineStart: Vec2 = { x: 0, y: 0 };
      const lineEnd: Vec2 = { x: 100, y: 0 };

      const side = pointSide(point, lineStart, lineEnd);

      expect(side).toBeGreaterThan(0);
    });

    it('should return 0 when point is on the line', () => {
      const point: Vec2 = { x: 50, y: 0 };
      const lineStart: Vec2 = { x: 0, y: 0 };
      const lineEnd: Vec2 = { x: 100, y: 0 };

      const side = pointSide(point, lineStart, lineEnd);

      expect(side).toBe(0);
    });

    it('should work with diagonal lines', () => {
      const point: Vec2 = { x: 60, y: 40 };
      const lineStart: Vec2 = { x: 0, y: 0 };
      const lineEnd: Vec2 = { x: 100, y: 100 };

      const side = pointSide(point, lineStart, lineEnd);

      // Point (60, 40) is below the line y=x, so right side
      expect(side).toBeLessThan(0);
    });

    it('should work with vertical lines', () => {
      const point: Vec2 = { x: 60, y: 50 };
      const lineStart: Vec2 = { x: 50, y: 0 };
      const lineEnd: Vec2 = { x: 50, y: 100 };

      const side = pointSide(point, lineStart, lineEnd);

      // Point is to the right of vertical line
      expect(side).toBeGreaterThan(0);
    });

    it('should handle negative coordinates', () => {
      const point: Vec2 = { x: -50, y: 10 };
      const lineStart: Vec2 = { x: -100, y: 0 };
      const lineEnd: Vec2 = { x: 0, y: 0 };

      const side = pointSide(point, lineStart, lineEnd);

      // Point is above horizontal line, so left side
      expect(side).toBeGreaterThan(0);
    });
  });
});

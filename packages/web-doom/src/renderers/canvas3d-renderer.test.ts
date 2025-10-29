/**
 * Tests for Canvas 3D Raycasting Renderer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Canvas3DRenderer } from './canvas3d-renderer';
import type { Camera } from '../renderer';
import type { Sector, Linedef, Sidedef } from '../map/types';

describe('Canvas3DRenderer', () => {
  let canvas: HTMLCanvasElement;
  let renderer: Canvas3DRenderer;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    // Create a mock canvas
    canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 200;
    ctx = canvas.getContext('2d')!;

    // Spy on canvas methods
    vi.spyOn(ctx, 'fillRect');
    vi.spyOn(ctx, 'fillStyle', 'set');

    renderer = new Canvas3DRenderer(canvas);
  });

  describe('initialization', () => {
    it('should initialize with canvas dimensions', () => {
      renderer.init({ width: 320, height: 200, scale: 1 });
      expect(canvas.width).toBe(320);
      expect(canvas.height).toBe(200);
    });

    it('should throw error if 2D context is not available', () => {
      const badCanvas = { getContext: () => null } as unknown as HTMLCanvasElement;
      expect(() => new Canvas3DRenderer(badCanvas)).toThrow('Failed to get 2D context');
    });
  });

  describe('frame management', () => {
    it('should save and restore context state', () => {
      const saveSpy = vi.spyOn(ctx, 'save');
      const restoreSpy = vi.spyOn(ctx, 'restore');

      renderer.beginFrame();
      expect(saveSpy).toHaveBeenCalled();

      renderer.endFrame();
      expect(restoreSpy).toHaveBeenCalled();
    });
  });

  describe('camera', () => {
    it('should accept camera configuration', () => {
      const camera: Camera = {
        position: { x: 100, y: 100, z: 41 },
        angle: 0,
        pitch: 0,
        fov: Math.PI / 2,
      };

      expect(() => renderer.setCamera(camera)).not.toThrow();
    });
  });

  describe('3D rendering', () => {
    it('should clear screen with specified color', () => {
      renderer.init({ width: 320, height: 200 });
      renderer.clear('#000000');

      expect(ctx.fillStyle).toBe('#000000');
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 320, 200);
    });

    it('should render walls in 3D perspective', () => {
      const camera: Camera = {
        position: { x: 0, y: 0, z: 41 },
        angle: 0,
        pitch: 0,
        fov: Math.PI / 2,
      };

      renderer.init({ width: 320, height: 200 });
      renderer.setCamera(camera);
      renderer.beginFrame();

      const sidedef: Sidedef = {
        xOffset: 0,
        yOffset: 0,
        upperTexture: '',
        lowerTexture: '',
        middleTexture: 'WALL',
        sector: 0,
      };

      // Should not throw when rendering a wall
      expect(() => {
        renderer.renderWall(
          { x: 100, y: 100 },
          { x: 200, y: 100 },
          128,
          'WALL',
          sidedef
        );
      }).not.toThrow();

      renderer.endFrame();
    });

    it('should render floor and ceiling', () => {
      const camera: Camera = {
        position: { x: 0, y: 0, z: 41 },
        angle: 0,
        pitch: 0,
        fov: Math.PI / 2,
      };

      const sector: Sector = {
        floorHeight: 0,
        ceilingHeight: 128,
        floorTexture: 'FLOOR',
        ceilingTexture: 'CEIL',
        lightLevel: 160,
        special: 0,
        tag: 0,
      };

      renderer.init({ width: 320, height: 200 });
      renderer.setCamera(camera);
      renderer.beginFrame();

      const vertices = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ];

      expect(() => {
        renderer.renderFloor(sector, vertices);
        renderer.renderCeiling(sector, vertices);
      }).not.toThrow();

      renderer.endFrame();
    });
  });

  describe('HUD rendering', () => {
    it('should render HUD elements', () => {
      renderer.init({ width: 320, height: 200 });

      const fillTextSpy = vi.spyOn(ctx, 'fillText');

      renderer.renderHUD({
        health: 100,
        armor: 50,
        ammo: 50,
        maxAmmo: 200,
        weapons: [true, true, false, false, false, false, false],
        currentWeapon: 1,
        keys: { blue: false, yellow: false, red: false },
        face: 'STFST01',
        fps: 35,
      });

      expect(fillTextSpy).toHaveBeenCalled();
    });
  });

  describe('resource management', () => {
    it('should provide render target', () => {
      const target = renderer.getRenderTarget();
      expect(target).toBe(canvas);
    });

    it('should cleanup on dispose', () => {
      expect(() => renderer.dispose()).not.toThrow();
    });
  });
});

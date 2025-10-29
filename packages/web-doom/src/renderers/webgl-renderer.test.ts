/**
 * WebGL Renderer Integration Tests
 * Tests the complete WebGL rendering pipeline
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebGLRenderer } from './webgl-renderer';
import type { MapData } from '../map/types';
import type { Camera, RenderOptions, HUDData } from '../renderer';
import { JSDOM } from 'jsdom';

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
});

global.document = dom.window.document as any;
global.window = dom.window as any;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement as any;
global.WebGLRenderingContext = {} as any;
global.WebGL2RenderingContext = {} as any;

// Mock WebGL context
HTMLCanvasElement.prototype.getContext = function(contextId: string) {
  if (contextId === 'webgl' || contextId === 'webgl2') {
    return {
      canvas: this,
      drawingBufferWidth: 800,
      drawingBufferHeight: 600,
      getParameter: () => 16,
      getExtension: () => null,
      createTexture: () => ({}),
      createBuffer: () => ({}),
      createFramebuffer: () => ({}),
      createRenderbuffer: () => ({}),
      createShader: () => ({}),
      createProgram: () => ({}),
      getShaderParameter: () => true,
      getProgramParameter: () => true,
      getShaderInfoLog: () => '',
      getProgramInfoLog: () => '',
      compileShader: () => {},
      linkProgram: () => {},
      attachShader: () => {},
      bindBuffer: () => {},
      bufferData: () => {},
      enable: () => {},
      disable: () => {},
      viewport: () => {},
      clear: () => {},
      clearColor: () => {},
      clearDepth: () => {},
      depthFunc: () => {},
      blendFunc: () => {},
      useProgram: () => {},
      getUniformLocation: () => ({}),
      getAttribLocation: () => 0,
      uniform1f: () => {},
      uniform2f: () => {},
      uniform3f: () => {},
      uniform4f: () => {},
      uniformMatrix4fv: () => {},
      vertexAttribPointer: () => {},
      enableVertexAttribArray: () => {},
      drawArrays: () => {},
      drawElements: () => {},
    };
  }
  return null;
};

describe('WebGLRenderer', () => {
  let canvas: HTMLCanvasElement;
  let renderer: WebGLRenderer;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    document.body.appendChild(canvas);
  });

  afterEach(() => {
    if (renderer) {
      renderer.dispose();
    }
    if (canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  });

  describe('Initialization', () => {
    it('should create a WebGLRenderer instance', () => {
      renderer = new WebGLRenderer(canvas);
      expect(renderer).toBeDefined();
    });

    it('should initialize with options', () => {
      renderer = new WebGLRenderer(canvas);
      const options: RenderOptions = {
        width: 1280,
        height: 720,
        scale: 1,
        showFPS: true
      };

      expect(() => renderer.init(options)).not.toThrow();
    });

    it('should return the render target', () => {
      renderer = new WebGLRenderer(canvas);
      const target = renderer.getRenderTarget();
      expect(target).toBeDefined();
    });
  });

  describe('Renderer Interface Implementation', () => {
    beforeEach(() => {
      renderer = new WebGLRenderer(canvas);
      renderer.init({ width: 800, height: 600 });
    });

    it('should implement beginFrame', () => {
      expect(() => renderer.beginFrame()).not.toThrow();
    });

    it('should implement endFrame', () => {
      expect(() => renderer.endFrame()).not.toThrow();
    });

    it('should implement clear with default color', () => {
      expect(() => renderer.clear()).not.toThrow();
    });

    it('should implement clear with custom color', () => {
      expect(() => renderer.clear('#FF0000')).not.toThrow();
    });

    it('should implement setCamera', () => {
      const camera: Camera = {
        position: { x: 0, y: 0, z: 41 },
        angle: 0,
        pitch: 0,
        fov: 75
      };
      expect(() => renderer.setCamera(camera)).not.toThrow();
    });

    it('should implement renderWall', () => {
      const mockSidedef: any = {
        sector: 0,
        middleTexture: 'STONE',
        upperTexture: null,
        lowerTexture: null,
        xOffset: 0,
        yOffset: 0
      };

      expect(() => renderer.renderWall(
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        128,
        'STONE',
        mockSidedef
      )).not.toThrow();
    });

    it('should implement renderFloor', () => {
      const mockSector: any = {
        floorHeight: 0,
        ceilingHeight: 128,
        floorTexture: 'FLOOR1',
        ceilingTexture: 'CEIL1',
        lightLevel: 192,
        special: 0,
        tag: 0
      };

      expect(() => renderer.renderFloor(
        mockSector,
        [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }]
      )).not.toThrow();
    });

    it('should implement renderCeiling', () => {
      const mockSector: any = {
        floorHeight: 0,
        ceilingHeight: 128,
        floorTexture: 'FLOOR1',
        ceilingTexture: 'CEIL1',
        lightLevel: 192,
        special: 0,
        tag: 0
      };

      expect(() => renderer.renderCeiling(
        mockSector,
        [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }]
      )).not.toThrow();
    });

    it('should implement renderSprite', () => {
      const mockThing: any = {
        id: 1,
        type: 3004,
        position: { x: 100, y: 100, z: 0 },
        angle: 0,
        velocity: { x: 0, y: 0, z: 0 },
        state: 0,
        flags: 0,
        health: 100,
        radius: 20,
        height: 56,
        sprite: 'POSS',
        frame: 0,
        tics: 0
      };

      expect(() => renderer.renderSprite(
        mockThing,
        { x: 400, y: 300 },
        1.0
      )).not.toThrow();
    });

    it('should implement renderAutomap', () => {
      const mockLinedefs: any[] = [
        {
          startVertex: 0,
          endVertex: 1,
          flags: 0,
          lineType: 0,
          sectorTag: 0,
          rightSidedef: 0,
          leftSidedef: null
        }
      ];

      expect(() => renderer.renderAutomap(
        mockLinedefs,
        { x: 0, y: 0 },
        0,
        0.1
      )).not.toThrow();
    });

    it('should implement renderHUD', () => {
      const mockHUDData: HUDData = {
        health: 100,
        armor: 50,
        ammo: 50,
        maxAmmo: 200,
        weapons: [true, true, false, false, false, false, false],
        currentWeapon: 1,
        keys: {
          blue: false,
          yellow: false,
          red: false
        },
        face: 'STFST01',
        message: 'Test message',
        fps: 60
      };

      expect(() => renderer.renderHUD(mockHUDData)).not.toThrow();
    });

    it('should implement dispose', () => {
      expect(() => renderer.dispose()).not.toThrow();
    });
  });

  describe('Map Data Integration', () => {
    beforeEach(() => {
      renderer = new WebGLRenderer(canvas);
      renderer.init({ width: 800, height: 600 });
    });

    it('should handle null map data', () => {
      expect(() => renderer.setMapData(null)).not.toThrow();
    });

    it('should handle valid map data', () => {
      const mockMapData: MapData = {
        name: 'TEST',
        vertices: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 100, y: 100 },
          { x: 0, y: 100 }
        ],
        linedefs: [
          {
            startVertex: 0,
            endVertex: 1,
            flags: 1,
            lineType: 0,
            sectorTag: 0,
            rightSidedef: 0,
            leftSidedef: null
          }
        ],
        sidedefs: [
          {
            xOffset: 0,
            yOffset: 0,
            upperTexture: null,
            lowerTexture: null,
            middleTexture: 'STONE',
            sector: 0
          }
        ],
        sectors: [
          {
            floorHeight: 0,
            ceilingHeight: 128,
            floorTexture: 'FLOOR1',
            ceilingTexture: 'CEIL1',
            lightLevel: 192,
            special: 0,
            tag: 0
          }
        ],
        things: [],
        segs: [],
        ssectors: [],
        nodes: [],
        blockmap: {
          originX: 0,
          originY: 0,
          columns: 0,
          rows: 0,
          blocklists: []
        },
        reject: new Uint8Array(0)
      };

      expect(() => renderer.setMapData(mockMapData)).not.toThrow();
    });
  });

  describe('Particle System', () => {
    beforeEach(() => {
      renderer = new WebGLRenderer(canvas);
      renderer.init({ width: 800, height: 600 });
    });

    it('should provide access to particle system', () => {
      const particleSystem = renderer.getParticleSystem();
      expect(particleSystem).toBeDefined();
    });

    it('should handle particle system being null', () => {
      // This tests the case where WAD is not provided
      const noWadRenderer = new WebGLRenderer(canvas);
      const particleSystem = noWadRenderer.getParticleSystem();
      expect(particleSystem).toBeDefined(); // Should still be created
      noWadRenderer.dispose();
    });
  });

  describe('Sprite Renderer', () => {
    beforeEach(() => {
      renderer = new WebGLRenderer(canvas);
      renderer.init({ width: 800, height: 600 });
    });

    it('should provide access to sprite renderer', () => {
      const spriteRenderer = renderer.getSpriteRenderer();
      expect(spriteRenderer).toBeDefined();
    });
  });

  describe('Camera Management', () => {
    beforeEach(() => {
      renderer = new WebGLRenderer(canvas);
      renderer.init({ width: 800, height: 600 });
    });

    it('should handle camera with different FOV', () => {
      const camera: Camera = {
        position: { x: 100, y: 200, z: 41 },
        angle: Math.PI / 4,
        pitch: 0.1,
        fov: 90
      };

      expect(() => renderer.setCamera(camera)).not.toThrow();
    });

    it('should handle rapid camera updates', () => {
      for (let i = 0; i < 100; i++) {
        const camera: Camera = {
          position: { x: i, y: i, z: 41 },
          angle: i * 0.01,
          pitch: 0,
          fov: 75
        };
        expect(() => renderer.setCamera(camera)).not.toThrow();
      }
    });
  });
});

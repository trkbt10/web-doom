/**
 * Renderer interface - allows multiple rendering implementations
 * The game engine doesn't know about rendering details, it only calls this interface
 */

import type { Vec2, Vec3, Angle } from './types';
import type { Sector, Linedef, Sidedef } from './map/types';
import type { Thing } from './entities/types';

/**
 * Camera/viewport information
 */
export interface Camera {
  position: Vec3;
  angle: Angle;
  pitch: Angle;
  fov: number;
}

/**
 * Render options
 */
export interface RenderOptions {
  width: number;
  height: number;
  scale?: number;
  showFPS?: boolean;
  showMap?: boolean;
}

/**
 * Renderer interface that game engine uses
 * This allows for multiple renderer implementations (Canvas 2D, WebGL, Software, etc.)
 */
export interface Renderer {
  /**
   * Initialize the renderer
   */
  init(options: RenderOptions): void;

  /**
   * Begin a new frame
   */
  beginFrame(): void;

  /**
   * End the current frame and present to screen
   */
  endFrame(): void;

  /**
   * Clear the screen
   */
  clear(color?: string): void;

  /**
   * Set the camera for 3D rendering
   */
  setCamera(camera: Camera): void;

  /**
   * Render a wall segment
   */
  renderWall(
    start: Vec2,
    end: Vec2,
    height: number,
    textureName: string,
    sidedef: Sidedef
  ): void;

  /**
   * Render a floor segment
   */
  renderFloor(sector: Sector, vertices: Vec2[]): void;

  /**
   * Render a ceiling segment
   */
  renderCeiling(sector: Sector, vertices: Vec2[]): void;

  /**
   * Render a sprite/thing
   */
  renderSprite(thing: Thing, screenPos: Vec2, scale: number): void;

  /**
   * Render the automap/minimap
   */
  renderAutomap(
    linedefs: Linedef[],
    playerPos: Vec2,
    playerAngle: Angle,
    scale: number
  ): void;

  /**
   * Render HUD elements
   */
  renderHUD(data: HUDData): void;

  /**
   * Get the underlying render target (for compatibility)
   */
  getRenderTarget(): unknown;

  /**
   * Cleanup resources
   */
  dispose(): void;
}

/**
 * HUD data to display
 */
export interface HUDData {
  health: number;
  armor: number;
  ammo: number;
  maxAmmo: number;
  weapons: boolean[];
  currentWeapon: number;
  keys: {
    blue: boolean;
    yellow: boolean;
    red: boolean;
  };
  face: string; // Face sprite name
  message?: string;
  fps?: number;
}

/**
 * Factory function type for creating renderers
 */
export type RendererFactory = (options: RenderOptions) => Renderer;

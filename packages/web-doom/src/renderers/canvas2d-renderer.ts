/**
 * Canvas 2D Renderer - A simple 2D top-down renderer
 * This is a reference implementation of the Renderer interface
 */

import type {
  Renderer,
  Camera,
  RenderOptions,
  HUDData,
} from '../renderer';
import type { Vec2 } from '../types';
import type { Sector, Linedef, Sidedef } from '../map/types';
import type { Thing } from '../entities/types';
import type { Angle } from '../types';

/**
 * Canvas 2D Renderer implementation
 */
export class Canvas2DRenderer implements Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: RenderOptions;
  private camera: Camera | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;
    this.options = {
      width: canvas.width,
      height: canvas.height,
      scale: 1,
    };
  }

  init(options: RenderOptions): void {
    this.options = options;
    this.canvas.width = options.width;
    this.canvas.height = options.height;
  }

  beginFrame(): void {
    this.ctx.save();
  }

  endFrame(): void {
    this.ctx.restore();
  }

  clear(color = '#000000'): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  setCamera(camera: Camera): void {
    this.camera = camera;
  }

  renderWall(
    start: Vec2,
    end: Vec2,
    _height: number,
    textureName: string,
    _sidedef: Sidedef
  ): void {
    if (!this.camera) return;

    // Transform to screen space (top-down view)
    const screenStart = this.worldToScreen(start);
    const screenEnd = this.worldToScreen(end);

    // Draw line
    this.ctx.strokeStyle = this.getTextureColor(textureName);
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(screenStart.x, screenStart.y);
    this.ctx.lineTo(screenEnd.x, screenEnd.y);
    this.ctx.stroke();
  }

  renderFloor(sector: Sector, vertices: Vec2[]): void {
    if (!this.camera || vertices.length < 3) return;

    // Transform to screen space
    const screenVerts = vertices.map((v) => this.worldToScreen(v));

    // Draw polygon
    this.ctx.fillStyle = this.getTextureColor(sector.floorTexture);
    this.ctx.globalAlpha = 0.3;
    this.ctx.beginPath();
    this.ctx.moveTo(screenVerts[0].x, screenVerts[0].y);
    for (let i = 1; i < screenVerts.length; i++) {
      this.ctx.lineTo(screenVerts[i].x, screenVerts[i].y);
    }
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.globalAlpha = 1.0;
  }

  renderCeiling(_sector: Sector, _vertices: Vec2[]): void {
    // Similar to floor, but with different color
    // For simplicity, we skip ceiling in top-down view
  }

  renderSprite(thing: Thing, _screenPos: Vec2, _scale: number): void {
    if (!this.camera) return;

    const worldPos = { x: thing.position.x, y: thing.position.y };
    const pos = this.worldToScreen(worldPos);

    // Draw as a circle
    this.ctx.fillStyle = '#ff0000';
    this.ctx.beginPath();
    this.ctx.arc(pos.x, pos.y, thing.radius * 0.1, 0, Math.PI * 2);
    this.ctx.fill();
  }

  renderAutomap(
    _linedefs: Linedef[],
    playerPos: Vec2,
    playerAngle: Angle,
    _scale: number
  ): void {
    // Automap is already rendered in the main view for 2D renderer
    // Draw player position
    const pos = this.worldToScreen(playerPos);

    // Draw player as triangle
    this.ctx.save();
    this.ctx.translate(pos.x, pos.y);
    this.ctx.rotate(playerAngle);

    this.ctx.fillStyle = '#00ff00';
    this.ctx.beginPath();
    this.ctx.moveTo(10, 0);
    this.ctx.lineTo(-5, -5);
    this.ctx.lineTo(-5, 5);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.restore();
  }

  renderHUD(data: HUDData): void {
    const padding = 10;
    const fontSize = 16;

    this.ctx.font = `${fontSize}px monospace`;
    this.ctx.fillStyle = '#00ff00';
    this.ctx.textBaseline = 'top';

    // Health
    this.ctx.fillText(`Health: ${data.health}`, padding, padding);

    // Armor
    this.ctx.fillText(`Armor: ${data.armor}`, padding, padding + fontSize + 5);

    // Ammo
    this.ctx.fillText(
      `Ammo: ${data.ammo}/${data.maxAmmo}`,
      padding,
      padding + (fontSize + 5) * 2
    );

    // FPS
    if (data.fps !== undefined) {
      this.ctx.fillText(`FPS: ${data.fps}`, padding, padding + (fontSize + 5) * 3);
    }

    // Message
    if (data.message) {
      this.ctx.fillStyle = '#ffff00';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(data.message, this.canvas.width / 2, padding);
      this.ctx.textAlign = 'left';
    }
  }

  getRenderTarget(): HTMLCanvasElement {
    return this.canvas;
  }

  dispose(): void {
    // Cleanup if needed
  }

  /**
   * Transform world coordinates to screen coordinates
   */
  private worldToScreen(worldPos: Vec2): Vec2 {
    if (!this.camera) {
      return { x: 0, y: 0 };
    }

    // Center on camera
    const relX = worldPos.x - this.camera.position.x;
    const relY = worldPos.y - this.camera.position.y;

    // Scale (DOOM units are large)
    const scale = this.options.scale || 0.1;

    // Screen center
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    return {
      x: centerX + relX * scale,
      y: centerY - relY * scale, // Flip Y axis
    };
  }

  /**
   * Get a color for a texture name
   */
  private getTextureColor(textureName: string): string {
    // Simple hash-based color generation
    let hash = 0;
    for (let i = 0; i < textureName.length; i++) {
      hash = textureName.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
  }
}

/**
 * Create a Canvas 2D renderer
 */
export function createCanvas2DRenderer(canvas: HTMLCanvasElement): Renderer {
  return new Canvas2DRenderer(canvas);
}

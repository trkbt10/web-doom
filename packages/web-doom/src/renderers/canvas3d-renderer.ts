/**
 * Canvas 3D Raycasting Renderer
 * Implements a DOOM-style 3D perspective renderer using raycasting
 */

import type {
  Renderer,
  Camera,
  RenderOptions,
  HUDData,
} from '../renderer';
import type { Vec2, Vec3 } from '../types';
import type { Sector, Linedef, Sidedef } from '../map/types';
import type { Thing } from '../entities/types';
import type { Angle } from '../types';

interface WallSlice {
  x: number;
  height: number;
  distance: number;
  color: string;
  texture: string;
  lightLevel: number;
}

/**
 * Canvas 3D Raycasting Renderer implementation
 * Renders a first-person 3D view using column-based raycasting
 */
export class Canvas3DRenderer implements Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private options: RenderOptions;
  private camera: Camera | null = null;
  private wallSlices: WallSlice[] = [];

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
    this.wallSlices = [];
  }

  endFrame(): void {
    this.ctx.restore();
  }

  clear(color = '#000000'): void {
    // Draw sky (upper half)
    this.ctx.fillStyle = '#4a4a4a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height / 2);

    // Draw floor (lower half)
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.fillRect(0, this.canvas.height / 2, this.canvas.width, this.canvas.height / 2);
  }

  setCamera(camera: Camera): void {
    this.camera = camera;
  }

  renderWall(
    start: Vec2,
    end: Vec2,
    height: number,
    textureName: string,
    sidedef: Sidedef
  ): void {
    if (!this.camera) return;

    // Transform wall endpoints to camera space
    const start3d: Vec3 = { x: start.x, y: start.y, z: 0 };
    const end3d: Vec3 = { x: end.x, y: end.y, z: 0 };

    // Calculate vectors
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const wallLength = Math.sqrt(dx * dx + dy * dy);

    if (wallLength < 0.1) return;

    // Sample points along the wall for rendering
    const numSamples = Math.max(1, Math.floor(wallLength / 32));

    for (let i = 0; i <= numSamples; i++) {
      const t = i / numSamples;
      const px = start.x + dx * t;
      const py = start.y + dy * t;

      // Transform to camera space
      const relX = px - this.camera.position.x;
      const relY = py - this.camera.position.y;

      // Rotate to camera view
      const cos = Math.cos(-this.camera.angle);
      const sin = Math.sin(-this.camera.angle);
      const camX = relX * cos - relY * sin;
      const camY = relX * sin + relY * cos;

      // Skip if behind camera
      if (camY <= 0.1) continue;

      // Project to screen space
      const screenX = (camX / camY) * (this.canvas.width / 2) + this.canvas.width / 2;

      // Skip if outside screen bounds
      if (screenX < 0 || screenX >= this.canvas.width) continue;

      // Calculate wall height on screen
      const wallScreenHeight = (height / camY) * (this.canvas.height / 2);

      // Store wall slice for sorting and rendering
      this.wallSlices.push({
        x: Math.floor(screenX),
        height: wallScreenHeight,
        distance: camY,
        color: this.getTextureColor(textureName),
        texture: textureName,
        lightLevel: 160,
      });
    }
  }

  renderFloor(sector: Sector, vertices: Vec2[]): void {
    // Floor rendering using raycasting is complex
    // For now, we handle it in the clear() method with a simple gradient
    // TODO: Implement proper floor casting
  }

  renderCeiling(sector: Sector, vertices: Vec2[]): void {
    // Ceiling rendering using raycasting is complex
    // For now, we handle it in the clear() method with a simple gradient
    // TODO: Implement proper ceiling casting
  }

  renderSprite(thing: Thing, _screenPos: Vec2, _scale: number): void {
    if (!this.camera) return;

    // Transform sprite to camera space
    const relX = thing.position.x - this.camera.position.x;
    const relY = thing.position.y - this.camera.position.y;

    // Rotate to camera view
    const cos = Math.cos(-this.camera.angle);
    const sin = Math.sin(-this.camera.angle);
    const camX = relX * cos - relY * sin;
    const camY = relX * sin + relY * cos;

    // Skip if behind camera
    if (camY <= 0.1) return;

    // Project to screen space
    const screenX = (camX / camY) * (this.canvas.width / 2) + this.canvas.width / 2;
    const spriteSize = (thing.radius * 2 / camY) * (this.canvas.height / 2);

    // Skip if outside screen bounds
    if (screenX + spriteSize / 2 < 0 || screenX - spriteSize / 2 >= this.canvas.width) return;

    // Draw sprite as a colored circle (placeholder)
    this.ctx.fillStyle = '#ff0000';
    this.ctx.beginPath();
    this.ctx.arc(screenX, this.canvas.height / 2, spriteSize / 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  renderAutomap(
    linedefs: Linedef[],
    playerPos: Vec2,
    playerAngle: Angle,
    _scale: number
  ): void {
    // In 3D mode, we show a small minimap in the corner
    const mapSize = 100;
    const mapX = this.canvas.width - mapSize - 10;
    const mapY = 10;

    // Draw minimap background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(mapX, mapY, mapSize, mapSize);

    // Draw player position
    const centerX = mapX + mapSize / 2;
    const centerY = mapY + mapSize / 2;

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(playerAngle);

    this.ctx.fillStyle = '#00ff00';
    this.ctx.strokeStyle = '#00aa00';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(8, 0);
    this.ctx.lineTo(-4, -4);
    this.ctx.lineTo(-4, 4);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.restore();
  }

  renderHUD(data: HUDData): void {
    const padding = 10;
    const fontSize = 14;

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

    // Render collected wall slices
    this.renderWallSlices();
  }

  private renderWallSlices(): void {
    // Sort slices by distance (back to front for proper occlusion)
    this.wallSlices.sort((a, b) => b.distance - a.distance);

    // Track which x-coordinates have been rendered (for basic occlusion)
    const renderedColumns = new Set<number>();

    for (const slice of this.wallSlices) {
      // Skip if this column was already rendered by a closer wall
      if (renderedColumns.has(slice.x)) continue;

      const x = slice.x;
      const wallHeight = Math.min(slice.height, this.canvas.height * 2);
      const y = (this.canvas.height - wallHeight) / 2;

      // Apply distance-based shading
      const shade = Math.max(0.2, Math.min(1, 1 - slice.distance / 800));
      const color = this.shadeColor(slice.color, shade);

      // Draw wall slice
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y, 1, wallHeight);

      // Mark column as rendered
      renderedColumns.add(x);
    }
  }

  getRenderTarget(): HTMLCanvasElement {
    return this.canvas;
  }

  dispose(): void {
    this.wallSlices = [];
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
    return `hsl(${hue}, 60%, 50%)`;
  }

  /**
   * Apply shading to a color
   */
  private shadeColor(color: string, shade: number): string {
    // Parse HSL color
    const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (hslMatch) {
      const h = parseInt(hslMatch[1]);
      const s = parseInt(hslMatch[2]);
      const l = parseInt(hslMatch[3]);
      const newL = Math.floor(l * shade);
      return `hsl(${h}, ${s}%, ${newL}%)`;
    }
    return color;
  }
}

/**
 * Create a Canvas 3D raycasting renderer
 */
export function createCanvas3DRenderer(canvas: HTMLCanvasElement): Renderer {
  return new Canvas3DRenderer(canvas);
}

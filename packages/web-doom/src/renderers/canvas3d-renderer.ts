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
import type { Sector, Linedef, Sidedef, MapData, Vertex } from '../map/types';
import type { Thing } from '../entities/types';
import type { Angle } from '../types';
import type { WadFile } from '@web-doom/wad';
import { TextureManager, SpriteManager } from '../graphics';

interface WallHit {
  distance: number;
  wallHeight: number;
  textureName: string;
  textureX: number;
  lightLevel: number;
  textureCanvas: HTMLCanvasElement | null;
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
  private mapData: MapData | null = null;
  private textureManager: TextureManager | null = null;
  private spriteManager: SpriteManager | null = null;
  private zBuffer: number[] = []; // For sprite rendering

  constructor(canvas: HTMLCanvasElement, wad?: WadFile) {
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

    // Initialize texture and sprite managers if WAD provided
    if (wad) {
      this.textureManager = new TextureManager(wad);
      this.spriteManager = new SpriteManager(wad);

      // Preload common assets
      this.textureManager.preloadCommonTextures().catch((err) => {
        console.warn('Failed to preload textures:', err);
      });
      this.spriteManager.preloadCommonSprites().catch((err) => {
        console.warn('Failed to preload sprites:', err);
      });
    }
  }

  /**
   * Set WAD file for texture/sprite loading
   */
  setWad(wad: WadFile): void {
    this.textureManager = new TextureManager(wad);
    this.spriteManager = new SpriteManager(wad);
  }

  /**
   * Set map data for raycasting
   */
  setMapData(mapData: MapData | null): void {
    this.mapData = mapData;
  }

  init(options: RenderOptions): void {
    this.options = options;
    this.canvas.width = options.width;
    this.canvas.height = options.height;
    this.zBuffer = new Array(options.width).fill(Infinity);
  }

  beginFrame(): void {
    this.ctx.save();
    this.zBuffer.fill(Infinity);
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
    // This method is now a no-op for Canvas3DRenderer
    // Actual rendering happens in render3DView()
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

    // Check z-buffer for occlusion
    const spriteScreenLeft = Math.floor(Math.max(0, screenX - spriteSize / 2));
    const spriteScreenRight = Math.floor(Math.min(this.canvas.width - 1, screenX + spriteSize / 2));

    let visible = false;
    for (let x = spriteScreenLeft; x <= spriteScreenRight; x++) {
      if (camY < this.zBuffer[x]) {
        visible = true;
        break;
      }
    }

    if (!visible) return;

    // Try to get sprite from sprite manager
    if (this.spriteManager) {
      // Get sprite name from thing sprite and frame
      const spriteName = this.spriteManager.getSpriteFrameName(
        thing.sprite,
        String.fromCharCode(65 + thing.frame), // Convert frame number to letter
        0 // No rotation for now
      );

      const spriteData = this.spriteManager.getSprite(spriteName);
      if (spriteData) {
        // Apply distance-based shading
        const shade = Math.max(0.3, Math.min(1, 1 - camY / 1000));

        // Save context for transformations
        this.ctx.save();
        this.ctx.globalAlpha = shade;

        // Draw sprite with proper centering
        const drawWidth = spriteSize;
        const drawHeight = (spriteData.height / spriteData.width) * spriteSize;
        const drawX = screenX - drawWidth / 2;
        const drawY = this.canvas.height / 2 - drawHeight / 2;

        this.ctx.drawImage(
          spriteData.canvas,
          drawX,
          drawY,
          drawWidth,
          drawHeight
        );

        this.ctx.restore();
        return;
      }
    }

    // Fallback: Draw sprite as a colored circle
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
    // First, render the 3D view if we have map data
    if (this.mapData && this.camera) {
      this.render3DView();
    }

    // Then render HUD on top
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
  }

  /**
   * Render the 3D view using raycasting
   */
  private render3DView(): void {
    if (!this.camera || !this.mapData) return;

    const { width, height } = this.canvas;
    const fov = this.camera.fov || Math.PI / 2; // 90 degrees default

    // Cast a ray for each vertical stripe on screen
    for (let x = 0; x < width; x++) {
      // Calculate ray angle
      // x = 0 should be left edge of FOV, x = width should be right edge
      const cameraX = (2 * x / width) - 1; // -1 to 1
      const rayAngle = this.camera.angle + Math.atan(cameraX * Math.tan(fov / 2));

      // Cast ray
      const hit = this.castRay(rayAngle);

      if (hit) {
        // Store distance in z-buffer for sprite rendering
        this.zBuffer[x] = hit.distance;

        // Calculate wall screen height
        const wallScreenHeight = Math.min(hit.wallHeight / hit.distance * (height / 2), height * 3);
        const wallTop = (height - wallScreenHeight) / 2;
        const wallBottom = wallTop + wallScreenHeight;

        // Apply distance-based shading
        const shade = Math.max(0.2, Math.min(1, 1 - hit.distance / 800));

        // Draw wall slice
        if (hit.textureCanvas) {
          this.ctx.save();
          this.ctx.globalAlpha = shade;

          // Draw textured column
          this.ctx.drawImage(
            hit.textureCanvas,
            hit.textureX, // Source X
            0, // Source Y
            1, // Source width (1 pixel column)
            hit.textureCanvas.height, // Source height
            x, // Dest X
            wallTop, // Dest Y
            1, // Dest width
            wallScreenHeight // Dest height (stretch to fit wall height)
          );

          this.ctx.restore();
        } else {
          // Fallback to colored column
          const color = this.getTextureColor(hit.textureName);
          const shadedColor = this.shadeColor(color, shade);
          this.ctx.fillStyle = shadedColor;
          this.ctx.fillRect(x, wallTop, 1, wallScreenHeight);
        }
      }
    }
  }

  /**
   * Cast a single ray and find the nearest wall intersection
   */
  private castRay(rayAngle: number): WallHit | null {
    if (!this.camera || !this.mapData) return null;

    const rayDirX = Math.cos(rayAngle);
    const rayDirY = Math.sin(rayAngle);
    const rayOriginX = this.camera.position.x;
    const rayOriginY = this.camera.position.y;

    let closestHit: WallHit | null = null;
    let closestDistance = Infinity;

    // Check intersection with all linedefs
    for (const linedef of this.mapData.linedefs) {
      // Skip if no right sidedef (void)
      if (linedef.rightSidedef < 0) continue;

      const v1 = this.mapData.vertices[linedef.startVertex];
      const v2 = this.mapData.vertices[linedef.endVertex];

      // Calculate intersection
      const intersection = this.rayLineIntersection(
        rayOriginX, rayOriginY, rayDirX, rayDirY,
        v1.x, v1.y, v2.x, v2.y
      );

      if (intersection && intersection.distance < closestDistance) {
        // Get sidedef and sector info
        const sidedef = this.mapData.sidedefs[linedef.rightSidedef];
        const sector = this.mapData.sectors[sidedef.sector];

        // Calculate wall height
        const wallHeight = sector.ceilingHeight - sector.floorHeight;

        // Get texture
        const textureName = sidedef.middleTexture || sidedef.upperTexture || 'GRAY';
        let textureCanvas: HTMLCanvasElement | null = null;

        if (this.textureManager) {
          const textureData = this.textureManager.getTexture(textureName);
          if (textureData) {
            textureCanvas = textureData.canvas;
          }
        }

        // Calculate texture X coordinate
        const wallLength = Math.sqrt((v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2);
        const hitWallT = intersection.wallT;
        const textureWidth = textureCanvas ? textureCanvas.width : 64;
        const textureX = Math.floor((hitWallT * wallLength) % textureWidth);

        closestDistance = intersection.distance;
        closestHit = {
          distance: intersection.distance,
          wallHeight,
          textureName,
          textureX,
          lightLevel: sector.lightLevel,
          textureCanvas,
        };
      }
    }

    return closestHit;
  }

  /**
   * Calculate ray-line intersection
   * Returns distance along ray and position along wall (t parameter)
   */
  private rayLineIntersection(
    rayX: number, rayY: number, rayDirX: number, rayDirY: number,
    lineX1: number, lineY1: number, lineX2: number, lineY2: number
  ): { distance: number; wallT: number } | null {
    const lineDirX = lineX2 - lineX1;
    const lineDirY = lineY2 - lineY1;

    // Calculate denominator for intersection formula
    const denominator = rayDirX * lineDirY - rayDirY * lineDirX;

    // Lines are parallel
    if (Math.abs(denominator) < 0.0001) return null;

    // Calculate t parameters
    const dx = lineX1 - rayX;
    const dy = lineY1 - rayY;

    const t1 = (dx * lineDirY - dy * lineDirX) / denominator; // Distance along ray
    const t2 = (dx * rayDirY - dy * rayDirX) / denominator; // Position along line

    // Check if intersection is valid
    if (t1 <= 0) return null; // Behind ray origin
    if (t2 < 0 || t2 > 1) return null; // Outside line segment

    // Calculate actual distance
    const intersectX = rayX + t1 * rayDirX;
    const intersectY = rayY + t1 * rayDirY;

    const dx2 = intersectX - rayX;
    const dy2 = intersectY - rayY;
    const distance = Math.sqrt(dx2 * dx2 + dy2 * dy2);

    // Apply fish-eye correction (perpendicular distance to camera plane)
    // Project the ray direction onto the camera forward vector
    const cameraForwardX = Math.cos(this.camera!.angle);
    const cameraForwardY = Math.sin(this.camera!.angle);
    const dotProduct = rayDirX * cameraForwardX + rayDirY * cameraForwardY;
    const correctedDistance = distance * dotProduct;

    // Ensure distance is positive
    if (correctedDistance <= 0) return null;

    return {
      distance: correctedDistance,
      wallT: t2,
    };
  }

  getRenderTarget(): HTMLCanvasElement {
    return this.canvas;
  }

  dispose(): void {
    if (this.textureManager) {
      this.textureManager.dispose();
    }
    if (this.spriteManager) {
      this.spriteManager.dispose();
    }
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
export function createCanvas3DRenderer(canvas: HTMLCanvasElement, wad?: WadFile): Renderer {
  return new Canvas3DRenderer(canvas, wad);
}

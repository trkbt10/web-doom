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
import { renderParticles, type Particle } from '../effects/particle-system';
import { renderWeaponHUD, type WeaponState } from '../weapons/weapon-hud';

interface WallSegment {
  topY: number;
  bottomY: number;
  textureName: string;
  textureCanvas: HTMLCanvasElement | null;
  textureX: number;
}

interface WallHit {
  distance: number;
  segments: WallSegment[];
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
  private mapData: MapData | null = null;
  private textureManager: TextureManager | null = null;
  private spriteManager: SpriteManager | null = null;
  private zBuffer: number[] = []; // For sprite rendering
  private particles: Particle[] = [];
  private weaponState: WeaponState | null = null;

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

  /**
   * Set particles for rendering
   */
  setParticles(particles: Particle[]): void {
    this.particles = particles;
  }

  /**
   * Set weapon state for HUD rendering
   */
  setWeaponState(weaponState: WeaponState): void {
    this.weaponState = weaponState;
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

    // Render particles
    if (this.camera && this.particles.length > 0) {
      renderParticles(
        this.ctx,
        this.particles,
        this.camera,
        this.canvas.width,
        this.canvas.height
      );
    }

    // Render weapon HUD
    if (this.weaponState && this.spriteManager) {
      renderWeaponHUD(
        this.ctx,
        this.spriteManager,
        this.weaponState,
        this.canvas.width,
        this.canvas.height
      );
    }

    // Then render HUD text on top
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
    const halfHeight = height / 2;

    // Get player's current sector for floor/ceiling textures
    const playerSector = this.getPlayerSector();

    // Cast a ray for each vertical stripe on screen
    for (let x = 0; x < width; x++) {
      // Calculate ray angle
      const cameraX = (2 * x / width) - 1; // -1 to 1
      const rayAngle = this.camera.angle + Math.atan(cameraX * Math.tan(fov / 2));

      // Cast ray
      const hit = this.castRay(rayAngle);

      if (hit) {
        // Store distance in z-buffer for sprite rendering
        this.zBuffer[x] = hit.distance;

        // Apply distance-based shading
        const shade = Math.max(0.2, Math.min(1, 1 - hit.distance / 800));

        // Draw floor and ceiling for this column
        if (playerSector && hit.segments.length > 0) {
          const firstSegment = hit.segments[0];
          const lastSegment = hit.segments[hit.segments.length - 1];

          // Render floor (below walls)
          if (lastSegment.bottomY < height) {
            this.renderFloorCeilingColumn(
              x, rayAngle, Math.floor(lastSegment.bottomY), height,
              playerSector.floorHeight, playerSector.floorTexture,
              true, shade
            );
          }

          // Render ceiling (above walls)
          if (firstSegment.topY > 0) {
            this.renderFloorCeilingColumn(
              x, rayAngle, 0, Math.ceil(firstSegment.topY),
              playerSector.ceilingHeight, playerSector.ceilingTexture,
              false, shade
            );
          }
        }

        // Draw all wall segments for this column
        for (const segment of hit.segments) {
          if (segment.textureCanvas) {
            this.ctx.save();
            this.ctx.globalAlpha = shade;

            // Draw textured column
            const segmentHeight = segment.bottomY - segment.topY;
            this.ctx.drawImage(
              segment.textureCanvas,
              segment.textureX, // Source X
              0, // Source Y
              1, // Source width (1 pixel column)
              segment.textureCanvas.height, // Source height
              x, // Dest X
              segment.topY, // Dest Y
              1, // Dest width
              segmentHeight // Dest height
            );

            this.ctx.restore();
          } else {
            // Fallback to colored column
            const color = this.getTextureColor(segment.textureName);
            const shadedColor = this.shadeColor(color, shade);
            this.ctx.fillStyle = shadedColor;
            const segmentHeight = segment.bottomY - segment.topY;
            this.ctx.fillRect(x, segment.topY, 1, segmentHeight);
          }
        }
      } else if (playerSector) {
        // No wall hit - render full floor and ceiling
        const shade = 1.0;
        this.renderFloorCeilingColumn(
          x, rayAngle, halfHeight, height,
          playerSector.floorHeight, playerSector.floorTexture,
          true, shade
        );
        this.renderFloorCeilingColumn(
          x, rayAngle, 0, halfHeight,
          playerSector.ceilingHeight, playerSector.ceilingTexture,
          false, shade
        );
      }
    }
  }

  /**
   * Render floor or ceiling column
   */
  private renderFloorCeilingColumn(
    screenX: number,
    rayAngle: number,
    startY: number,
    endY: number,
    planeHeight: number,
    textureName: string,
    isFloor: boolean,
    baseShade: number
  ): void {
    if (!this.camera || !this.textureManager) return;

    // Get flat texture
    const flatTextureData = this.textureManager.getFlat(textureName);
    if (!flatTextureData) return;

    const flatCanvas = flatTextureData.canvas;
    if (!flatCanvas) return;

    const rayDirX = Math.cos(rayAngle);
    const rayDirY = Math.sin(rayAngle);
    const playerZ = this.camera.position.z;
    const halfHeight = this.canvas.height / 2;

    // Sample every few pixels for performance
    const step = 2;
    for (let y = startY; y < endY; y += step) {
      // Calculate distance to floor/ceiling point
      const screenY = y - halfHeight;
      if (screenY === 0) continue;

      const distance = Math.abs((planeHeight - playerZ) * halfHeight / screenY);
      if (distance <= 0 || distance > 2000) continue;

      // Calculate world position
      const worldX = this.camera.position.x + rayDirX * distance;
      const worldY = this.camera.position.y + rayDirY * distance;

      // Calculate texture coordinates
      const texSize = 64;
      const texX = Math.floor(Math.abs(worldX) % texSize);
      const texY = Math.floor(Math.abs(worldY) % texSize);

      // Get pixel from texture
      const pixelData = this.ctx.createImageData(1, step);
      const srcCtx = flatCanvas.getContext('2d');
      if (srcCtx) {
        const srcPixel = srcCtx.getImageData(texX, texY, 1, 1).data;

        // Apply distance-based shading
        const distShade = Math.max(0.3, Math.min(1, 1 - distance / 1000)) * baseShade;

        for (let i = 0; i < step; i++) {
          const offset = i * 4;
          pixelData.data[offset] = srcPixel[0] * distShade;
          pixelData.data[offset + 1] = srcPixel[1] * distShade;
          pixelData.data[offset + 2] = srcPixel[2] * distShade;
          pixelData.data[offset + 3] = 255;
        }

        this.ctx.putImageData(pixelData, screenX, y);
      }
    }
  }

  /**
   * Get player's current sector
   */
  private getPlayerSector(): Sector | null {
    if (!this.camera || !this.mapData) return null;

    // Simple point-in-polygon test for each sector
    for (let i = 0; i < this.mapData.sectors.length; i++) {
      const sector = this.mapData.sectors[i];

      // Find linedefs belonging to this sector
      const sectorLinedefs: Linedef[] = [];
      for (const linedef of this.mapData.linedefs) {
        const rightSidedef = linedef.rightSidedef >= 0 ? this.mapData.sidedefs[linedef.rightSidedef] : null;
        const leftSidedef = linedef.leftSidedef >= 0 ? this.mapData.sidedefs[linedef.leftSidedef] : null;

        if (rightSidedef?.sector === i || leftSidedef?.sector === i) {
          sectorLinedefs.push(linedef);
        }
      }

      // Simple point-in-polygon using ray casting
      if (sectorLinedefs.length > 0) {
        let inside = false;
        const px = this.camera.position.x;
        const py = this.camera.position.y;

        for (const linedef of sectorLinedefs) {
          const v1 = this.mapData.vertices[linedef.startVertex];
          const v2 = this.mapData.vertices[linedef.endVertex];

          if (((v1.y > py) !== (v2.y > py)) &&
              (px < (v2.x - v1.x) * (py - v1.y) / (v2.y - v1.y) + v1.x)) {
            inside = !inside;
          }
        }

        if (inside) return sector;
      }
    }

    // Fallback to first sector
    return this.mapData.sectors[0] || null;
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
    const playerZ = this.camera.position.z;

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
        const rightSidedef = this.mapData.sidedefs[linedef.rightSidedef];
        const rightSector = this.mapData.sectors[rightSidedef.sector];

        // Check if this is a portal (two-sided wall) or solid wall
        const hasLeftSide = linedef.leftSidedef >= 0;
        const leftSidedef = hasLeftSide ? this.mapData.sidedefs[linedef.leftSidedef] : null;
        const leftSector = leftSidedef ? this.mapData.sectors[leftSidedef.sector] : null;

        const segments: WallSegment[] = [];
        const wallLength = Math.sqrt((v2.x - v1.x) ** 2 + (v2.y - v1.y) ** 2);
        const hitWallT = intersection.wallT;

        if (!leftSector) {
          // Solid wall - draw middle texture from floor to ceiling
          const textureName = rightSidedef.middleTexture || 'GRAY';
          const textureCanvas = this.getTextureCanvas(textureName);
          const textureWidth = textureCanvas ? textureCanvas.width : 64;
          const textureX = Math.floor((hitWallT * wallLength + rightSidedef.xOffset) % textureWidth);

          // Project floor and ceiling heights to screen
          const ceilingScreenY = this.projectHeight(rightSector.ceilingHeight, intersection.distance, playerZ);
          const floorScreenY = this.projectHeight(rightSector.floorHeight, intersection.distance, playerZ);

          segments.push({
            topY: ceilingScreenY,
            bottomY: floorScreenY,
            textureName,
            textureCanvas,
            textureX,
          });
        } else {
          // Portal (two-sided) - draw upper, middle, and lower textures as needed
          const frontCeiling = rightSector.ceilingHeight;
          const frontFloor = rightSector.floorHeight;
          const backCeiling = leftSector.ceilingHeight;
          const backFloor = leftSector.floorHeight;

          // Project all heights to screen
          const frontCeilingY = this.projectHeight(frontCeiling, intersection.distance, playerZ);
          const frontFloorY = this.projectHeight(frontFloor, intersection.distance, playerZ);
          const backCeilingY = this.projectHeight(backCeiling, intersection.distance, playerZ);
          const backFloorY = this.projectHeight(backFloor, intersection.distance, playerZ);

          // Upper texture (if back ceiling is lower than front ceiling)
          if (backCeiling < frontCeiling && rightSidedef.upperTexture && rightSidedef.upperTexture !== '-') {
            const textureCanvas = this.getTextureCanvas(rightSidedef.upperTexture);
            const textureWidth = textureCanvas ? textureCanvas.width : 64;
            const textureX = Math.floor((hitWallT * wallLength + rightSidedef.xOffset) % textureWidth);

            segments.push({
              topY: frontCeilingY,
              bottomY: backCeilingY,
              textureName: rightSidedef.upperTexture,
              textureCanvas,
              textureX,
            });
          }

          // Lower texture (if back floor is higher than front floor)
          if (backFloor > frontFloor && rightSidedef.lowerTexture && rightSidedef.lowerTexture !== '-') {
            const textureCanvas = this.getTextureCanvas(rightSidedef.lowerTexture);
            const textureWidth = textureCanvas ? textureCanvas.width : 64;
            const textureX = Math.floor((hitWallT * wallLength + rightSidedef.xOffset) % textureWidth);

            segments.push({
              topY: backFloorY,
              bottomY: frontFloorY,
              textureName: rightSidedef.lowerTexture,
              textureCanvas,
              textureX,
            });
          }

          // Middle texture (if specified - used for transparent elements like bars)
          if (rightSidedef.middleTexture && rightSidedef.middleTexture !== '-') {
            const textureCanvas = this.getTextureCanvas(rightSidedef.middleTexture);
            const textureWidth = textureCanvas ? textureCanvas.width : 64;
            const textureX = Math.floor((hitWallT * wallLength + rightSidedef.xOffset) % textureWidth);

            // Middle texture spans between the visible portal opening
            const topY = Math.max(frontCeilingY, backCeilingY);
            const bottomY = Math.min(frontFloorY, backFloorY);

            if (bottomY > topY) {
              segments.push({
                topY,
                bottomY,
                textureName: rightSidedef.middleTexture,
                textureCanvas,
                textureX,
              });
            }
          }
        }

        closestDistance = intersection.distance;
        closestHit = {
          distance: intersection.distance,
          segments,
          lightLevel: rightSector.lightLevel,
        };
      }
    }

    return closestHit;
  }

  /**
   * Project a world height to screen Y coordinate
   */
  private projectHeight(worldHeight: number, distance: number, viewHeight: number): number {
    const relativeHeight = worldHeight - viewHeight;
    const screenHeight = (relativeHeight / distance) * (this.canvas.height / 2);
    return (this.canvas.height / 2) - screenHeight;
  }

  /**
   * Get texture canvas from texture manager
   */
  private getTextureCanvas(textureName: string): HTMLCanvasElement | null {
    if (!this.textureManager || !textureName || textureName === '-') {
      return null;
    }
    const textureData = this.textureManager.getTexture(textureName);
    return textureData ? textureData.canvas : null;
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

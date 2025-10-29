/**
 * WebGL Renderer using Three.js
 * High-performance GPU-accelerated rendering for DOOM
 */

import * as THREE from 'three';
import type {
  Renderer,
  Camera,
  RenderOptions,
  HUDData,
} from '../renderer';
import type { Vec2, Vec3, Angle } from '../types';
import type { Sector, Linedef, Sidedef } from '../map/types';
import type { Thing } from '../entities/types';
import type { MapData } from '../map/types';
import type { WadFile } from '@web-doom/wad';
import { buildMapGeometry } from './webgl/geometry-builder';
import { WebGLTextureManager } from './webgl/texture-manager-webgl';
import { MaterialSystem } from './webgl/material-system';
import { SpriteRendererWebGL } from './webgl/sprite-renderer-webgl';
import { ParticleSystemWebGL } from './webgl/particle-system-webgl';

/**
 * WebGL Renderer implementation using Three.js
 */
export class WebGLRenderer implements Renderer {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private options: RenderOptions;

  // Rendering systems
  private textureManager: WebGLTextureManager | null = null;
  private materialSystem: MaterialSystem | null = null;
  private spriteRenderer: SpriteRendererWebGL | null = null;
  private particleSystem: ParticleSystemWebGL | null = null;

  // Scene objects
  private mapGroup: THREE.Group;
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;

  // Map data
  private mapData: MapData | null = null;

  // HUD canvas overlay
  private hudCanvas: HTMLCanvasElement | null = null;
  private hudCtx: CanvasRenderingContext2D | null = null;

  // Camera state
  private currentCamera: Camera | null = null;

  // Animation
  private lastFrameTime: number = 0;

  constructor(canvas: HTMLCanvasElement, wad?: WadFile) {
    this.canvas = canvas;
    this.options = {
      width: canvas.width,
      height: canvas.height,
      scale: 1,
    };

    // Initialize Three.js renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false, // Keep pixelated DOOM look
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(this.options.width, this.options.height);
    this.renderer.setPixelRatio(1); // Keep pixelated look
    this.renderer.shadowMap.enabled = false; // DOOM doesn't use shadows

    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    this.scene.fog = new THREE.Fog(0x000000, 100, 1000);

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      75, // FOV
      this.options.width / this.options.height,
      0.1,
      2000
    );
    this.scene.add(this.camera);

    // Add lights
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(this.ambientLight);

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    this.directionalLight.position.set(0, 100, 0);
    this.scene.add(this.directionalLight);

    // Initialize map group
    this.mapGroup = new THREE.Group();
    this.scene.add(this.mapGroup);

    // Initialize subsystems if WAD provided
    if (wad) {
      this.initializeSubsystems(wad);
    }

    // Create HUD canvas overlay
    this.createHUDOverlay();

    // Start animation loop
    this.animate();
  }

  /**
   * Initialize rendering subsystems
   */
  private initializeSubsystems(wad: WadFile): void {
    this.textureManager = new WebGLTextureManager(wad, this.renderer);
    this.materialSystem = new MaterialSystem(this.textureManager);
    this.spriteRenderer = new SpriteRendererWebGL(this.scene, wad);
    this.particleSystem = new ParticleSystemWebGL(this.scene);

    // Preload common textures
    this.textureManager.preloadCommonTextures().catch(err => {
      console.warn('Failed to preload textures:', err);
    });
  }

  /**
   * Create HUD canvas overlay
   */
  private createHUDOverlay(): void {
    this.hudCanvas = document.createElement('canvas');
    this.hudCanvas.width = this.options.width;
    this.hudCanvas.height = this.options.height;
    this.hudCanvas.style.position = 'absolute';
    this.hudCanvas.style.top = '0';
    this.hudCanvas.style.left = '0';
    this.hudCanvas.style.pointerEvents = 'none';

    this.hudCtx = this.hudCanvas.getContext('2d');

    // Append to canvas parent
    if (this.canvas.parentElement) {
      this.canvas.parentElement.style.position = 'relative';
      this.canvas.parentElement.appendChild(this.hudCanvas);
    }
  }

  /**
   * Set WAD file for texture/sprite loading
   */
  setWad(wad: WadFile): void {
    this.initializeSubsystems(wad);
  }

  /**
   * Set map data and build geometry
   */
  setMapData(mapData: MapData | null): void {
    this.mapData = mapData;

    if (!mapData || !this.materialSystem) {
      return;
    }

    // Clear existing map geometry
    this.mapGroup.clear();

    // Build map geometry
    const { walls, floors, ceilings } = buildMapGeometry(mapData);

    // Apply materials
    walls.children.forEach(mesh => {
      if (mesh instanceof THREE.Mesh) {
        this.materialSystem!.applyMaterialToMesh(mesh);
      }
    });

    floors.children.forEach(mesh => {
      if (mesh instanceof THREE.Mesh) {
        this.materialSystem!.applyMaterialToMesh(mesh);
      }
    });

    ceilings.children.forEach(mesh => {
      if (mesh instanceof THREE.Mesh) {
        this.materialSystem!.applyMaterialToMesh(mesh);
      }
    });

    // Add to scene
    this.mapGroup.add(walls);
    this.mapGroup.add(floors);
    this.mapGroup.add(ceilings);

    console.log(`Map loaded: ${walls.children.length} walls, ${floors.children.length} floors, ${ceilings.children.length} ceilings`);
  }

  init(options: RenderOptions): void {
    this.options = options;
    this.renderer.setSize(options.width, options.height);
    this.camera.aspect = options.width / options.height;
    this.camera.updateProjectionMatrix();

    if (this.hudCanvas) {
      this.hudCanvas.width = options.width;
      this.hudCanvas.height = options.height;
    }
  }

  beginFrame(): void {
    // Clear is handled automatically by Three.js
  }

  endFrame(): void {
    // Rendering is handled in animation loop
  }

  clear(color = '#000000'): void {
    const threeColor = new THREE.Color(color);
    this.scene.background = threeColor;
  }

  setCamera(camera: Camera): void {
    this.currentCamera = camera;

    // Update Three.js camera
    // DOOM coordinates: X-right, Y-forward, Z-up
    // Three.js coordinates: X-right, Y-up, Z-backward
    this.camera.position.set(
      camera.position.x,
      camera.position.z,
      -camera.position.y
    );

    // Set camera rotation
    this.camera.rotation.set(
      -camera.pitch,
      camera.angle,
      0,
      'YXZ'
    );

    // Update FOV
    if (camera.fov && camera.fov !== this.camera.fov) {
      this.camera.fov = camera.fov;
      this.camera.updateProjectionMatrix();
    }
  }

  renderWall(
    start: Vec2,
    end: Vec2,
    height: number,
    textureName: string,
    sidedef: Sidedef
  ): void {
    // WebGL renderer builds all geometry at once, so this is a no-op
    // Individual wall rendering is not needed
  }

  renderFloor(sector: Sector, vertices: Vec2[]): void {
    // WebGL renderer builds all geometry at once, so this is a no-op
  }

  renderCeiling(sector: Sector, vertices: Vec2[]): void {
    // WebGL renderer builds all geometry at once, so this is a no-op
  }

  renderSprite(thing: Thing, screenPos: Vec2, scale: number): void {
    if (this.spriteRenderer) {
      // Use thing's position directly (will be converted by sprite renderer)
      this.spriteRenderer.updateSprite(thing, thing.type);
    }
  }

  renderAutomap(
    linedefs: Linedef[],
    playerPos: Vec2,
    playerAngle: Angle,
    scale: number
  ): void {
    if (!this.hudCtx) return;

    // Render automap on HUD overlay
    const ctx = this.hudCtx;
    const width = this.hudCanvas!.width;
    const height = this.hudCanvas!.height;

    // Clear HUD
    ctx.clearRect(0, 0, width, height);

    // Draw semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(width - 250, 10, 240, 240);

    // Draw map
    ctx.save();
    ctx.translate(width - 130, 130);
    ctx.scale(scale, -scale);
    ctx.translate(-playerPos.x, -playerPos.y);

    // Draw linedefs
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 1 / scale;
    ctx.beginPath();
    for (const linedef of linedefs) {
      if (!this.mapData) continue;
      const v1 = this.mapData.vertices[linedef.startVertex];
      const v2 = this.mapData.vertices[linedef.endVertex];
      if (!v1 || !v2) continue;

      ctx.moveTo(v1.x, v1.y);
      ctx.lineTo(v2.x, v2.y);
    }
    ctx.stroke();

    // Draw player
    ctx.restore();
    ctx.save();
    ctx.translate(width - 130, 130);
    ctx.rotate(-playerAngle);

    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(4, 5);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  renderHUD(data: HUDData): void {
    if (!this.hudCtx) return;

    const ctx = this.hudCtx;
    const width = this.hudCanvas!.width;
    const height = this.hudCanvas!.height;

    // Clear HUD (except automap area)
    ctx.clearRect(0, height - 50, width, 50);

    // Draw HUD background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, height - 50, width, 50);

    // Draw health
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px monospace';
    ctx.fillText(`Health: ${data.health}%`, 10, height - 25);

    // Draw armor
    ctx.fillText(`Armor: ${data.armor}%`, 150, height - 25);

    // Draw ammo
    ctx.fillText(`Ammo: ${data.ammo}/${data.maxAmmo}`, 290, height - 25);

    // Draw FPS if enabled
    if (data.fps !== undefined && this.options.showFPS) {
      ctx.fillText(`FPS: ${Math.round(data.fps)}`, width - 100, height - 25);
    }

    // Draw message if any
    if (data.message) {
      ctx.fillStyle = '#FFFF00';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(data.message, width / 2, height - 70);
      ctx.textAlign = 'left';
    }
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const now = performance.now();
    const deltaTime = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    // Update particle system
    if (this.particleSystem) {
      this.particleSystem.update(deltaTime);
    }

    // Update sprite billboards
    if (this.spriteRenderer) {
      this.spriteRenderer.updateBillboards(this.camera);
    }

    // Render scene
    this.renderer.render(this.scene, this.camera);
  };

  getRenderTarget(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    // Dispose subsystems
    this.textureManager?.dispose();
    this.materialSystem?.dispose();
    this.spriteRenderer?.dispose();
    this.particleSystem?.dispose();

    // Dispose scene
    this.scene.clear();

    // Dispose renderer
    this.renderer.dispose();

    // Remove HUD canvas
    if (this.hudCanvas && this.hudCanvas.parentElement) {
      this.hudCanvas.parentElement.removeChild(this.hudCanvas);
    }
  }

  /**
   * Get particle system for external effects
   */
  getParticleSystem(): ParticleSystemWebGL | null {
    return this.particleSystem;
  }

  /**
   * Get sprite renderer for external updates
   */
  getSpriteRenderer(): SpriteRendererWebGL | null {
    return this.spriteRenderer;
  }
}

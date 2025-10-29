/**
 * Sprite Renderer for WebGL
 * Handles rendering of sprites (enemies, items, decorations) as billboards
 */

import * as THREE from 'three';
import type { Thing } from '../../entities/types';
import { SpriteManager } from '../../graphics/sprite-manager';
import type { WadFile } from '@web-doom/wad';

/**
 * Sprite instance for rendering
 */
interface SpriteInstance {
  mesh: THREE.Mesh;
  thing: Thing;
  lastUpdate: number;
}

/**
 * Manages sprite rendering in WebGL
 */
export class SpriteRendererWebGL {
  private scene: THREE.Scene;
  private spriteManager: SpriteManager;
  private spriteInstances: Map<number, SpriteInstance> = new Map();
  private textureCache: Map<string, THREE.Texture> = new Map();
  private spriteMaterial: THREE.ShaderMaterial;

  constructor(scene: THREE.Scene, wad: WadFile) {
    this.scene = scene;
    this.spriteManager = new SpriteManager(wad);

    // Create custom shader material for sprites
    this.spriteMaterial = this.createSpriteMaterial();

    // Preload common sprites
    this.spriteManager.preloadCommonSprites().catch(err => {
      console.warn('Failed to preload sprites:', err);
    });
  }

  /**
   * Create custom shader material for sprites
   * This ensures sprites are always facing the camera (billboard effect)
   */
  private createSpriteMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        map: { value: null },
        opacity: { value: 1.0 },
        lightLevel: { value: 1.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        uniform float opacity;
        uniform float lightLevel;
        varying vec2 vUv;

        void main() {
          vec4 texColor = texture2D(map, vUv);

          // Discard fully transparent pixels
          if (texColor.a < 0.1) {
            discard;
          }

          // Apply lighting
          vec3 lit = texColor.rgb * lightLevel;

          gl_FragColor = vec4(lit, texColor.a * opacity);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true
    });
  }

  /**
   * Get or create texture from sprite canvas
   */
  private getSpriteTexture(spriteName: string): THREE.Texture | null {
    // Check cache
    if (this.textureCache.has(spriteName)) {
      return this.textureCache.get(spriteName)!;
    }

    // Get full sprite name with frame and rotation
    // Use frame 'A' and rotation 0 as default
    const fullSpriteName = this.spriteManager.getSpriteFrameName(spriteName, 'A', 0);

    // Get sprite from sprite manager
    const spriteData = this.spriteManager.getSprite(fullSpriteName);
    if (!spriteData) {
      return null;
    }

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(spriteData.canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;

    // Cache texture
    this.textureCache.set(spriteName, texture);

    return texture;
  }

  /**
   * Update or create sprite instance for a thing
   */
  updateSprite(thing: Thing, thingId: number): void {
    const now = Date.now();

    // Get sprite name (simplified - in real DOOM this is more complex)
    const spriteName = this.getSpriteName(thing);
    if (!spriteName) {
      return;
    }

    // Check if sprite instance exists
    let instance = this.spriteInstances.get(thingId);

    if (!instance) {
      // Create new sprite instance
      const texture = this.getSpriteTexture(spriteName);
      if (!texture) {
        return;
      }

      // Create billboard geometry
      const geometry = new THREE.PlaneGeometry(
        thing.radius * 2,
        thing.radius * 2
      );

      // Clone material and set texture
      const material = this.spriteMaterial.clone();
      material.uniforms.map.value = texture;
      material.uniforms.lightLevel.value = 1.0; // Will be updated based on sector

      const mesh = new THREE.Mesh(geometry, material);
      mesh.renderOrder = 999; // Render after everything else

      this.scene.add(mesh);

      instance = {
        mesh,
        thing,
        lastUpdate: now
      };

      this.spriteInstances.set(thingId, instance);
    }

    // Update sprite position
    instance.mesh.position.set(
      thing.position.x,
      thing.position.z + thing.radius, // Center vertically
      thing.position.y
    );

    // Make sprite face camera (billboard effect)
    // This is handled automatically by Three.js when we use a Sprite or by updating rotation
    // For now, we'll update it in the render loop

    instance.lastUpdate = now;
  }

  /**
   * Get sprite name from thing type
   * This is a simplified version - real DOOM has complex sprite naming
   */
  private getSpriteName(thing: Thing): string | null {
    // Map thing types to sprite names
    const spriteMap: Record<number, string> = {
      1: 'PLAY', // Player
      3004: 'POSS', // Former Human
      9: 'SPOS', // Former Sergeant
      3001: 'TROO', // Imp
      3002: 'SARG', // Demon
      58: 'SARG', // Spectre
      3006: 'SKUL', // Lost Soul
      3005: 'HEAD', // Cacodemon
      69: 'BOS2', // Hell Knight
      3003: 'BOSS', // Baron of Hell
      68: 'BSPI', // Arachnotron
      71: 'PAIN', // Pain Elemental
      65: 'CPOS', // Chaingunner
      64: 'VILE', // Arch-vile
      67: 'FATT', // Mancubus
      66: 'SKEL', // Revenant
      84: 'SSWV', // Wolfenstein SS
      7: 'SPID', // Spider Mastermind
      16: 'CYBR', // Cyberdemon

      // Items
      2018: 'ARM1', // Armor
      2019: 'ARM2', // Mega Armor
      2014: 'BON1', // Health Bonus
      2015: 'BON2', // Armor Bonus
      2011: 'STIM', // Stimpack
      2012: 'MEDI', // Medikit
      2013: 'SOUL', // Soulsphere
      2022: 'PINV', // Invulnerability
      2023: 'PSTR', // Berserk
      2024: 'PINS', // Invisibility
      2025: 'SUIT', // Radiation Suit
      2026: 'PMAP', // Computer Map
      2045: 'PVIS', // Light Amp

      // Weapons
      2001: 'SHOT', // Shotgun
      2002: 'MGUN', // Chaingun
      2003: 'LAUN', // Rocket Launcher
      2004: 'PLAS', // Plasma Gun
      2005: 'CSAW', // Chainsaw
      2006: 'BFUG', // BFG9000

      // Ammo
      2007: 'CLIP', // Clip
      2008: 'SHEL', // Shells
      2010: 'ROCK', // Rocket
      2047: 'CELL', // Cell
      2048: 'AMMO', // Box of Ammo
      2049: 'SBOX', // Box of Shells
      2046: 'BROK', // Box of Rockets
      17: 'CELP', // Cell Pack

      // Keys
      5: 'BKEY', // Blue Keycard
      6: 'YKEY', // Yellow Keycard
      13: 'RKEY', // Red Keycard

      // Decorations
      2028: 'COLU', // Floor Lamp
      34: 'CAND', // Candelabra
      35: 'CBRA', // Candelabra
      43: 'TRE1', // Burnt Tree
      47: 'SMIT', // Stalagmite
      48: 'ELEC', // Tall Techno Pillar
    };

    const spriteName = spriteMap[thing.type];
    return spriteName || null;
  }

  /**
   * Update all sprite billboards to face camera
   */
  updateBillboards(camera: THREE.Camera): void {
    for (const instance of this.spriteInstances.values()) {
      // Make sprite face camera
      instance.mesh.quaternion.copy(camera.quaternion);
    }
  }

  /**
   * Remove sprites that haven't been updated recently
   */
  cleanupStaleSprites(maxAge: number = 5000): void {
    const now = Date.now();

    for (const [id, instance] of this.spriteInstances.entries()) {
      if (now - instance.lastUpdate > maxAge) {
        this.scene.remove(instance.mesh);
        instance.mesh.geometry.dispose();
        if (instance.mesh.material instanceof THREE.Material) {
          instance.mesh.material.dispose();
        }
        this.spriteInstances.delete(id);
      }
    }
  }

  /**
   * Remove a specific sprite
   */
  removeSprite(thingId: number): void {
    const instance = this.spriteInstances.get(thingId);
    if (instance) {
      this.scene.remove(instance.mesh);
      instance.mesh.geometry.dispose();
      if (instance.mesh.material instanceof THREE.Material) {
        instance.mesh.material.dispose();
      }
      this.spriteInstances.delete(thingId);
    }
  }

  /**
   * Clear all sprites
   */
  clear(): void {
    for (const instance of this.spriteInstances.values()) {
      this.scene.remove(instance.mesh);
      instance.mesh.geometry.dispose();
      if (instance.mesh.material instanceof THREE.Material) {
        instance.mesh.material.dispose();
      }
    }
    this.spriteInstances.clear();
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.clear();

    // Dispose cached textures
    for (const texture of this.textureCache.values()) {
      texture.dispose();
    }
    this.textureCache.clear();

    // Dispose material
    this.spriteMaterial.dispose();

    // Dispose sprite manager
    this.spriteManager.dispose();
  }
}

/**
 * Material System for WebGL Renderer
 * Manages materials and lighting for DOOM-style rendering
 */

import * as THREE from 'three';
import type { Sector, Sidedef } from '../../map/types';
import type { WebGLTextureManager } from './texture-manager-webgl';

/**
 * Material cache key
 */
interface MaterialKey {
  textureName: string;
  lightLevel: number;
  transparent?: boolean;
}

/**
 * Manages materials for the WebGL renderer
 */
export class MaterialSystem {
  private textureManager: WebGLTextureManager;
  private materialCache: Map<string, THREE.Material> = new Map();
  private missingTexture: THREE.Texture;

  constructor(textureManager: WebGLTextureManager) {
    this.textureManager = textureManager;

    // Create a default "missing texture" pattern
    this.missingTexture = this.createMissingTexture();
  }

  /**
   * Create a missing texture pattern (purple/black checkerboard)
   */
  private createMissingTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    const squareSize = 8;
    for (let y = 0; y < 64; y += squareSize) {
      for (let x = 0; x < 64; x += squareSize) {
        const isEven = ((x / squareSize) + (y / squareSize)) % 2 === 0;
        ctx.fillStyle = isEven ? '#FF00FF' : '#000000';
        ctx.fillRect(x, y, squareSize, squareSize);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    return texture;
  }

  /**
   * Get material cache key
   */
  private getMaterialKey(key: MaterialKey): string {
    return `${key.textureName}_${key.lightLevel}_${key.transparent ? 'trans' : 'solid'}`;
  }

  /**
   * Create material for a wall
   */
  createWallMaterial(sidedef: Sidedef, sector: Sector, textureName?: string): THREE.Material {
    const actualTextureName = textureName || sidedef.middleTexture || sidedef.upperTexture || sidedef.lowerTexture;

    if (!actualTextureName || actualTextureName === '-') {
      // No texture, use light-colored material
      return this.createSolidColorMaterial(sector.lightLevel);
    }

    const materialKey: MaterialKey = {
      textureName: actualTextureName,
      lightLevel: sector.lightLevel,
      transparent: false
    };

    const cacheKey = this.getMaterialKey(materialKey);

    // Check cache
    if (this.materialCache.has(cacheKey)) {
      return this.materialCache.get(cacheKey)!;
    }

    // Get texture
    let texture = this.textureManager.getTexture(actualTextureName);
    if (!texture) {
      console.warn(`Texture not found: ${actualTextureName}, using missing texture`);
      texture = this.missingTexture;
    }

    // Calculate light intensity (DOOM light levels are 0-255)
    const lightIntensity = sector.lightLevel / 255;

    // Create material
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
      metalness: 0,
      roughness: 1,
      emissive: new THREE.Color(lightIntensity, lightIntensity, lightIntensity),
      emissiveIntensity: 0.3,
      transparent: false,
      alphaTest: 0.5
    });

    // Cache material
    this.materialCache.set(cacheKey, material);

    return material;
  }

  /**
   * Create material for floor or ceiling
   */
  createFloorCeilingMaterial(sector: Sector, textureName: string, isFloor: boolean): THREE.Material {
    if (!textureName || textureName === '-') {
      return this.createSolidColorMaterial(sector.lightLevel);
    }

    const materialKey: MaterialKey = {
      textureName: `flat_${textureName}`,
      lightLevel: sector.lightLevel,
      transparent: false
    };

    const cacheKey = this.getMaterialKey(materialKey);

    // Check cache
    if (this.materialCache.has(cacheKey)) {
      return this.materialCache.get(cacheKey)!;
    }

    // Get flat texture
    let texture = this.textureManager.getFlat(textureName);
    if (!texture) {
      console.warn(`Flat texture not found: ${textureName}, using missing texture`);
      texture = this.missingTexture;
    }

    // Calculate light intensity
    const lightIntensity = sector.lightLevel / 255;

    // Sky texture special handling
    if (textureName.startsWith('F_SKY')) {
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.2, 0.4, 0.8), // Sky blue
        side: THREE.DoubleSide
      });
      this.materialCache.set(cacheKey, material);
      return material;
    }

    // Create material
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
      metalness: 0,
      roughness: 1,
      emissive: new THREE.Color(lightIntensity, lightIntensity, lightIntensity),
      emissiveIntensity: 0.3
    });

    // Adjust UV repeat for 64x64 flat textures
    if (texture && texture.repeat) {
      texture.repeat.set(1 / 64, 1 / 64);
    }

    // Cache material
    this.materialCache.set(cacheKey, material);

    return material;
  }

  /**
   * Create a solid color material (for missing textures)
   */
  private createSolidColorMaterial(lightLevel: number): THREE.Material {
    const lightIntensity = lightLevel / 255;
    const color = new THREE.Color(lightIntensity, lightIntensity, lightIntensity);

    return new THREE.MeshStandardMaterial({
      color,
      side: THREE.DoubleSide,
      metalness: 0,
      roughness: 1
    });
  }

  /**
   * Apply material to mesh based on user data
   */
  applyMaterialToMesh(mesh: THREE.Mesh): void {
    const userData = mesh.userData;

    if (userData.type === 'wall') {
      const sidedef = userData.sidedef as Sidedef;
      const sector = userData.sector as Sector;
      mesh.material = this.createWallMaterial(sidedef, sector);
    } else if (userData.type === 'floor') {
      const sector = userData.sector as Sector;
      mesh.material = this.createFloorCeilingMaterial(sector, sector.floorTexture, true);
    } else if (userData.type === 'ceiling') {
      const sector = userData.sector as Sector;
      mesh.material = this.createFloorCeilingMaterial(sector, sector.ceilingTexture, false);
    }
  }

  /**
   * Update material lighting (for dynamic lighting)
   */
  updateSectorLighting(sectorIndex: number, lightLevel: number): void {
    // Find all materials for this sector and update them
    // This is a simplified version - in practice, you'd need to track which materials belong to which sector
    for (const [key, material] of this.materialCache.entries()) {
      if (material instanceof THREE.MeshStandardMaterial) {
        // Update emissive based on new light level
        const lightIntensity = lightLevel / 255;
        material.emissive.setRGB(lightIntensity, lightIntensity, lightIntensity);
        material.needsUpdate = true;
      }
    }
  }

  /**
   * Clear cache and dispose of materials
   */
  dispose(): void {
    for (const material of this.materialCache.values()) {
      material.dispose();
    }
    this.materialCache.clear();
    this.missingTexture.dispose();
  }
}

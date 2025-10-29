/**
 * WebGL Texture Manager
 * Converts DOOM textures to Three.js textures
 */

import * as THREE from 'three';
import type { WadFile } from '@web-doom/wad';
import { TextureManager } from '../../graphics/texture-manager';

/**
 * Manages WebGL textures for the renderer
 */
export class WebGLTextureManager {
  private textureManager: TextureManager;
  private textureCache: Map<string, THREE.Texture> = new Map();
  private renderer: THREE.WebGLRenderer;

  constructor(wad: WadFile, renderer: THREE.WebGLRenderer) {
    this.textureManager = new TextureManager(wad);
    this.renderer = renderer;
  }

  /**
   * Get or create a WebGL texture from a texture name
   */
  getTexture(name: string): THREE.Texture | null {
    // Check cache first
    if (this.textureCache.has(name)) {
      return this.textureCache.get(name)!;
    }

    // Try to load from texture manager
    const textureData = this.textureManager.getTexture(name);
    if (!textureData) {
      return null;
    }

    // Convert canvas to Three.js texture
    const texture = new THREE.CanvasTexture(textureData.canvas);

    // Configure texture settings for DOOM-style rendering
    texture.magFilter = THREE.NearestFilter; // Pixelated look
    texture.minFilter = THREE.NearestFilter; // Pixelated look
    texture.wrapS = THREE.RepeatWrapping; // Repeat horizontally
    texture.wrapT = THREE.RepeatWrapping; // Repeat vertically
    texture.colorSpace = THREE.SRGBColorSpace;

    // Cache the texture
    this.textureCache.set(name, texture);

    return texture;
  }

  /**
   * Get or create a WebGL texture for a flat (floor/ceiling)
   */
  getFlat(name: string): THREE.Texture | null {
    // Check cache first
    const cacheKey = `flat_${name}`;
    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }

    // Try to load from texture manager
    const flatData = this.textureManager.getFlat(name);
    if (!flatData) {
      return null;
    }

    // Convert canvas to Three.js texture
    const texture = new THREE.CanvasTexture(flatData.canvas);

    // Configure texture settings
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    // Cache the texture
    this.textureCache.set(cacheKey, texture);

    return texture;
  }

  /**
   * Create a colored texture (for missing textures or special cases)
   */
  createColorTexture(color: THREE.Color): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    ctx.fillStyle = `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})`;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;

    return texture;
  }

  /**
   * Preload common textures
   */
  async preloadCommonTextures(): Promise<void> {
    await this.textureManager.preloadCommonTextures();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { textures: number } {
    return {
      textures: this.textureCache.size
    };
  }

  /**
   * Clear cache and dispose of textures
   */
  dispose(): void {
    // Dispose all cached textures
    for (const texture of this.textureCache.values()) {
      texture.dispose();
    }
    this.textureCache.clear();
    this.textureManager.dispose();
  }
}

/**
 * Texture Manager
 * Handles loading and caching of textures and flats from WAD files
 */

import type { WadFile } from '@web-doom/wad';
import {
  findLump,
  decodePicture,
  pictureToCanvas,
  parsePaletteFromPLAYPAL,
  DEFAULT_DOOM_PALETTE,
} from '@web-doom/wad';

/**
 * Texture/Flat entry with canvas
 */
export interface TextureData {
  name: string;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

/**
 * Texture Manager for handling WAD graphics
 */
export class TextureManager {
  private wad: WadFile;
  private palette: [number, number, number][];
  private textureCache: Map<string, TextureData> = new Map();
  private flatCache: Map<string, TextureData> = new Map();

  constructor(wad: WadFile) {
    this.wad = wad;
    this.palette = this.loadPalette();
  }

  /**
   * Load the color palette from WAD
   */
  private loadPalette(): [number, number, number][] {
    const playpalLump = findLump(this.wad, 'PLAYPAL');
    if (playpalLump) {
      try {
        return parsePaletteFromPLAYPAL(playpalLump.data);
      } catch (error) {
        console.warn('Failed to parse PLAYPAL, using default palette:', error);
      }
    }
    return DEFAULT_DOOM_PALETTE;
  }

  /**
   * Get a texture by name (walls, sprites, etc.)
   */
  getTexture(name: string): TextureData | null {
    // Check cache first
    if (this.textureCache.has(name)) {
      return this.textureCache.get(name)!;
    }

    // Try to load from WAD
    const texture = this.loadTexture(name);
    if (texture) {
      this.textureCache.set(name, texture);
      return texture;
    }

    return null;
  }

  /**
   * Get a flat by name (floors, ceilings)
   */
  getFlat(name: string): TextureData | null {
    // Check cache first
    if (this.flatCache.has(name)) {
      return this.flatCache.get(name)!;
    }

    // Try to load from WAD
    const flat = this.loadFlat(name);
    if (flat) {
      this.flatCache.set(name, flat);
      return flat;
    }

    return null;
  }

  /**
   * Load texture from WAD
   */
  private loadTexture(name: string): TextureData | null {
    const lump = findLump(this.wad, name);
    if (!lump) {
      return null;
    }

    try {
      // Try to decode as DOOM picture format
      const picture = decodePicture(lump.data);
      const canvas = pictureToCanvas(picture, {
        palette: this.palette,
        backgroundColor: [0, 0, 0, 0], // Transparent background
      });

      return {
        name,
        canvas,
        width: canvas.width,
        height: canvas.height,
      };
    } catch (error) {
      console.warn(`Failed to load texture ${name}:`, error);
      return null;
    }
  }

  /**
   * Load flat from WAD
   * Flats are 64x64 raw paletted images
   */
  private loadFlat(name: string): TextureData | null {
    const lump = findLump(this.wad, name);
    if (!lump) {
      return null;
    }

    try {
      // Flats are raw 64x64 pixel data
      const data = new Uint8Array(lump.data);
      if (data.length !== 64 * 64) {
        console.warn(`Invalid flat size for ${name}: ${data.length}`);
        return null;
      }

      // Create canvas from flat data
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get 2D context');
      }

      const imageData = ctx.createImageData(64, 64);
      const pixels = imageData.data;

      for (let i = 0; i < data.length; i++) {
        const paletteIndex = data[i];
        const color = this.palette[paletteIndex] || [0, 0, 0];
        const offset = i * 4;

        pixels[offset] = color[0]; // R
        pixels[offset + 1] = color[1]; // G
        pixels[offset + 2] = color[2]; // B
        pixels[offset + 3] = 255; // A (flats are always opaque)
      }

      ctx.putImageData(imageData, 0, 0);

      return {
        name,
        canvas,
        width: 64,
        height: 64,
      };
    } catch (error) {
      console.warn(`Failed to load flat ${name}:`, error);
      return null;
    }
  }

  /**
   * Preload common textures
   */
  async preloadCommonTextures(): Promise<void> {
    const commonTextures = [
      // Common wall textures
      'STARTAN3',
      'STARG3',
      'STONE2',
      'STONE3',
      'BROWN1',
      'BROWN96',
      'BROWNGRN',
      'COMP2',
      'COMPBLUE',
      'DOOR1',
      'DOOR3',
      'DOORSTOP',
      'EXITDOOR',
      'EXITSIGN',
      'GRAY1',
      'GRAY4',
      'GRAY5',
      'GRAY7',
      'ICKWALL1',
      'LITE3',
      'LITE5',
      'METAL',
      'METAL2',
      'METAL3',
      'METAL5',
      'METAL6',
      'MIDGRATE',
      'MIDSPACE',
      'PIPE2',
      'PIPE4',
      'SILVER1',
      'SILVER2',
      'SILVER3',
      'SLADWALL',
      'STEP1',
      'STEP4',
      'STEPLAD1',
      'SUPPORT2',
      'SUPPORT3',
      'SW1BRCOM',
      'SW1DIRT',
      'SW1METAL',
      'SW1STONE',
      'SW1STRTN',
      'TEKWALL1',
      'TEKWALL4',
    ];

    const commonFlats = [
      // Common floor/ceiling textures
      'FLOOR0_1',
      'FLOOR0_3',
      'FLOOR0_5',
      'FLOOR0_6',
      'FLOOR1_1',
      'FLOOR3_3',
      'FLOOR4_1',
      'FLOOR4_5',
      'FLOOR4_6',
      'FLOOR4_8',
      'FLOOR5_1',
      'FLOOR5_2',
      'FLOOR5_3',
      'FLOOR5_4',
      'FLOOR6_1',
      'FLOOR6_2',
      'FLOOR7_1',
      'FLOOR7_2',
      'MFLR8_1',
      'MFLR8_2',
      'MFLR8_3',
      'MFLR8_4',
      'CEIL1_1',
      'CEIL3_1',
      'CEIL3_3',
      'CEIL3_5',
      'CEIL4_1',
      'CEIL4_2',
      'CEIL4_3',
      'CEIL5_1',
      'CEIL5_2',
      'F_SKY1',
    ];

    // Load textures
    for (const name of commonTextures) {
      this.getTexture(name);
    }

    // Load flats
    for (const name of commonFlats) {
      this.getFlat(name);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { textures: number; flats: number } {
    return {
      textures: this.textureCache.size,
      flats: this.flatCache.size,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.textureCache.clear();
    this.flatCache.clear();
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.clearCache();
  }
}

/**
 * Sprite Manager
 * Handles loading and caching of sprites from WAD files
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
 * Sprite data with metadata
 */
export interface SpriteData {
  name: string;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  leftOffset: number;
  topOffset: number;
}

/**
 * Sprite frame information
 */
export interface SpriteFrame {
  name: string;
  rotation: number; // 0 = no rotation, 1-8 = specific angle
  frame: string; // Frame letter (A, B, C, etc.)
}

/**
 * Sprite Manager for handling sprite graphics
 */
export class SpriteManager {
  private wad: WadFile;
  private palette: [number, number, number][];
  private spriteCache: Map<string, SpriteData> = new Map();

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
   * Get a sprite by name
   * Name format: XXXXYZ where:
   *   XXXX = 4 character sprite name
   *   Y = frame letter (A-Z)
   *   Z = rotation (0-8, 0 = all rotations)
   */
  getSprite(name: string): SpriteData | null {
    // Check cache first
    if (this.spriteCache.has(name)) {
      return this.spriteCache.get(name)!;
    }

    // Try to load from WAD
    const sprite = this.loadSprite(name);
    if (sprite) {
      this.spriteCache.set(name, sprite);
      return sprite;
    }

    return null;
  }

  /**
   * Load sprite from WAD
   */
  private loadSprite(name: string): SpriteData | null {
    const lump = findLump(this.wad, name);
    if (!lump) {
      return null;
    }

    try {
      // Decode as DOOM picture format
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
        leftOffset: picture.header.leftOffset,
        topOffset: picture.header.topOffset,
      };
    } catch (error) {
      console.warn(`Failed to load sprite ${name}:`, error);
      return null;
    }
  }

  /**
   * Get sprite frame name for a given sprite, frame, and rotation
   * @param spriteName Base sprite name (4 characters, e.g., "TROO")
   * @param frame Frame letter (e.g., "A")
   * @param rotation Rotation angle (0-7, where 0 = no rotation)
   */
  getSpriteFrameName(spriteName: string, frame: string, rotation: number): string {
    // Normalize sprite name to 4 characters
    const baseName = spriteName.padEnd(4, ' ').slice(0, 4);

    // Try specific rotation first
    if (rotation > 0) {
      const specific = `${baseName}${frame}${rotation}`;
      if (this.hasSprite(specific)) {
        return specific;
      }
    }

    // Try rotation 0 (all angles)
    const allAngles = `${baseName}${frame}0`;
    if (this.hasSprite(allAngles)) {
      return allAngles;
    }

    // Fallback to just the base with frame
    return `${baseName}${frame}`;
  }

  /**
   * Check if a sprite exists
   */
  hasSprite(name: string): boolean {
    if (this.spriteCache.has(name)) {
      return true;
    }
    return findLump(this.wad, name) !== null;
  }

  /**
   * Preload common sprites
   */
  async preloadCommonSprites(): Promise<void> {
    const commonSprites = [
      // Player sprites
      'PLAYA0',
      'PLAYB0',
      'PLAYC0',
      'PLAYD0',

      // Imp sprites
      'TROOA1',
      'TROOA2',
      'TROOA3',
      'TROOA4',
      'TROOA5',
      'TROOB1',
      'TROOC1',
      'TROOD1',

      // Former human sprites
      'POSSA1',
      'POSSA2',
      'POSSA3',
      'POSSA4',
      'POSSA5',
      'POSSB1',
      'POSSC1',
      'POSSD1',

      // Demon sprites
      'SARGA1',
      'SARGA2',
      'SARGA3',
      'SARGA4',
      'SARGA5',
      'SARGB1',
      'SARGC1',
      'SARGD1',

      // Item sprites
      'CLIPA0',
      'SHELLA0',
      'ROCKA0',
      'CELLA0',
      'AMMOA0',
      'SBOXA0',
      'BROKA0',
      'CELLA0',
      'STIMA0',
      'MEDIA0',
      'BON1A0',
      'BON1B0',
      'BON1C0',
      'BON1D0',
      'ARM1A0',
      'ARM1B0',
      'ARM2A0',
      'ARM2B0',

      // Weapon sprites
      'SHOTA0',
      'SGN2A0',
      'MGUNA0',
      'LAUNA0',
      'PLASA0',
      'BFUGA0',
      'CSAWA0',

      // Key sprites
      'BKEYA0',
      'BKEYB0',
      'YKEYA0',
      'YKEYB0',
      'RKEYA0',
      'RKEYB0',
      'BSKUA0',
      'BSKUB0',
      'YSKUA0',
      'YSKUB0',
      'RSKUA0',
      'RSKUB0',
    ];

    for (const name of commonSprites) {
      this.getSprite(name);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { sprites: number } {
    return {
      sprites: this.spriteCache.size,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.spriteCache.clear();
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.clearCache();
  }
}

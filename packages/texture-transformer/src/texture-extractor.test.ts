/**
 * Tests for texture extraction
 */

import { describe, it, expect } from 'vitest';
import { determineCategory, isPictureLump } from './texture-extractor';
import { TextureCategory } from './types';

describe('determineCategory', () => {
  it('should categorize sprite textures', () => {
    expect(determineCategory('TROO')).toBe(TextureCategory.SPRITE);
    expect(determineCategory('TROOA1')).toBe(TextureCategory.SPRITE);
    expect(determineCategory('PLAY')).toBe(TextureCategory.SPRITE);
    expect(determineCategory('PLAYA1')).toBe(TextureCategory.SPRITE);
  });

  it('should categorize HUD textures', () => {
    expect(determineCategory('STBAR')).toBe(TextureCategory.HUD);
    expect(determineCategory('STFST01')).toBe(TextureCategory.HUD);
  });

  it('should categorize menu textures', () => {
    expect(determineCategory('M_DOOM')).toBe(TextureCategory.MENU);
    expect(determineCategory('M_NEWG')).toBe(TextureCategory.MENU);
  });

  it('should categorize wall textures', () => {
    expect(determineCategory('WALL00_1')).toBe(TextureCategory.WALL);
    expect(determineCategory('DOOR1')).toBe(TextureCategory.WALL);
    expect(determineCategory('STEP1')).toBe(TextureCategory.WALL);
  });

  it('should default to OTHER for unknown textures', () => {
    expect(determineCategory('UNKNOWN')).toBe(TextureCategory.OTHER);
    expect(determineCategory('TEST')).toBe(TextureCategory.OTHER);
  });
});

describe('isPictureLump', () => {
  it('should reject lumps that are too small', () => {
    const smallLump = {
      name: 'TEST',
      data: new ArrayBuffer(8),
      filepos: 0,
      size: 8,
    };
    expect(isPictureLump(smallLump)).toBe(false);
  });

  it('should reject lumps with invalid dimensions', () => {
    const buffer = new ArrayBuffer(16);
    const view = new DataView(buffer);
    view.setInt16(0, 0, true); // width = 0
    view.setInt16(2, 64, true); // height = 64

    const invalidLump = {
      name: 'TEST',
      data: buffer,
      filepos: 0,
      size: 16,
    };
    expect(isPictureLump(invalidLump)).toBe(false);
  });

  it('should accept lumps with valid dimensions', () => {
    const buffer = new ArrayBuffer(32);
    const view = new DataView(buffer);
    view.setInt16(0, 64, true); // width = 64
    view.setInt16(2, 64, true); // height = 64

    const validLump = {
      name: 'TEST',
      data: buffer,
      filepos: 0,
      size: 32,
    };
    expect(isPictureLump(validLump)).toBe(true);
  });
});

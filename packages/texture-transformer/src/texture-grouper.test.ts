/**
 * Tests for texture grouping
 */

import { describe, it, expect } from 'vitest';
import {
  getCategoryDescription,
  buildTransformPrompt,
  groupTexturesByCategory,
  groupTexturesByPrefix,
} from './texture-grouper';
import { TextureCategory } from './types';
import type { ExtractedTexture } from './types';

describe('getCategoryDescription', () => {
  it('should return descriptions for all categories', () => {
    expect(getCategoryDescription(TextureCategory.SPRITE)).toContain('sprites');
    expect(getCategoryDescription(TextureCategory.WALL)).toContain('wall');
    expect(getCategoryDescription(TextureCategory.FLAT)).toContain('floor');
    expect(getCategoryDescription(TextureCategory.HUD)).toContain('HUD');
  });
});

describe('buildTransformPrompt', () => {
  it('should build prompt for sprite textures', () => {
    const texture: ExtractedTexture = {
      name: 'TROOA1',
      imageData: '',
      width: 64,
      height: 64,
      category: TextureCategory.SPRITE,
    };

    const prompt = buildTransformPrompt(texture);
    expect(prompt).toContain('TROOA1');
    expect(prompt).toContain('sprite');
    expect(prompt).toContain('64x64');
  });

  it('should include custom style', () => {
    const texture: ExtractedTexture = {
      name: 'TEST',
      imageData: '',
      width: 32,
      height: 32,
      category: TextureCategory.WALL,
    };

    const prompt = buildTransformPrompt(texture, 'with cyberpunk style');
    expect(prompt).toContain('cyberpunk');
  });
});

describe('groupTexturesByCategory', () => {
  it('should group textures by category', () => {
    const textures: ExtractedTexture[] = [
      {
        name: 'TROOA1',
        imageData: '',
        width: 64,
        height: 64,
        category: TextureCategory.SPRITE,
      },
      {
        name: 'TROOA2',
        imageData: '',
        width: 64,
        height: 64,
        category: TextureCategory.SPRITE,
      },
      {
        name: 'WALL01',
        imageData: '',
        width: 128,
        height: 128,
        category: TextureCategory.WALL,
      },
    ];

    const groups = groupTexturesByCategory(textures);
    expect(groups).toHaveLength(2);

    const spriteGroup = groups.find(g => g.category === TextureCategory.SPRITE);
    expect(spriteGroup?.textures).toHaveLength(2);

    const wallGroup = groups.find(g => g.category === TextureCategory.WALL);
    expect(wallGroup?.textures).toHaveLength(1);
  });
});

describe('groupTexturesByPrefix', () => {
  it('should group textures by name prefix', () => {
    const textures: ExtractedTexture[] = [
      {
        name: 'TROOA1',
        imageData: '',
        width: 64,
        height: 64,
        category: TextureCategory.SPRITE,
      },
      {
        name: 'TROOA2',
        imageData: '',
        width: 64,
        height: 64,
        category: TextureCategory.SPRITE,
      },
      {
        name: 'PLAYA1',
        imageData: '',
        width: 64,
        height: 64,
        category: TextureCategory.SPRITE,
      },
    ];

    const groups = groupTexturesByPrefix(textures, 4);
    expect(groups.size).toBe(2);
    expect(groups.get('TROO')).toHaveLength(2);
    expect(groups.get('PLAY')).toHaveLength(1);
  });
});

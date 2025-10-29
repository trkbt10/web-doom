/**
 * Tests for type definitions
 */

import { describe, it, expect } from 'vitest';
import { TextureCategory } from './types';

describe('TextureCategory', () => {
  it('should have all expected categories', () => {
    expect(TextureCategory.SPRITE).toBe('sprite');
    expect(TextureCategory.WALL).toBe('wall');
    expect(TextureCategory.FLAT).toBe('flat');
    expect(TextureCategory.PATCH).toBe('patch');
    expect(TextureCategory.HUD).toBe('hud');
    expect(TextureCategory.MENU).toBe('menu');
    expect(TextureCategory.OTHER).toBe('other');
  });
});

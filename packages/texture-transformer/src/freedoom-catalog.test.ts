/**
 * Tests for Freedoom catalog
 */

import { describe, it, expect } from 'vitest';
import {
  FREEDOOM_CATALOG,
  getCatalogEntry,
  getCatalogByCategory,
  buildCatalogPrompt,
} from './freedoom-catalog';
import { TextureCategory } from './types';

describe('FREEDOOM_CATALOG', () => {
  it('should contain catalog entries', () => {
    expect(FREEDOOM_CATALOG.length).toBeGreaterThan(0);
  });

  it('should have valid entries', () => {
    const entry = FREEDOOM_CATALOG[0];
    expect(entry).toHaveProperty('name');
    expect(entry).toHaveProperty('category');
    expect(entry).toHaveProperty('description');
  });
});

describe('getCatalogEntry', () => {
  it('should find entry by exact name', () => {
    const entry = getCatalogEntry('PLAY');
    expect(entry).toBeDefined();
    expect(entry?.name).toBe('PLAY');
  });

  it('should find entry by prefix', () => {
    const entry = getCatalogEntry('PLAYA1');
    expect(entry).toBeDefined();
    expect(entry?.name).toBe('PLAY');
  });

  it('should return undefined for unknown textures', () => {
    const entry = getCatalogEntry('UNKNOWN123');
    expect(entry).toBeUndefined();
  });

  it('should be case insensitive', () => {
    const entry = getCatalogEntry('play');
    expect(entry).toBeDefined();
  });
});

describe('getCatalogByCategory', () => {
  it('should filter by category', () => {
    const sprites = getCatalogByCategory(TextureCategory.SPRITE);
    expect(sprites.length).toBeGreaterThan(0);
    expect(sprites.every(e => e.category === TextureCategory.SPRITE)).toBe(true);
  });

  it('should return empty array for category with no entries', () => {
    const other = getCatalogByCategory(TextureCategory.OTHER);
    expect(other).toEqual([]);
  });
});

describe('buildCatalogPrompt', () => {
  it('should build prompt from catalog entry', () => {
    const prompt = buildCatalogPrompt('PLAY');
    expect(prompt).toBeDefined();
    expect(prompt).toContain('sprite');
  });

  it('should include custom style', () => {
    const prompt = buildCatalogPrompt('PLAY', 'cyberpunk style');
    expect(prompt).toContain('cyberpunk');
  });

  it('should return undefined for unknown textures', () => {
    const prompt = buildCatalogPrompt('UNKNOWN123');
    expect(prompt).toBeUndefined();
  });
});

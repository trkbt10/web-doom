/**
 * Tests for image transformation
 */

import { describe, it, expect } from 'vitest';
import { prepareImageForGemini } from './image-transformer';

describe('prepareImageForGemini', () => {
  it('should parse valid data URL', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const result = prepareImageForGemini(dataUrl);

    expect(result.mimeType).toBe('image/png');
    expect(result.data).toBe('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
  });

  it('should throw error for invalid data URL', () => {
    expect(() => prepareImageForGemini('invalid')).toThrow();
    expect(() => prepareImageForGemini('data:image/png')).toThrow();
  });

  it('should handle different mime types', () => {
    const jpegUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    const result = prepareImageForGemini(jpegUrl);

    expect(result.mimeType).toBe('image/jpeg');
    expect(result.data).toBe('/9j/4AAQSkZJRg==');
  });
});

/**
 * Tests for DOOM Picture Format decoder
 */

import { describe, it, expect } from 'vitest';
import { decodePicture, decodePictureHeader, decodePictureColumn } from './picture';

describe('DOOM Picture Format', () => {
  describe('decodePictureHeader', () => {
    it('should decode valid header', () => {
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setInt16(0, 64, true); // width
      view.setInt16(2, 64, true); // height
      view.setInt16(4, 32, true); // leftOffset
      view.setInt16(6, 32, true); // topOffset

      const header = decodePictureHeader(buffer);
      expect(header.width).toBe(64);
      expect(header.height).toBe(64);
      expect(header.leftOffset).toBe(32);
      expect(header.topOffset).toBe(32);
    });

    it('should throw error for buffer too small', () => {
      const buffer = new ArrayBuffer(4); // Too small
      expect(() => decodePictureHeader(buffer)).toThrow();
    });
  });

  describe('decodePictureColumn', () => {
    it('should decode valid column', () => {
      // Create a simple column with one post
      const buffer = new ArrayBuffer(100);
      const view = new DataView(buffer);
      const uint8 = new Uint8Array(buffer);

      const offset = 10;
      uint8[offset] = 0; // topdelta
      uint8[offset + 1] = 4; // length
      uint8[offset + 2] = 0; // padding
      uint8[offset + 3] = 1; // pixel 0
      uint8[offset + 4] = 2; // pixel 1
      uint8[offset + 5] = 3; // pixel 2
      uint8[offset + 6] = 4; // pixel 3
      uint8[offset + 7] = 0; // padding
      uint8[offset + 8] = 0xFF; // end marker

      const column = decodePictureColumn(buffer, offset);
      expect(column).toHaveLength(1);
      expect(column[0].topdelta).toBe(0);
      expect(column[0].pixels).toHaveLength(4);
    });

    it('should handle column offset beyond buffer bounds', () => {
      const buffer = new ArrayBuffer(10);
      const offset = 20; // Beyond buffer

      // Should throw or return empty array instead of causing DataView error
      expect(() => {
        decodePictureColumn(buffer, offset);
      }).toThrow(/out of bounds|outside the bounds/i);
    });

    it('should handle malformed column data', () => {
      const buffer = new ArrayBuffer(20);
      const view = new DataView(buffer);
      const uint8 = new Uint8Array(buffer);

      // Create malformed column that extends beyond buffer
      const offset = 0;
      uint8[offset] = 0; // topdelta
      uint8[offset + 1] = 50; // length > remaining buffer
      uint8[offset + 2] = 0; // padding

      expect(() => {
        decodePictureColumn(buffer, offset);
      }).toThrow(/beyond buffer bounds|out of bounds|outside the bounds|Invalid typed array length/i);
    });
  });

  describe('decodePicture', () => {
    it('should decode valid picture', () => {
      // Create a minimal valid picture (1x1 pixel)
      const width = 1;
      const height = 1;

      // Calculate buffer size: header (8) + column offsets (width * 4) + column data
      const columnData = new Uint8Array([
        0, // topdelta
        1, // length
        0, // padding
        5, // pixel value
        0, // padding
        0xFF, // end marker
      ]);

      const buffer = new ArrayBuffer(8 + width * 4 + columnData.length);
      const view = new DataView(buffer);
      const uint8 = new Uint8Array(buffer);

      // Write header
      view.setInt16(0, width, true);
      view.setInt16(2, height, true);
      view.setInt16(4, 0, true); // leftOffset
      view.setInt16(6, 0, true); // topOffset

      // Write column offset
      const columnOffset = 8 + width * 4;
      view.setUint32(8, columnOffset, true);

      // Write column data
      uint8.set(columnData, columnOffset);

      const picture = decodePicture(buffer);
      expect(picture.header.width).toBe(width);
      expect(picture.header.height).toBe(height);
      expect(picture.columns).toHaveLength(1);
      expect(picture.pixels[0][0]).toBe(5);
    });

    it('should throw error for buffer too small for header', () => {
      const buffer = new ArrayBuffer(4); // Too small for header
      expect(() => decodePicture(buffer)).toThrow();
    });

    it('should throw error for buffer too small for column offsets', () => {
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setInt16(0, 10, true); // width = 10
      view.setInt16(2, 10, true); // height
      // Buffer is too small to contain 10 column offsets (need 8 + 10*4 = 48 bytes)

      expect(() => decodePicture(buffer)).toThrow(/too small|out of bounds|outside the bounds/i);
    });

    it('should throw error for invalid column offset', () => {
      const width = 1;
      const buffer = new ArrayBuffer(8 + width * 4);
      const view = new DataView(buffer);

      // Write header
      view.setInt16(0, width, true);
      view.setInt16(2, 10, true); // height
      view.setInt16(4, 0, true);
      view.setInt16(6, 0, true);

      // Write invalid column offset (beyond buffer)
      view.setUint32(8, 1000, true);

      expect(() => decodePicture(buffer)).toThrow(/Invalid column offset|out of bounds|outside the bounds/i);
    });

    it('should handle zero width picture', () => {
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setInt16(0, 0, true); // width = 0
      view.setInt16(2, 10, true); // height

      const picture = decodePicture(buffer);
      expect(picture.columns).toHaveLength(0);
      expect(picture.pixels).toHaveLength(10);
    });

    it('should handle zero height picture', () => {
      const buffer = new ArrayBuffer(8 + 4 + 1);
      const view = new DataView(buffer);
      const uint8 = new Uint8Array(buffer);

      view.setInt16(0, 1, true); // width = 1
      view.setInt16(2, 0, true); // height = 0
      view.setUint32(8, 12, true); // column offset
      uint8[12] = 0xFF; // empty column

      const picture = decodePicture(buffer);
      expect(picture.pixels).toHaveLength(0);
    });
  });
});

/**
 * Tests for Canvas Capture Functionality
 * Tests Web Standard APIs: toBlob, toDataURL, captureStream
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Canvas Capture Web Standards', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 320, 200);
    }
  });

  describe('toBlob API', () => {
    it('should capture canvas as PNG blob', (done) => {
      canvas.toBlob((blob) => {
        expect(blob).not.toBeNull();
        expect(blob?.type).toBe('image/png');
        expect(blob?.size).toBeGreaterThan(0);
        done();
      }, 'image/png');
    });

    it('should capture canvas as JPEG blob', (done) => {
      canvas.toBlob((blob) => {
        expect(blob).not.toBeNull();
        expect(blob?.type).toBe('image/jpeg');
        expect(blob?.size).toBeGreaterThan(0);
        done();
      }, 'image/jpeg', 0.95);
    });
  });

  describe('toDataURL API', () => {
    it('should capture canvas as PNG data URL', () => {
      const dataUrl = canvas.toDataURL('image/png');
      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
      expect(dataUrl.length).toBeGreaterThan(100);
    });

    it('should capture canvas as JPEG data URL', () => {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      expect(dataUrl).toMatch(/^data:image\/jpeg;base64,/);
      expect(dataUrl.length).toBeGreaterThan(100);
    });
  });

  describe('captureStream API', () => {
    it('should capture canvas as MediaStream', () => {
      // Mock captureStream if not available in test environment
      if (!canvas.captureStream) {
        canvas.captureStream = vi.fn(() => {
          return new MediaStream();
        });
      }

      const stream = canvas.captureStream(30);
      expect(stream).toBeInstanceOf(MediaStream);
    });

    it('should capture stream with specified frame rate', () => {
      if (!canvas.captureStream) {
        canvas.captureStream = vi.fn((frameRate?: number) => {
          const stream = new MediaStream();
          // Verify frameRate was passed
          expect(frameRate).toBe(30);
          return stream;
        });
      }

      const stream = canvas.captureStream(30);
      expect(stream).toBeInstanceOf(MediaStream);
    });
  });

  describe('Integration: Screenshot functionality', () => {
    it('should create downloadable blob from canvas', (done) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          done(new Error('Blob is null'));
          return;
        }

        // Create object URL
        const url = URL.createObjectURL(blob);
        expect(url).toMatch(/^blob:/);

        // Cleanup
        URL.revokeObjectURL(url);
        done();
      }, 'image/png');
    });
  });

  describe('Integration: Video recording functionality', () => {
    it('should setup MediaRecorder with canvas stream', () => {
      if (!canvas.captureStream) {
        canvas.captureStream = vi.fn(() => new MediaStream());
      }

      const stream = canvas.captureStream(30);

      // Mock MediaRecorder if not available
      if (typeof MediaRecorder === 'undefined') {
        (global as any).MediaRecorder = class MockMediaRecorder {
          ondataavailable: ((event: any) => void) | null = null;
          onstop: (() => void) | null = null;
          state = 'inactive';

          constructor(public stream: MediaStream, public options?: any) {}

          start() {
            this.state = 'recording';
          }

          stop() {
            this.state = 'inactive';
            if (this.onstop) this.onstop();
          }
        };
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });

      expect(recorder).toBeInstanceOf(MediaRecorder);
      expect(recorder.state).toBe('inactive');

      recorder.start();
      expect(recorder.state).toBe('recording');

      recorder.stop();
      expect(recorder.state).toBe('inactive');
    });
  });
});

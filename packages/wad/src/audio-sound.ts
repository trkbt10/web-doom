/**
 * DMX Sound Effect Decoder
 *
 * Decodes DOOM PC Speaker sound effects (DMX format)
 */

import type { DmxSound, DmxSoundHeader, AudioDecodeOptions } from './audio-types';

/**
 * Decode DMX sound effect header
 */
export function decodeSoundHeader(buffer: ArrayBuffer): DmxSoundHeader {
  if (buffer.byteLength < 8) {
    throw new Error('Invalid DMX sound: buffer too small for header');
  }

  const view = new DataView(buffer);

  // Read format identifier (2 bytes, little-endian)
  const format = view.getUint16(0, true);

  // Read sample rate (2 bytes, little-endian)
  const sampleRate = view.getUint16(2, true);

  // Read sample count (4 bytes, little-endian)
  const sampleCount = view.getUint32(4, true);

  return {
    format,
    sampleRate,
    sampleCount,
  };
}

/**
 * Decode DMX sound effect
 *
 * @param buffer - ArrayBuffer containing DMX sound data
 * @param options - Decode options
 * @returns Decoded sound data
 */
export function decodeSound(
  buffer: ArrayBuffer,
  options: AudioDecodeOptions = {}
): DmxSound {
  const { validate = true } = options;

  // Decode header
  const header = decodeSoundHeader(buffer);

  // Validate format
  if (validate) {
    if (header.format !== 3) {
      throw new Error(`Invalid DMX sound format: expected 3, got ${header.format}`);
    }

    const expectedSize = 8 + header.sampleCount;
    if (buffer.byteLength < expectedSize) {
      throw new Error(
        `Invalid DMX sound: expected ${expectedSize} bytes, got ${buffer.byteLength}`
      );
    }

    if (header.sampleRate === 0) {
      throw new Error('Invalid DMX sound: sample rate is zero');
    }

    if (header.sampleCount === 0) {
      throw new Error('Invalid DMX sound: sample count is zero');
    }
  }

  // Extract sample data (8-bit unsigned PCM, starting at offset 8)
  const samples = new Uint8Array(buffer, 8, header.sampleCount);

  return {
    header,
    samples,
  };
}

/**
 * Convert DMX sound samples to Float32Array for WebAudio
 *
 * Converts 8-bit unsigned PCM (0-255, 128=silence) to
 * 32-bit float PCM (-1.0 to 1.0, 0.0=silence)
 *
 * @param samples - 8-bit unsigned PCM samples
 * @returns 32-bit float PCM samples
 */
export function soundToFloat32(samples: Uint8Array): Float32Array {
  const float32 = new Float32Array(samples.length);

  for (let i = 0; i < samples.length; i++) {
    // Convert from unsigned 8-bit (0-255) to signed float (-1.0 to 1.0)
    // 128 (0x80) = silence = 0.0
    // 0 = -1.0
    // 255 = ~1.0
    float32[i] = (samples[i] - 128) / 128.0;
  }

  return float32;
}

/**
 * Get the duration of a DMX sound in seconds
 *
 * @param sound - DMX sound data
 * @returns Duration in seconds
 */
export function getSoundDuration(sound: DmxSound): number {
  return sound.header.sampleCount / sound.header.sampleRate;
}

/**
 * Check if a buffer contains a valid DMX sound
 *
 * @param buffer - Buffer to check
 * @returns True if the buffer appears to contain a DMX sound
 */
export function isSoundFormat(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 8) {
    return false;
  }

  try {
    const header = decodeSoundHeader(buffer);
    return (
      header.format === 3 &&
      header.sampleRate > 0 &&
      header.sampleCount > 0 &&
      buffer.byteLength >= 8 + header.sampleCount
    );
  } catch {
    return false;
  }
}

/**
 * DMX MUS Format Decoder
 *
 * Decodes DOOM music files (MUS format) and converts to MIDI-compatible events
 */

import type {
  MusHeader,
  MusFile,
  MusEvent,
  AudioDecodeOptions,
} from './audio-types';
import { MusEventType as EventType } from './audio-types';

/**
 * Decode MUS file header
 */
export function decodeMusHeader(buffer: ArrayBuffer): MusHeader {
  if (buffer.byteLength < 16) {
    throw new Error('Invalid MUS file: buffer too small for header');
  }

  const view = new DataView(buffer);
  const decoder = new TextDecoder('ascii');

  // Read magic "MUS\x1A" (4 bytes)
  const magicBytes = new Uint8Array(buffer, 0, 4);
  const magic = decoder.decode(magicBytes.slice(0, 3));

  if (magic !== 'MUS' || magicBytes[3] !== 0x1a) {
    throw new Error(`Invalid MUS magic: expected "MUS\\x1A", got "${magic}"`);
  }

  // Read score length (2 bytes, little-endian)
  const scoreLength = view.getUint16(4, true);

  // Read score start offset (2 bytes, little-endian)
  const scoreStart = view.getUint16(6, true);

  // Read primary channels (2 bytes, little-endian)
  const primaryChannels = view.getUint16(8, true);

  // Read secondary channels (2 bytes, little-endian)
  const secondaryChannels = view.getUint16(10, true);

  // Read instrument count (2 bytes, little-endian)
  const instrumentCount = view.getUint16(12, true);

  // Skip reserved (2 bytes)

  // Read instrument list
  const instruments: number[] = [];
  for (let i = 0; i < instrumentCount; i++) {
    const offset = 16 + i * 2;
    if (offset + 2 > buffer.byteLength) {
      throw new Error('Invalid MUS file: instrument list extends beyond buffer');
    }
    instruments.push(view.getUint16(offset, true));
  }

  return {
    magic: 'MUS\x1A',
    scoreLength,
    scoreStart,
    primaryChannels,
    secondaryChannels,
    instrumentCount,
    instruments,
  };
}

/**
 * Decode MUS events from score data
 */
export function decodeMusEvents(buffer: ArrayBuffer, header: MusHeader): MusEvent[] {
  const events: MusEvent[] = [];
  const view = new DataView(buffer);
  let offset = header.scoreStart;

  while (offset < buffer.byteLength) {
    if (offset >= buffer.byteLength) {
      break;
    }

    // Read event descriptor byte
    const descriptor = view.getUint8(offset++);

    // Extract event type (bits 4-6)
    const eventType = (descriptor >> 4) & 0x07;

    // Extract channel (bits 0-3)
    const channel = descriptor & 0x0f;

    // Check if last event in group (bit 7)
    const last = (descriptor & 0x80) !== 0;

    const data: number[] = [];

    // Read event data based on type
    switch (eventType) {
      case EventType.RELEASE_NOTE: {
        // Note number (1 byte)
        if (offset >= buffer.byteLength) break;
        data.push(view.getUint8(offset++));
        break;
      }

      case EventType.PLAY_NOTE: {
        // Note number (1 byte)
        if (offset >= buffer.byteLength) break;
        const note = view.getUint8(offset++);
        data.push(note & 0x7f);

        // Volume (optional, if bit 7 is set)
        if (note & 0x80) {
          if (offset >= buffer.byteLength) break;
          data.push(view.getUint8(offset++));
        }
        break;
      }

      case EventType.PITCH_WHEEL: {
        // Pitch wheel value (1 byte)
        if (offset >= buffer.byteLength) break;
        data.push(view.getUint8(offset++));
        break;
      }

      case EventType.SYSTEM: {
        // System event (1 byte)
        if (offset >= buffer.byteLength) break;
        data.push(view.getUint8(offset++));
        break;
      }

      case EventType.CONTROLLER: {
        // Controller number (1 byte)
        if (offset >= buffer.byteLength) break;
        const controller = view.getUint8(offset++);
        data.push(controller);

        // Controller value (1 byte)
        if (offset >= buffer.byteLength) break;
        data.push(view.getUint8(offset++));
        break;
      }

      case EventType.SCORE_END: {
        // No data for end event
        events.push({
          type: eventType,
          channel,
          data,
          delay: 0,
        });
        return events; // End of score
      }

      default:
        // Unknown event type, skip
        console.warn(`Unknown MUS event type: ${eventType}`);
        break;
    }

    // Read delay if this is the last event in the group
    let delay = 0;
    if (last) {
      // Read variable-length delay
      let delayByte: number;
      do {
        if (offset >= buffer.byteLength) break;
        delayByte = view.getUint8(offset++);
        delay = (delay << 7) | (delayByte & 0x7f);
      } while (delayByte & 0x80);
    }

    events.push({
      type: eventType,
      channel,
      data,
      delay,
    });
  }

  return events;
}

/**
 * Decode complete MUS file
 *
 * @param buffer - ArrayBuffer containing MUS file data
 * @param options - Decode options
 * @returns Decoded MUS file structure
 */
export function decodeMus(
  buffer: ArrayBuffer,
  options: AudioDecodeOptions = {}
): MusFile {
  const { validate = true } = options;

  // Decode header
  const header = decodeMusHeader(buffer);

  // Validate if requested
  if (validate) {
    if (header.scoreStart > buffer.byteLength) {
      throw new Error(
        'Invalid MUS file: score start offset beyond buffer length'
      );
    }

    if (header.scoreLength === 0) {
      throw new Error('Invalid MUS file: score length is zero');
    }
  }

  // Decode events
  const events = decodeMusEvents(buffer, header);

  return {
    header,
    events,
  };
}

/**
 * Check if a buffer contains a valid MUS file
 *
 * @param buffer - Buffer to check
 * @returns True if the buffer appears to contain a MUS file
 */
export function isMusFormat(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 16) {
    return false;
  }

  try {
    const decoder = new TextDecoder('ascii');
    const magicBytes = new Uint8Array(buffer, 0, 4);
    const magic = decoder.decode(magicBytes.slice(0, 3));
    return magic === 'MUS' && magicBytes[3] === 0x1a;
  } catch {
    return false;
  }
}

/**
 * MUS to MIDI note mapping
 * DOOM uses a different note numbering than standard MIDI
 */
export const MUS_TO_MIDI_NOTE_MAP: Record<number, number> = {
  0: 0, // C
  1: 1, // C#
  2: 2, // D
  3: 3, // D#
  4: 4, // E
  5: 5, // F
  6: 6, // F#
  7: 7, // G
  8: 8, // G#
  9: 9, // A
  10: 10, // A#
  11: 11, // B
};

/**
 * Convert MUS note to MIDI note
 *
 * @param musNote - MUS note number
 * @returns MIDI note number
 */
export function musNoteToMidi(musNote: number): number {
  // MUS notes are essentially the same as MIDI notes
  return musNote;
}

/**
 * Get MUS controller name
 *
 * @param controller - Controller number
 * @returns Controller name
 */
export function getMusControllerName(controller: number): string {
  const names: Record<number, string> = {
    0: 'Instrument',
    1: 'Bank Select',
    2: 'Modulation',
    3: 'Volume',
    4: 'Pan',
    5: 'Expression',
    6: 'Reverb',
    7: 'Chorus',
    8: 'Sustain',
    9: 'Soft Pedal',
  };

  return names[controller] || `Controller ${controller}`;
}

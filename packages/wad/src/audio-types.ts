/**
 * DOOM Audio Format Type Definitions
 *
 * Supports:
 * - DMX Sound Effects (PC Speaker sounds)
 * - DMX MUS Format (MIDI-like music format)
 */

/**
 * DMX Sound Effect format (PC Speaker sounds)
 *
 * Header (8 bytes):
 * - Format identifier (2 bytes): Always 0x0003
 * - Sample rate (2 bytes): Samples per second
 * - Sample count (4 bytes): Number of samples
 * - Data: 8-bit unsigned PCM samples (0-255, 128 = silence)
 */
export interface DmxSoundHeader {
  /** Format identifier (should be 3) */
  format: number;
  /** Sample rate in Hz */
  sampleRate: number;
  /** Number of audio samples */
  sampleCount: number;
}

export interface DmxSound {
  /** Sound header information */
  header: DmxSoundHeader;
  /** Audio sample data (8-bit unsigned PCM, 0-255) */
  samples: Uint8Array;
}

/**
 * MUS Format header
 *
 * Header structure:
 * - Magic: "MUS\x1A" (4 bytes)
 * - Score length (2 bytes)
 * - Score start offset (2 bytes)
 * - Primary channels (2 bytes)
 * - Secondary channels (2 bytes)
 * - Instrument count (2 bytes)
 * - Reserved (2 bytes)
 * - Instrument list (variable)
 */
export interface MusHeader {
  /** Magic identifier "MUS\x1A" */
  magic: string;
  /** Length of the score in bytes */
  scoreLength: number;
  /** Offset to score data */
  scoreStart: number;
  /** Number of primary channels */
  primaryChannels: number;
  /** Number of secondary channels */
  secondaryChannels: number;
  /** Number of instruments */
  instrumentCount: number;
  /** List of instrument numbers used */
  instruments: number[];
}

/**
 * MUS event types
 */
export enum MusEventType {
  RELEASE_NOTE = 0,
  PLAY_NOTE = 1,
  PITCH_WHEEL = 2,
  SYSTEM = 3,
  CONTROLLER = 4,
  SCORE_END = 6,
}

/**
 * MUS event
 */
export interface MusEvent {
  /** Event type */
  type: MusEventType;
  /** Channel number (0-15) */
  channel: number;
  /** Event data (depends on type) */
  data: number[];
  /** Delay until next event (in ticks) */
  delay: number;
}

/**
 * Complete MUS file structure
 */
export interface MusFile {
  /** MUS header */
  header: MusHeader;
  /** List of music events */
  events: MusEvent[];
}

/**
 * Audio player state
 */
export interface AudioPlayerState {
  /** Whether audio is currently playing */
  playing: boolean;
  /** Current playback position in seconds */
  currentTime: number;
  /** Total duration in seconds (if known) */
  duration?: number;
  /** Volume (0.0 - 1.0) */
  volume: number;
  /** Whether playback is looped */
  loop: boolean;
}

/**
 * Audio decode options
 */
export interface AudioDecodeOptions {
  /** Whether to validate the audio format */
  validate?: boolean;
}

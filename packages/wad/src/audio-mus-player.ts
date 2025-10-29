/**
 * MUS Music Player using WebAudio API
 *
 * Provides playback for DOOM MUS music format using simple synthesis
 */

import type { MusFile, MusEvent, AudioPlayerState } from './audio-types';
import { MusEventType } from './audio-types';

/**
 * Simple note data for active notes
 */
interface ActiveNote {
  note: number;
  oscillator: OscillatorNode;
  gainNode: GainNode;
}

/**
 * Channel state for MUS playback
 */
interface ChannelState {
  activeNotes: Map<number, ActiveNote>;
  volume: number;
  pan: number;
  instrument: number;
}

/**
 * MUS Music Player
 *
 * This is a simple implementation using oscillators.
 * For better quality, you would want to use:
 * - Sampled instruments (SF2 soundfonts)
 * - A full MIDI synthesizer
 * - Convert MUS to MIDI and use a MIDI player
 */
export class MusPlayer {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private channels: Map<number, ChannelState> = new Map();
  private _volume = 0.3; // Lower default volume for synthesized sounds
  private _loop = false;
  private playing = false;
  private currentFile: MusFile | null = null;
  private eventIndex = 0;
  private nextEventTimeout: ReturnType<typeof setTimeout> | null = null;
  private startTime = 0;

  /**
   * Initialize the audio context
   */
  initialize(): void {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this._volume;

      // Initialize channels
      for (let i = 0; i < 16; i++) {
        this.channels.set(i, {
          activeNotes: new Map(),
          volume: 1.0,
          pan: 0.5,
          instrument: 0,
        });
      }
    }
  }

  /**
   * Get audio context
   */
  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.initialize();
    }
    return this.audioContext!;
  }

  /**
   * Convert MIDI note number to frequency
   */
  private noteToFrequency(note: number): number {
    // MIDI note to frequency: f = 440 * 2^((n-69)/12)
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  /**
   * Get oscillator type based on instrument
   * This is a very simplified mapping
   */
  private getOscillatorType(instrument: number): OscillatorType {
    // Map instruments to oscillator types (very basic)
    if (instrument >= 0 && instrument < 8) return 'square'; // Lead instruments
    if (instrument >= 8 && instrument < 16) return 'sawtooth'; // Bass
    if (instrument >= 16 && instrument < 24) return 'triangle'; // Organ
    return 'sine'; // Default
  }

  /**
   * Play a note on a channel
   */
  private playNote(channel: number, note: number, velocity: number = 127): void {
    const context = this.getContext();
    const channelState = this.channels.get(channel);
    if (!channelState) return;

    // Stop existing note if playing
    this.stopNote(channel, note);

    // Create oscillator
    const oscillator = context.createOscillator();
    oscillator.type = this.getOscillatorType(channelState.instrument);
    oscillator.frequency.value = this.noteToFrequency(note);

    // Create gain node for this note
    const gainNode = context.createGain();
    const noteVolume = (velocity / 127) * channelState.volume;
    gainNode.gain.value = noteVolume * 0.3; // Scale down to prevent clipping

    // Connect: oscillator -> gain -> master
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain!);

    // Start oscillator
    oscillator.start();

    // Store active note
    channelState.activeNotes.set(note, {
      note,
      oscillator,
      gainNode,
    });
  }

  /**
   * Stop a note on a channel
   */
  private stopNote(channel: number, note: number): void {
    const channelState = this.channels.get(channel);
    if (!channelState) return;

    const activeNote = channelState.activeNotes.get(note);
    if (activeNote) {
      // Fade out quickly to avoid clicks
      const context = this.getContext();
      const now = context.currentTime;
      activeNote.gainNode.gain.setValueAtTime(activeNote.gainNode.gain.value, now);
      activeNote.gainNode.gain.linearRampToValueAtTime(0, now + 0.05);

      // Stop oscillator after fade
      activeNote.oscillator.stop(now + 0.05);

      // Remove from active notes
      channelState.activeNotes.delete(note);
    }
  }

  /**
   * Set channel volume
   */
  private setChannelVolume(channel: number, volume: number): void {
    const channelState = this.channels.get(channel);
    if (!channelState) return;

    channelState.volume = volume / 127;

    // Update all active notes on this channel
    for (const activeNote of channelState.activeNotes.values()) {
      activeNote.gainNode.gain.value = channelState.volume * 0.3;
    }
  }

  /**
   * Set channel instrument
   */
  private setChannelInstrument(channel: number, instrument: number): void {
    const channelState = this.channels.get(channel);
    if (channelState) {
      channelState.instrument = instrument;
    }
  }

  /**
   * Process a single MUS event
   */
  private processEvent(event: MusEvent): void {
    switch (event.type) {
      case MusEventType.PLAY_NOTE: {
        const note = event.data[0];
        const velocity = event.data[1] ?? 127;
        this.playNote(event.channel, note, velocity);
        break;
      }

      case MusEventType.RELEASE_NOTE: {
        const note = event.data[0];
        this.stopNote(event.channel, note);
        break;
      }

      case MusEventType.CONTROLLER: {
        const controller = event.data[0];
        const value = event.data[1];

        if (controller === 0) {
          // Instrument change
          this.setChannelInstrument(event.channel, value);
        } else if (controller === 3) {
          // Volume
          this.setChannelVolume(event.channel, value);
        }
        break;
      }

      case MusEventType.SCORE_END: {
        if (this._loop) {
          this.eventIndex = 0;
          this.scheduleNextEvent();
        } else {
          this.stop();
        }
        break;
      }
    }
  }

  /**
   * Schedule the next event
   */
  private scheduleNextEvent(): void {
    if (!this.playing || !this.currentFile) return;

    if (this.eventIndex >= this.currentFile.events.length) {
      if (this._loop) {
        this.eventIndex = 0;
      } else {
        this.stop();
        return;
      }
    }

    const event = this.currentFile.events[this.eventIndex];
    this.processEvent(event);
    this.eventIndex++;

    // Schedule next event based on delay
    // MUS delay is in ticks, DOOM uses 140 ticks per second
    const delayMs = (event.delay / 140) * 1000;

    if (delayMs > 0) {
      this.nextEventTimeout = setTimeout(() => {
        this.scheduleNextEvent();
      }, delayMs);
    } else {
      // Process immediately if no delay
      this.scheduleNextEvent();
    }
  }

  /**
   * Play a MUS file
   */
  async play(musFile: MusFile): Promise<void> {
    const context = this.getContext();

    // Resume context if suspended
    if (context.state === 'suspended') {
      await context.resume();
    }

    // Stop current playback
    this.stop();

    // Set up new playback
    this.currentFile = musFile;
    this.eventIndex = 0;
    this.playing = true;
    this.startTime = Date.now();

    // Start event processing
    this.scheduleNextEvent();
  }

  /**
   * Stop playback
   */
  stop(): void {
    this.playing = false;

    // Clear event timeout
    if (this.nextEventTimeout) {
      clearTimeout(this.nextEventTimeout);
      this.nextEventTimeout = null;
    }

    // Stop all active notes
    for (const channel of this.channels.values()) {
      for (const note of channel.activeNotes.keys()) {
        const activeNote = channel.activeNotes.get(note);
        if (activeNote) {
          try {
            activeNote.oscillator.stop();
          } catch {
            // Ignore if already stopped
          }
        }
      }
      channel.activeNotes.clear();
    }

    this.currentFile = null;
    this.eventIndex = 0;
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (this.playing) {
      this.playing = false;
      if (this.nextEventTimeout) {
        clearTimeout(this.nextEventTimeout);
        this.nextEventTimeout = null;
      }
    }
  }

  /**
   * Resume playback
   */
  async resume(): Promise<void> {
    if (!this.playing && this.currentFile) {
      const context = this.getContext();
      if (context.state === 'suspended') {
        await context.resume();
      }

      this.playing = true;
      this.scheduleNextEvent();
    }
  }

  /**
   * Set volume
   */
  set volume(value: number) {
    this._volume = Math.max(0, Math.min(1, value));
    if (this.masterGain) {
      this.masterGain.gain.value = this._volume;
    }
  }

  /**
   * Get volume
   */
  get volume(): number {
    return this._volume;
  }

  /**
   * Set loop mode
   */
  set loop(value: boolean) {
    this._loop = value;
  }

  /**
   * Get loop mode
   */
  get loop(): boolean {
    return this._loop;
  }

  /**
   * Check if playing
   */
  get isPlaying(): boolean {
    return this.playing;
  }

  /**
   * Get player state
   */
  getState(): AudioPlayerState {
    const currentTime = this.playing
      ? (Date.now() - this.startTime) / 1000
      : 0;

    return {
      playing: this.playing,
      currentTime,
      volume: this._volume,
      loop: this._loop,
    };
  }

  /**
   * Close and clean up
   */
  async close(): Promise<void> {
    this.stop();
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
    }
  }
}

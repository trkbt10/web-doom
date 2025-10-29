/**
 * WebAudio Player for DOOM Audio Formats
 *
 * Provides playback capabilities for DMX sound effects and MUS music
 */

import type { DmxSound, AudioPlayerState } from './audio-types';
import { soundToFloat32 } from './audio-sound';

/**
 * Sound Effect Player using WebAudio API
 */
export class DmxSoundPlayer {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private _volume = 1.0;
  private _loop = false;
  private startTime = 0;
  private pauseTime = 0;
  private isPaused = false;

  /**
   * Initialize the audio context (must be called after user interaction)
   */
  initialize(): void {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = this._volume;
    }
  }

  /**
   * Get the audio context (creates one if needed)
   */
  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.initialize();
    }
    return this.audioContext!;
  }

  /**
   * Convert DMX sound to WebAudio AudioBuffer
   */
  private createAudioBuffer(sound: DmxSound): AudioBuffer {
    const context = this.getContext();

    // Create audio buffer
    const buffer = context.createBuffer(
      1, // mono
      sound.header.sampleCount,
      sound.header.sampleRate
    );

    // Convert samples to Float32 and copy to buffer
    const float32Samples = soundToFloat32(sound.samples);
    const channelData = buffer.getChannelData(0);
    channelData.set(float32Samples);

    return buffer;
  }

  /**
   * Play a DMX sound effect
   *
   * @param sound - DMX sound to play
   * @returns Promise that resolves when playback starts
   */
  async play(sound: DmxSound): Promise<void> {
    const context = this.getContext();

    // Resume context if suspended (required for user interaction policy)
    if (context.state === 'suspended') {
      await context.resume();
    }

    // Stop current playback
    this.stop();

    // Create audio buffer
    const buffer = this.createAudioBuffer(sound);

    // Create and configure source
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = this._loop;

    // Connect to gain node
    source.connect(this.gainNode!);

    // Start playback
    source.start(0);
    this.currentSource = source;
    this.startTime = context.currentTime;
    this.isPaused = false;

    // Auto-cleanup when finished
    source.onended = () => {
      if (this.currentSource === source) {
        this.currentSource = null;
      }
    };
  }

  /**
   * Stop playback
   */
  stop(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // Ignore errors if already stopped
      }
      this.currentSource = null;
      this.isPaused = false;
    }
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (this.currentSource && !this.isPaused) {
      const context = this.getContext();
      this.pauseTime = context.currentTime - this.startTime;
      this.stop();
      this.isPaused = true;
    }
  }

  /**
   * Resume playback (not supported for simple sound effects)
   * Note: This is a limitation of the current implementation
   */
  resume(): void {
    console.warn('Resume is not supported for sound effects. Use play() instead.');
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  set volume(value: number) {
    this._volume = Math.max(0, Math.min(1, value));
    if (this.gainNode) {
      this.gainNode.gain.value = this._volume;
    }
  }

  /**
   * Get current volume
   */
  get volume(): number {
    return this._volume;
  }

  /**
   * Set loop mode
   */
  set loop(value: boolean) {
    this._loop = value;
    if (this.currentSource) {
      this.currentSource.loop = value;
    }
  }

  /**
   * Get loop mode
   */
  get loop(): boolean {
    return this._loop;
  }

  /**
   * Check if currently playing
   */
  get playing(): boolean {
    return this.currentSource !== null && !this.isPaused;
  }

  /**
   * Get current playback state
   */
  getState(): AudioPlayerState {
    const context = this.getContext();
    const currentTime = this.isPaused
      ? this.pauseTime
      : this.currentSource
      ? context.currentTime - this.startTime
      : 0;

    return {
      playing: this.playing,
      currentTime,
      volume: this._volume,
      loop: this._loop,
    };
  }

  /**
   * Close the audio context and clean up resources
   */
  async close(): Promise<void> {
    this.stop();
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
      this.gainNode = null;
    }
  }
}

/**
 * Simple audio manager for managing multiple sound players
 */
export class AudioManager {
  private players: Map<string, DmxSoundPlayer> = new Map();
  private masterVolume = 1.0;

  /**
   * Get or create a player for a specific sound
   */
  getPlayer(id: string): DmxSoundPlayer {
    if (!this.players.has(id)) {
      const player = new DmxSoundPlayer();
      player.volume = this.masterVolume;
      this.players.set(id, player);
    }
    return this.players.get(id)!;
  }

  /**
   * Play a sound effect
   */
  async playSound(id: string, sound: DmxSound): Promise<void> {
    const player = this.getPlayer(id);
    await player.play(sound);
  }

  /**
   * Stop a specific sound
   */
  stopSound(id: string): void {
    const player = this.players.get(id);
    if (player) {
      player.stop();
    }
  }

  /**
   * Stop all sounds
   */
  stopAll(): void {
    for (const player of this.players.values()) {
      player.stop();
    }
  }

  /**
   * Set master volume (affects all players)
   */
  set volume(value: number) {
    this.masterVolume = Math.max(0, Math.min(1, value));
    for (const player of this.players.values()) {
      player.volume = this.masterVolume;
    }
  }

  /**
   * Get master volume
   */
  get volume(): number {
    return this.masterVolume;
  }

  /**
   * Close all players and clean up
   */
  async close(): Promise<void> {
    const closePromises = Array.from(this.players.values()).map((player) =>
      player.close()
    );
    await Promise.all(closePromises);
    this.players.clear();
  }
}

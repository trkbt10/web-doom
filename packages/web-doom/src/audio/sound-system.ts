/**
 * Sound system using Web Audio API
 */

export enum SoundType {
  Pistol,
  Shotgun,
  DoorOpen,
  DoorClose,
  ItemPickup,
  PlayerPain,
  MonsterDeath,
  MonsterPain,
}

/**
 * Simple sound manager
 */
export class SoundManager {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  constructor() {
    // Create audio context lazily (requires user interaction)
  }

  /**
   * Initialize audio context (call after user interaction)
   */
  init(): void {
    if (this.audioContext) return;

    try {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3; // 30% volume
      this.masterGain.connect(this.audioContext.destination);
    } catch (e) {
      console.warn('Failed to initialize audio:', e);
    }
  }

  /**
   * Play a sound effect
   */
  playSound(type: SoundType): void {
    if (!this.audioContext || !this.masterGain) {
      this.init();
      if (!this.audioContext || !this.masterGain) return;
    }

    const now = this.audioContext.currentTime;

    switch (type) {
      case SoundType.Pistol:
        this.playGunshot(now, 200, 0.05);
        break;
      case SoundType.Shotgun:
        this.playGunshot(now, 150, 0.1);
        break;
      case SoundType.DoorOpen:
        this.playDoorSound(now, true);
        break;
      case SoundType.DoorClose:
        this.playDoorSound(now, false);
        break;
      case SoundType.ItemPickup:
        this.playPickupSound(now);
        break;
      case SoundType.PlayerPain:
        this.playPainSound(now, 300);
        break;
      case SoundType.MonsterDeath:
        this.playDeathSound(now);
        break;
      case SoundType.MonsterPain:
        this.playPainSound(now, 200);
        break;
    }
  }

  /**
   * Play gunshot sound
   */
  private playGunshot(time: number, frequency: number, duration: number): void {
    if (!this.audioContext || !this.masterGain) return;

    // Create oscillator for noise-like sound
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(frequency, time);
    oscillator.frequency.exponentialRampToValueAtTime(50, time + duration);

    gainNode.gain.setValueAtTime(0.3, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(time);
    oscillator.stop(time + duration);
  }

  /**
   * Play door sound
   */
  private playDoorSound(time: number, opening: boolean): void {
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'square';

    if (opening) {
      oscillator.frequency.setValueAtTime(100, time);
      oscillator.frequency.exponentialRampToValueAtTime(300, time + 0.3);
    } else {
      oscillator.frequency.setValueAtTime(300, time);
      oscillator.frequency.exponentialRampToValueAtTime(100, time + 0.3);
    }

    gainNode.gain.setValueAtTime(0.2, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(time);
    oscillator.stop(time + 0.3);
  }

  /**
   * Play item pickup sound
   */
  private playPickupSound(time: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, time);
    oscillator.frequency.exponentialRampToValueAtTime(1200, time + 0.1);

    gainNode.gain.setValueAtTime(0.3, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(time);
    oscillator.stop(time + 0.1);
  }

  /**
   * Play pain sound
   */
  private playPainSound(time: number, baseFreq: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(baseFreq, time);
    oscillator.frequency.linearRampToValueAtTime(baseFreq * 0.8, time + 0.2);

    gainNode.gain.setValueAtTime(0.2, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(time);
    oscillator.stop(time + 0.2);
  }

  /**
   * Play death sound
   */
  private playDeathSound(time: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(400, time);
    oscillator.frequency.exponentialRampToValueAtTime(50, time + 0.5);

    gainNode.gain.setValueAtTime(0.3, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(time);
    oscillator.stop(time + 0.5);
  }

  /**
   * Dispose sound manager
   */
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

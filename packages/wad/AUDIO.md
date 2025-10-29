# DOOM Audio Playback Support

This package now supports decoding and playback of DOOM audio formats using WebAudio API.

## Supported Formats

### 1. DMX Sound Effects (PC Speaker)
- 8-bit unsigned PCM audio samples
- Used for sound effects in DOOM
- Format identifier: `0x0003`

### 2. DMX MUS Format
- MIDI-like music format used in DOOM
- Event-based sequencer format
- Converted to synthesized audio using WebAudio oscillators

## Installation

```bash
bun install @web-doom/wad
```

## Usage

### Sound Effects

```typescript
import { decodeSound, DmxSoundPlayer } from '@web-doom/wad';

// Decode a sound effect from a WAD lump
const soundData = findLump(wad, 'DSPISTOL').data;
const sound = decodeSound(soundData);

// Create a player and play the sound
const player = new DmxSoundPlayer();
player.initialize();
await player.play(sound);

// Control playback
player.volume = 0.8;
player.loop = true;
player.stop();
```

### Music (MUS Format)

```typescript
import { decodeMus, MusPlayer } from '@web-doom/wad';

// Decode a MUS music file from a WAD lump
const musData = findLump(wad, 'D_E1M1').data;
const musFile = decodeMus(musData);

// Create a player and play the music
const player = new MusPlayer();
player.initialize();
await player.play(musFile);

// Control playback
player.volume = 0.5;
player.loop = true;
player.pause();
await player.resume();
player.stop();
```

### Audio Manager (Multiple Sounds)

```typescript
import { decodeSound, AudioManager } from '@web-doom/wad';

const manager = new AudioManager();

// Play multiple sounds simultaneously
const pistolSound = decodeSound(findLump(wad, 'DSPISTOL').data);
const shotgunSound = decodeSound(findLump(wad, 'DSSHOTGN').data);

await manager.playSound('pistol', pistolSound);
await manager.playSound('shotgun', shotgunSound);

// Control master volume
manager.volume = 0.7;

// Stop specific or all sounds
manager.stopSound('pistol');
manager.stopAll();
```

## API Reference

### Sound Effects

#### `decodeSound(buffer: ArrayBuffer, options?: AudioDecodeOptions): DmxSound`

Decodes a DMX sound effect from binary data.

- **Parameters:**
  - `buffer`: ArrayBuffer containing DMX sound data
  - `options.validate`: Whether to validate the format (default: true)

- **Returns:** `DmxSound` object with header and sample data

#### `soundToFloat32(samples: Uint8Array): Float32Array`

Converts 8-bit unsigned PCM samples to 32-bit float format for WebAudio.

#### `isSoundFormat(buffer: ArrayBuffer): boolean`

Checks if a buffer contains valid DMX sound data.

### Music (MUS)

#### `decodeMus(buffer: ArrayBuffer, options?: AudioDecodeOptions): MusFile`

Decodes a MUS music file from binary data.

- **Parameters:**
  - `buffer`: ArrayBuffer containing MUS file data
  - `options.validate`: Whether to validate the format (default: true)

- **Returns:** `MusFile` object with header and events

#### `isMusFormat(buffer: ArrayBuffer): boolean`

Checks if a buffer contains valid MUS music data.

### Players

#### `DmxSoundPlayer`

WebAudio player for DMX sound effects.

**Methods:**
- `initialize()`: Initialize the audio context
- `play(sound: DmxSound)`: Play a sound effect
- `stop()`: Stop playback
- `pause()`: Pause playback
- `close()`: Clean up resources

**Properties:**
- `volume: number`: Volume (0.0 - 1.0)
- `loop: boolean`: Loop playback
- `playing: boolean`: Whether currently playing

#### `MusPlayer`

WebAudio player for MUS music with simple synthesis.

**Methods:**
- `initialize()`: Initialize the audio context
- `play(musFile: MusFile)`: Play a MUS music file
- `stop()`: Stop playback
- `pause()`: Pause playback
- `resume()`: Resume playback
- `close()`: Clean up resources

**Properties:**
- `volume: number`: Volume (0.0 - 1.0)
- `loop: boolean`: Loop playback
- `isPlaying: boolean`: Whether currently playing

#### `AudioManager`

Manager for multiple simultaneous sound effects.

**Methods:**
- `playSound(id: string, sound: DmxSound)`: Play a sound with an ID
- `stopSound(id: string)`: Stop a specific sound
- `stopAll()`: Stop all sounds
- `close()`: Clean up all resources

**Properties:**
- `volume: number`: Master volume (0.0 - 1.0)

## Format Details

### DMX Sound Effect Structure

```
Header (8 bytes):
  - Format ID (2 bytes): 0x0003
  - Sample rate (2 bytes): Samples per second (e.g., 11025 Hz)
  - Sample count (4 bytes): Number of samples

Data:
  - 8-bit unsigned PCM samples (0-255, 128 = silence)
```

### MUS Format Structure

```
Header (16+ bytes):
  - Magic (4 bytes): "MUS\x1A"
  - Score length (2 bytes)
  - Score start offset (2 bytes)
  - Primary channels (2 bytes)
  - Secondary channels (2 bytes)
  - Instrument count (2 bytes)
  - Reserved (2 bytes)
  - Instrument list (variable)

Events:
  - Event-based format with delays
  - Supports note on/off, pitch bend, controllers
```

## Browser Compatibility

Requires modern browsers with WebAudio API support:
- Chrome 35+
- Firefox 25+
- Safari 14.1+
- Edge 79+

## Notes

- **User Interaction Required**: Due to browser autoplay policies, audio playback requires user interaction (e.g., button click) before the AudioContext can start.
- **MUS Synthesis**: The MUS player uses simple oscillator-based synthesis. For higher quality music, consider:
  - Converting MUS to MIDI and using a MIDI player with soundfonts
  - Using pre-rendered audio files
- **Performance**: Playing many simultaneous sounds may impact performance. Use `AudioManager` to manage sound instances efficiently.

## Example: Complete WAD Audio Player

```typescript
import { decode, findLump, decodeSound, decodeMus, DmxSoundPlayer, MusPlayer } from '@web-doom/wad';

async function playWadAudio(wadBuffer: ArrayBuffer) {
  // Decode WAD file
  const wad = decode(wadBuffer);

  // Play a sound effect
  const pistolData = findLump(wad, 'DSPISTOL')?.data;
  if (pistolData) {
    const sound = decodeSound(pistolData);
    const soundPlayer = new DmxSoundPlayer();
    soundPlayer.initialize();
    await soundPlayer.play(sound);
  }

  // Play music
  const musicData = findLump(wad, 'D_E1M1')?.data;
  if (musicData && isMusFormat(musicData)) {
    const music = decodeMus(musicData);
    const musicPlayer = new MusPlayer();
    musicPlayer.initialize();
    musicPlayer.loop = true;
    await musicPlayer.play(music);
  }
}

// Call after user interaction
document.getElementById('playButton')?.addEventListener('click', async () => {
  const response = await fetch('doom.wad');
  const buffer = await response.arrayBuffer();
  await playWadAudio(buffer);
});
```

## License

This implementation is based on the DOOM audio format specifications and is intended for educational and preservation purposes.

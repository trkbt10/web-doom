import type { ReactElement } from 'react';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import type { WadFile, WadLump } from '@web-doom/wad';
import {
  decodeSound,
  isSoundFormat,
  decodeMus,
  isMusFormat,
  DmxSoundPlayer,
  MusPlayer,
} from '@web-doom/wad';
import type { DmxSound, MusFile } from '@web-doom/wad';
import './AudioPreviewPage.css';

interface AudioPreviewPageProps {
  wadFile: WadFile;
}

interface AudioInfo {
  name: string;
  lump: WadLump;
  type: 'sound' | 'music' | 'unknown';
  decodedSound?: DmxSound;
  decodedMusic?: MusFile;
}

function AudioPreviewPage({ wadFile }: AudioPreviewPageProps): ReactElement {
  const [filter, setFilter] = useState('');
  const [selectedAudio, setSelectedAudio] = useState<AudioInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [loop, setLoop] = useState(false);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  const soundPlayerRef = useRef<DmxSoundPlayer | null>(null);
  const musicPlayerRef = useRef<MusPlayer | null>(null);

  // Initialize players
  useEffect(() => {
    soundPlayerRef.current = new DmxSoundPlayer();
    musicPlayerRef.current = new MusPlayer();

    return () => {
      soundPlayerRef.current?.close();
      musicPlayerRef.current?.close();
    };
  }, []);

  // Update player settings
  useEffect(() => {
    if (soundPlayerRef.current) {
      soundPlayerRef.current.volume = volume;
      soundPlayerRef.current.loop = loop;
    }
    if (musicPlayerRef.current) {
      musicPlayerRef.current.volume = volume;
      musicPlayerRef.current.loop = loop;
    }
  }, [volume, loop]);

  // Playback controls
  const stopPlayback = useCallback(() => {
    soundPlayerRef.current?.stop();
    musicPlayerRef.current?.stop();
    setIsPlaying(false);
  }, []);

  const togglePlayback = async () => {
    if (!selectedAudio) return;

    if (isPlaying) {
      stopPlayback();
      return;
    }

    try {
      if (selectedAudio.type === 'sound' && selectedAudio.decodedSound) {
        await soundPlayerRef.current?.play(selectedAudio.decodedSound);
        setIsPlaying(true);
      } else if (selectedAudio.type === 'music' && selectedAudio.decodedMusic) {
        await musicPlayerRef.current?.play(selectedAudio.decodedMusic);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
      setDecodeError(error instanceof Error ? error.message : 'Failed to play audio');
    }
  };

  // Decode selected audio
  useEffect(() => {
    if (!selectedAudio) return;

    setDecodeError(null);

    try {
      if (selectedAudio.type === 'sound') {
        // Decode sound effect
        if (isSoundFormat(selectedAudio.lump.data)) {
          const sound = decodeSound(selectedAudio.lump.data);
          selectedAudio.decodedSound = sound;
        } else {
          setDecodeError('Invalid PC Speaker sound format');
        }
      } else if (selectedAudio.type === 'music') {
        // Decode music
        if (isMusFormat(selectedAudio.lump.data)) {
          const music = decodeMus(selectedAudio.lump.data);
          selectedAudio.decodedMusic = music;
        } else {
          setDecodeError('Invalid DMX MUS format');
        }
      }
    } catch (error) {
      setDecodeError(error instanceof Error ? error.message : 'Failed to decode audio');
    }

    // Stop playback when selection changes
    stopPlayback();
  }, [selectedAudio, stopPlayback]);

  // Identify audio lumps
  const audioLumps = useMemo(() => {
    const lumps: AudioInfo[] = [];

    for (const lump of wadFile.lumps) {
      let type: 'sound' | 'music' | 'unknown' = 'unknown';

      // Sound effects typically start with 'DS' prefix
      if (lump.name.startsWith('DS')) {
        type = 'sound';
      }
      // Music typically starts with 'D_' prefix
      else if (lump.name.startsWith('D_')) {
        type = 'music';
      }
      // Also check for DMX music format marker
      else if (lump.size > 4) {
        const view = new DataView(lump.data);
        // Check for DMX marker
        if (lump.data.byteLength >= 4) {
          const marker = String.fromCharCode(
            view.getUint8(0),
            view.getUint8(1),
            view.getUint8(2),
            view.getUint8(3)
          );
          if (marker === 'MUS\x1a') {
            type = 'music';
          }
        }
      }

      if (type !== 'unknown') {
        lumps.push({
          name: lump.name,
          lump,
          type,
        });
      }
    }

    return lumps;
  }, [wadFile]);

  const filteredAudio = useMemo(() => {
    if (!filter) return audioLumps;
    const lowerFilter = filter.toLowerCase();
    return audioLumps.filter((audio) => audio.name.toLowerCase().includes(lowerFilter));
  }, [audioLumps, filter]);

  const handleAudioClick = (audio: AudioInfo) => {
    setSelectedAudio(audio);
  };

  const getAudioFormatInfo = (audio: AudioInfo): string => {
    if (audio.type === 'music') {
      const view = new DataView(audio.lump.data);
      if (audio.lump.data.byteLength >= 4) {
        const marker = String.fromCharCode(
          view.getUint8(0),
          view.getUint8(1),
          view.getUint8(2),
          view.getUint8(3)
        );
        if (marker === 'MUS\x1a') {
          return 'DMX MUS format';
        }
      }
      return 'Music data';
    } else if (audio.type === 'sound') {
      // DOOM sound effects have a specific header
      if (audio.lump.data.byteLength >= 8) {
        const view = new DataView(audio.lump.data);
        const sampleRate = view.getUint16(2, true);
        const sampleCount = view.getUint32(4, true);
        return `PC Speaker format (${sampleRate}Hz, ${sampleCount} samples)`;
      }
      return 'Sound effect data';
    }
    return 'Unknown format';
  };

  const getHexPreview = (data: ArrayBuffer, maxBytes: number = 64): string => {
    const bytes = new Uint8Array(data);
    const limit = Math.min(bytes.length, maxBytes);
    const hexBytes = Array.from(bytes.slice(0, limit))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ');

    if (bytes.length > maxBytes) {
      return hexBytes + ' ...';
    }
    return hexBytes;
  };

  return (
    <div className="audio-preview-page">
      <div className="audio-header">
        <h2>Audio Preview ({filteredAudio.length} audio lumps)</h2>
        <div className="audio-note">
          Click on any audio lump to play PC Speaker sounds or DMX MUS music.
        </div>
        <input
          type="text"
          placeholder="Filter by name..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter-input"
        />
      </div>

      <div className="audio-content">
        <div className="audio-list">
          {filteredAudio.length === 0 ? (
            <div className="no-audio">
              {filter ? 'No audio matches your filter.' : 'No audio lumps found in this WAD file.'}
            </div>
          ) : (
            filteredAudio.map((audio, index) => (
              <div
                key={index}
                className={`audio-item ${selectedAudio === audio ? 'selected' : ''}`}
                onClick={() => handleAudioClick(audio)}
              >
                <div className="audio-icon">
                  {audio.type === 'music' ? '🎵' : '🔊'}
                </div>
                <div className="audio-item-info">
                  <div className="audio-name">{audio.name}</div>
                  <div className="audio-meta">
                    <span className={`audio-type ${audio.type}`}>
                      {audio.type === 'music' ? 'Music' : 'Sound'}
                    </span>
                    <span className="audio-size">{audio.lump.size} bytes</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedAudio && (
          <div className="audio-details">
            <h3>{selectedAudio.name}</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Type:</span>
                <span className="detail-value">
                  {selectedAudio.type === 'music' ? 'Music' : 'Sound Effect'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Size:</span>
                <span className="detail-value">{selectedAudio.lump.size} bytes</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Format:</span>
                <span className="detail-value">{getAudioFormatInfo(selectedAudio)}</span>
              </div>
            </div>

            <div className="hex-preview">
              <h4>Data Preview (Hex)</h4>
              <pre>{getHexPreview(selectedAudio.lump.data)}</pre>
            </div>

            {decodeError ? (
              <div className="playback-error" style={{ color: '#ff6b6b', padding: '1rem', backgroundColor: '#2a1414', borderRadius: '4px' }}>
                Error: {decodeError}
              </div>
            ) : (
              <div className="playback-controls" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', backgroundColor: '#1a1a1a', borderRadius: '4px' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={togglePlayback}
                    disabled={!selectedAudio.decodedSound && !selectedAudio.decodedMusic}
                    style={{
                      padding: '0.5rem 1.5rem',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      backgroundColor: '#4a9eff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      opacity: (!selectedAudio.decodedSound && !selectedAudio.decodedMusic) ? 0.5 : 1,
                    }}
                  >
                    {isPlaying ? 'Stop' : 'Play'}
                  </button>
                  <span style={{ color: '#888', fontSize: '0.9rem' }}>
                    {selectedAudio.type === 'music' ? 'DMX MUS Music' : 'PC Speaker Sound'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ minWidth: '60px' }}>Volume:</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span style={{ minWidth: '40px', textAlign: 'right' }}>{Math.round(volume * 100)}%</span>
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={loop}
                      onChange={(e) => setLoop(e.target.checked)}
                    />
                    <span>Loop</span>
                  </label>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                  {selectedAudio.type === 'music'
                    ? 'Note: Music uses synthesized oscillators. For best quality, use soundfonts or MIDI players.'
                    : 'Playing PC Speaker sound effect from WAD file.'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AudioPreviewPage;

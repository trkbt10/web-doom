import { useMemo, useState } from 'react';
import type { WadFile, WadLump } from '@web-doom/wad';
import './AudioPreviewPage.css';

interface AudioPreviewPageProps {
  wadFile: WadFile;
}

interface AudioInfo {
  name: string;
  lump: WadLump;
  type: 'sound' | 'music' | 'unknown';
}

function AudioPreviewPage({ wadFile }: AudioPreviewPageProps) {
  const [filter, setFilter] = useState('');
  const [selectedAudio, setSelectedAudio] = useState<AudioInfo | null>(null);

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
          Note: DOOM audio playback is not yet implemented. This page shows detected audio lumps.
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

            <div className="playback-note">
              Audio playback for DOOM formats (PC Speaker / DMX MUS) requires specialized
              decoding. This feature may be added in a future update.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AudioPreviewPage;

import { useState, useEffect, useMemo } from 'react';
import type { WadFile } from '@web-doom/wad';
import { decodePicture, pictureToCanvas, parsePaletteFromPLAYPAL, findLump } from '@web-doom/wad';
import './TextureGalleryPage.css';

interface TextureGalleryPageProps {
  wadFile: WadFile;
}

interface TextureInfo {
  name: string;
  dataUrl: string | null;
  error?: string;
  width: number;
  height: number;
}

function TextureGalleryPage({ wadFile }: TextureGalleryPageProps) {
  const [textures, setTextures] = useState<TextureInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [scale, setScale] = useState(2);

  // Get palette from WAD file if available
  const palette = useMemo(() => {
    const playpalLump = findLump(wadFile, 'PLAYPAL');
    if (playpalLump && playpalLump.data.byteLength >= 768) {
      try {
        return parsePaletteFromPLAYPAL(playpalLump.data);
      } catch (e) {
        console.warn('Failed to parse PLAYPAL:', e);
      }
    }
    return undefined;
  }, [wadFile]);

  useEffect(() => {
    const loadTextures = async () => {
      setLoading(true);
      const textureList: TextureInfo[] = [];

      // Identify potential image lumps
      // In DOOM, sprites typically start with certain prefixes or are between markers
      // Common patterns: sprites between S_START/S_END, patches between P_START/P_END
      const imageLumps = wadFile.lumps.filter((lump) => {
        // Skip empty lumps
        if (lump.size === 0) return false;

        // Skip marker lumps (typically end with _START or _END)
        if (lump.name.endsWith('_START') || lump.name.endsWith('_END')) return false;

        // Try to decode as picture - if it works, it's likely an image
        // This is a heuristic approach
        return lump.size > 8; // Must have at least header size
      });

      for (const lump of imageLumps) {
        try {
          const picture = decodePicture(lump.data);

          // Validate that dimensions are reasonable
          if (picture.header.width > 0 && picture.header.height > 0 &&
              picture.header.width <= 4096 && picture.header.height <= 4096) {

            const canvas = pictureToCanvas(picture, {
              palette,
              scale: 1,
            });
            const dataUrl = canvas.toDataURL('image/png');

            textureList.push({
              name: lump.name,
              dataUrl,
              width: picture.header.width,
              height: picture.header.height,
            });
          }
        } catch (e) {
          // Not a valid picture format, skip silently
        }
      }

      setTextures(textureList);
      setLoading(false);
    };

    loadTextures();
  }, [wadFile, palette]);

  const filteredTextures = useMemo(() => {
    if (!filter) return textures;
    const lowerFilter = filter.toLowerCase();
    return textures.filter((tex) => tex.name.toLowerCase().includes(lowerFilter));
  }, [textures, filter]);

  if (loading) {
    return (
      <div className="texture-gallery-page">
        <div className="loading-message">Loading textures...</div>
      </div>
    );
  }

  return (
    <div className="texture-gallery-page">
      <div className="gallery-header">
        <h2>Texture Gallery ({filteredTextures.length} textures)</h2>
        <div className="gallery-controls">
          <input
            type="text"
            placeholder="Filter by name..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-input"
          />
          <label className="scale-control">
            Scale:
            <input
              type="range"
              min="1"
              max="8"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
            />
            <span>{scale}x</span>
          </label>
        </div>
      </div>

      {filteredTextures.length === 0 ? (
        <div className="no-textures">
          {filter ? 'No textures match your filter.' : 'No textures found in this WAD file.'}
        </div>
      ) : (
        <div className="texture-grid">
          {filteredTextures.map((texture, index) => (
            <div key={index} className="texture-item">
              <div
                className="texture-preview"
                style={{
                  width: `${texture.width * scale}px`,
                  height: `${texture.height * scale}px`,
                }}
              >
                {texture.dataUrl ? (
                  <img
                    src={texture.dataUrl}
                    alt={texture.name}
                    style={{
                      width: `${texture.width * scale}px`,
                      height: `${texture.height * scale}px`,
                      imageRendering: 'pixelated',
                    }}
                  />
                ) : (
                  <div className="texture-error">{texture.error || 'Failed to load'}</div>
                )}
              </div>
              <div className="texture-info">
                <div className="texture-name">{texture.name}</div>
                <div className="texture-dimensions">
                  {texture.width} × {texture.height}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TextureGalleryPage;

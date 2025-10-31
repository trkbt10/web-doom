import type { TextureMetadata } from '../types';
import './TextureGrid.css';

interface TextureGridProps {
  textures: TextureMetadata[];
  onSelectTexture: (texture: TextureMetadata) => void;
}

export default function TextureGrid({ textures, onSelectTexture }: TextureGridProps) {
  return (
    <div className="texture-grid">
      {textures.map((texture) => (
        <div
          key={texture.name}
          className="texture-card"
          onClick={() => onSelectTexture(texture)}
        >
          <div className="texture-preview">
            <img
              src={texture.transformedBase64 || texture.originalBase64}
              alt={texture.name}
              className="texture-image"
            />
            {texture.transformedBase64 && (
              <div className="texture-badge transformed">✓ Transformed</div>
            )}
            {texture.confirmed && (
              <div className="texture-badge confirmed">✓ Confirmed</div>
            )}
          </div>
          <div className="texture-info">
            <div className="texture-name">{texture.name}</div>
            <div className="texture-category">{texture.category}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

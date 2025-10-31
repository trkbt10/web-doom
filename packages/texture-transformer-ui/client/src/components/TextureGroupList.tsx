import type { TextureGroup, TextureMetadata } from '../types';
import './TextureGroupList.css';

interface TextureGroupListProps {
  groups: TextureGroup[];
  textures: Map<string, TextureMetadata>;
  onSelectGroup: (group: TextureGroup) => void;
  onDeleteGroup: (groupId: string) => void;
}

export default function TextureGroupList({
  groups,
  textures,
  onSelectGroup,
  onDeleteGroup,
}: TextureGroupListProps) {
  if (groups.length === 0) {
    return (
      <div className="empty-state">
        <h3>No texture groups yet</h3>
        <p>Create a group to batch-transform multiple textures with consistent styling</p>
      </div>
    );
  }

  return (
    <div className="texture-group-list">
      {groups.map((group) => (
        <div key={group.id} className="group-card">
          <div className="group-header">
            <h3>{group.name}</h3>
            <span className="group-date">
              {new Date(group.createdAt).toLocaleDateString()}
            </span>
          </div>

          {group.description && (
            <p className="group-description">{group.description}</p>
          )}

          <div className="group-stats">
            <div className="stat-item">
              <span className="stat-label">Textures:</span>
              <span className="stat-value">{group.textureNames.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Transforms:</span>
              <span className="stat-value">{group.transformHistory.length}</span>
            </div>
            {group.spriteSheetWidth && (
              <div className="stat-item">
                <span className="stat-label">Sprite Size:</span>
                <span className="stat-value">
                  {group.spriteSheetWidth}x{group.spriteSheetHeight}
                </span>
              </div>
            )}
          </div>

          {/* Texture Previews */}
          <div className="group-textures-preview">
            <div className="group-textures-label">Textures in Group:</div>
            <div className="group-textures-grid">
              {group.textureNames.slice(0, 8).map((name) => {
                const texture = textures.get(name);
                return (
                  <div key={name} className="group-texture-item">
                    <div className="group-texture-image">
                      {texture?.originalBase64 ? (
                        <img
                          src={texture.transformedBase64 || texture.originalBase64}
                          alt={name}
                          className="group-texture-thumb"
                        />
                      ) : (
                        <div className="group-texture-placeholder">{name.substring(0, 2)}</div>
                      )}
                    </div>
                    {texture?.transformedBase64 && (
                      <div className="group-texture-badge">✓</div>
                    )}
                  </div>
                );
              })}
              {group.textureNames.length > 8 && (
                <div className="group-texture-item group-texture-more">
                  +{group.textureNames.length - 8}
                </div>
              )}
            </div>
          </div>

          {group.spriteSheetBase64 && (
            <div className="group-preview">
              <div className="group-preview-label">Generated Sprite Sheet:</div>
              <img
                src={group.transformedSpriteSheetBase64 || group.spriteSheetBase64}
                alt={`${group.name} sprite sheet`}
                className="sprite-preview"
              />
            </div>
          )}

          <div className="group-actions">
            <button className="btn btn-primary" onClick={() => onSelectGroup(group)}>
              Open Group
            </button>
            <button
              className="btn btn-danger"
              onClick={() => onDeleteGroup(group.id)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

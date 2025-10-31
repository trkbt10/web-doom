import { useState } from 'react';
import type { TextureMetadata } from '../types';
import './Modal.css';

interface CreateGroupModalProps {
  textures: TextureMetadata[];
  onClose: () => void;
  onCreate: (data: { name: string; textureNames: string[]; description?: string }) => void;
}

export default function CreateGroupModal({
  textures,
  onClose,
  onCreate,
}: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTextures, setSelectedTextures] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');

  const handleToggleTexture = (textureName: string) => {
    const newSelected = new Set(selectedTextures);
    if (newSelected.has(textureName)) {
      newSelected.delete(textureName);
    } else {
      newSelected.add(textureName);
    }
    setSelectedTextures(newSelected);
  };

  const handleSelectAll = () => {
    const filtered = getFilteredTextures();
    setSelectedTextures(new Set(filtered.map(t => t.name)));
  };

  const handleDeselectAll = () => {
    setSelectedTextures(new Set());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || selectedTextures.size === 0) {
      alert('Please enter a name and select at least one texture');
      return;
    }

    onCreate({
      name: name.trim(),
      textureNames: Array.from(selectedTextures),
      description: description.trim() || undefined,
    });
  };

  const getFilteredTextures = () => {
    if (!filter) return textures;

    const lowerFilter = filter.toLowerCase();
    return textures.filter(
      (t) =>
        t.name.toLowerCase().includes(lowerFilter) ||
        t.category.toLowerCase().includes(lowerFilter)
    );
  };

  const filteredTextures = getFilteredTextures();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Texture Group</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="group-name">Group Name *</label>
              <input
                id="group-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Wall Textures, Enemy Sprites, etc."
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="group-description">Description (Optional)</label>
              <textarea
                id="group-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this group for?"
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Select Textures ({selectedTextures.size} selected)</label>
              <div className="texture-selection-controls">
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter textures..."
                  className="filter-input"
                />
                <button type="button" className="btn btn-secondary btn-small" onClick={handleSelectAll}>
                  Select All
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={handleDeselectAll}
                >
                  Deselect All
                </button>
              </div>

              <div className="texture-selection-grid">
                {filteredTextures.map((texture) => (
                  <div
                    key={texture.name}
                    className={`texture-selection-item ${
                      selectedTextures.has(texture.name) ? 'selected' : ''
                    }`}
                    onClick={() => handleToggleTexture(texture.name)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTextures.has(texture.name)}
                      onChange={() => {}}
                    />
                    {texture.originalBase64 && (
                      <img
                        src={texture.originalBase64}
                        alt={texture.name}
                        className="texture-thumb"
                      />
                    )}
                    <div className="texture-info">
                      <div className="texture-name-small">{texture.name}</div>
                      <div className="texture-category-small">{texture.category}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

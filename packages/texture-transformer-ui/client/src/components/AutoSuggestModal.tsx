import { useState, useEffect } from 'react';
import type { GroupSuggestion } from '../types';
import './Modal.css';
import './AutoSuggestModal.css';

interface AutoSuggestModalProps {
  projectId: string;
  textureNames: string[];
  onClose: () => void;
  onCreateGroups: (suggestions: GroupSuggestion[]) => void;
}

export default function AutoSuggestModal({
  projectId,
  textureNames,
  onClose,
  onCreateGroups,
}: AutoSuggestModalProps) {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<GroupSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/groups/${projectId}/auto-suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textureNames }),
      });

      const data = await response.json();

      if (data.success) {
        setSuggestions(data.suggestions);
        // Select all by default
        setSelectedSuggestions(new Set(data.suggestions.map((_: any, i: number) => i)));
      } else {
        setError(data.error || 'Failed to generate suggestions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSuggestion = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedSuggestions(new Set(suggestions.map((_, i) => i)));
  };

  const handleDeselectAll = () => {
    setSelectedSuggestions(new Set());
  };

  const handleCreate = () => {
    const selected = suggestions.filter((_, i) => selectedSuggestions.has(i));
    onCreateGroups(selected);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Auto-Suggest Texture Groups</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {loading && (
            <div className="loading-state">
              <p>Analyzing texture patterns...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>{error}</p>
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          )}

          {!loading && !error && suggestions.length === 0 && (
            <div className="empty-state">
              <p>No group patterns detected.</p>
              <p>
                All textures might already be grouped, or there aren't enough similar texture
                names to create automatic groups.
              </p>
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          )}

          {!loading && !error && suggestions.length > 0 && (
            <>
              <div className="suggestions-header">
                <p>
                  Found {suggestions.length} suggested group{suggestions.length > 1 ? 's' : ''}{' '}
                  based on texture naming patterns.
                </p>
                <div className="suggestion-controls">
                  <button className="btn btn-secondary btn-small" onClick={handleSelectAll}>
                    Select All
                  </button>
                  <button className="btn btn-secondary btn-small" onClick={handleDeselectAll}>
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="suggestions-list">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`suggestion-item ${
                      selectedSuggestions.has(index) ? 'selected' : ''
                    }`}
                    onClick={() => handleToggleSuggestion(index)}
                  >
                    <div className="suggestion-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedSuggestions.has(index)}
                        onChange={() => {}}
                      />
                    </div>
                    <div className="suggestion-info">
                      <h3>{suggestion.name}</h3>
                      <p className="suggestion-description">{suggestion.description}</p>
                      <div className="suggestion-stats">
                        <span className="suggestion-pattern">Pattern: {suggestion.pattern}</span>
                        <span className="suggestion-count">
                          {suggestion.textureNames.length} texture
                          {suggestion.textureNames.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="suggestion-textures">
                        {suggestion.textureNames.slice(0, 10).map((name) => (
                          <span key={name} className="texture-tag">
                            {name}
                          </span>
                        ))}
                        {suggestion.textureNames.length > 10 && (
                          <span className="texture-tag more">
                            +{suggestion.textureNames.length - 10} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {!loading && !error && suggestions.length > 0 && (
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={selectedSuggestions.size === 0}
            >
              Create {selectedSuggestions.size} Group{selectedSuggestions.size > 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import type { Project } from '../types';
import './Modal.css';

interface ProjectSettingsModalProps {
  project: Project;
  onClose: () => void;
  onSave: (commonPrompt: string) => void;
}

export default function ProjectSettingsModal({
  project,
  onClose,
  onSave,
}: ProjectSettingsModalProps) {
  const [commonPrompt, setCommonPrompt] = useState(project.commonPrompt || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(commonPrompt);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Project Settings</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-section">
              <h3>Common Transformation Prompt</h3>
              <p className="form-help">
                This prompt will be automatically prepended to all texture transformations in this project.
                Use it to maintain consistent styling across all textures.
              </p>

              <div className="form-group">
                <label htmlFor="commonPrompt">Common Prompt:</label>
                <textarea
                  id="commonPrompt"
                  className="form-control"
                  value={commonPrompt}
                  onChange={(e) => setCommonPrompt(e.target.value)}
                  placeholder="e.g., pixel art style, retro game aesthetic, high contrast colors"
                  rows={4}
                />
                <div className="form-help-text">
                  {commonPrompt.length > 0 ? (
                    <span className="success">✓ Common prompt will be applied to all transformations</span>
                  ) : (
                    <span className="muted">Leave empty to not use a common prompt</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

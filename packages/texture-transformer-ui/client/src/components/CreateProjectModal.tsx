import { useState } from 'react';
import './Modal.css';

interface CreateProjectModalProps {
  onClose: () => void;
  onCreate: (data: { name: string; wadFile: File; description?: string }) => void;
}

export default function CreateProjectModal({ onClose, onCreate }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [wadFile, setWadFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !wadFile) return;

    onCreate({
      name,
      wadFile,
      description: description || undefined,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Project</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="name">Project Name *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Cyberpunk DOOM"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="wadFile">WAD File *</label>
            <input
              id="wadFile"
              type="file"
              accept=".wad"
              onChange={(e) => setWadFile(e.target.files?.[0] || null)}
              required
            />
            <small>
              {wadFile ? `Selected: ${wadFile.name}` : 'Choose a WAD file to upload'}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your transformation theme or goals..."
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!name || !wadFile}>
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import type { TextureMetadata } from '../types';
import './TextureDetail.css';

interface TextureDetailProps {
  projectId: string;
  texture: TextureMetadata;
  onClose: () => void;
  onUpdate: () => void;
}

export default function TextureDetail({
  projectId,
  texture,
  onClose,
  onUpdate,
}: TextureDetailProps) {
  const [prompt, setPrompt] = useState('');
  const transformer = 'gemini'; // Always use Gemini for stability
  const strength = 0.6; // Balanced strength for visible transformation
  const steps = 30;
  const guidanceScale = 7.5;
  const negativePrompt = 'blurry, deformed, distorted, disfigured, unrecognizable';
  const [transforming, setTransforming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTransform = async () => {
    if (!prompt) {
      setError('Please enter a transformation prompt');
      return;
    }

    setTransforming(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/textures/${projectId}/${texture.name}/transform`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            transformer,
            strength,
            steps,
            guidanceScale,
            negativePrompt: negativePrompt || undefined,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        onUpdate();
      } else {
        setError(data.error || 'Transformation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setTransforming(false);
    }
  };

  const handleConfirm = async () => {
    try {
      const response = await fetch(
        `/api/textures/${projectId}/${texture.name}/confirm`,
        { method: 'POST' }
      );

      const data = await response.json();
      if (data.success) {
        onUpdate();
      }
    } catch (err) {
      console.error('Failed to confirm:', err);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset texture to original? This will delete all transformations.')) {
      return;
    }

    try {
      const response = await fetch(`/api/textures/${projectId}/${texture.name}/reset`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        onUpdate();
      }
    } catch (err) {
      console.error('Failed to reset:', err);
    }
  };

  const handleRevert = async (historyIndex: number) => {
    try {
      const response = await fetch(
        `/api/textures/${projectId}/${texture.name}/revert`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ historyIndex }),
        }
      );

      const data = await response.json();
      if (data.success) {
        onUpdate();
      }
    } catch (err) {
      console.error('Failed to revert:', err);
    }
  };

  return (
    <div className="texture-detail">
      <div className="detail-header">
        <button className="btn btn-secondary" onClick={onClose}>
          ← Back to Grid
        </button>
        <div className="detail-title">
          <h2>{texture.name}</h2>
          <span className="detail-category">{texture.category}</span>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-preview">
          <div className="preview-section">
            <h3>Original</h3>
            <div className="preview-image">
              {texture.originalBase64 && (
                <img src={texture.originalBase64} alt={`${texture.name} original`} />
              )}
            </div>
          </div>

          {texture.transformedBase64 && (
            <div className="preview-section">
              <h3>Transformed</h3>
              <div className="preview-image">
                <img src={texture.transformedBase64} alt={`${texture.name} transformed`} />
              </div>
              {texture.confirmed && (
                <div className="confirmed-badge">✓ Confirmed</div>
              )}
            </div>
          )}
        </div>

        <div className="detail-controls">
          <h3>Transform Settings</h3>

          <div className="form-group">
            <label htmlFor="prompt">Transformation Prompt *</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., cyberpunk neon style with glowing effects"
              rows={3}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="detail-actions">
            <button
              className="btn btn-primary"
              onClick={handleTransform}
              disabled={transforming || !prompt}
            >
              {transforming ? 'Transforming...' : 'Transform'}
            </button>

            {texture.transformedBase64 && !texture.confirmed && (
              <button className="btn btn-success" onClick={handleConfirm}>
                ✓ Confirm
              </button>
            )}

            {texture.transformedBase64 && (
              <button className="btn btn-danger" onClick={handleReset}>
                Reset to Original
              </button>
            )}
          </div>
        </div>
      </div>

      {texture.transformHistory.length > 0 && (
        <div className="detail-history">
          <h3>Transformation History ({texture.transformHistory.length})</h3>
          <div className="history-list">
            {texture.transformHistory.map((record, index) => (
              <div key={index} className="history-item">
                <div className="history-preview">
                  <img src={record.resultBase64} alt={`Version ${index + 1}`} />
                </div>
                <div className="history-info">
                  <div className="history-date">
                    {new Date(record.timestamp).toLocaleString()}
                  </div>
                  <div className="history-prompt">{record.prompt}</div>
                  <div className="history-params">
                    Strength: {record.strength.toFixed(2)} | Steps: {record.steps} |
                    Guidance: {record.guidanceScale.toFixed(1)}
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => handleRevert(index)}
                >
                  Revert to This
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

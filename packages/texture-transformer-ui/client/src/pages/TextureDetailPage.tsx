import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { TextureMetadata, Project } from '../types';
import '../components/TextureDetail.css';

export default function TextureDetailPage() {
  const { projectId, textureName } = useParams<{ projectId: string; textureName: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [texture, setTexture] = useState<TextureMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const transformer = 'gemini'; // Always use Gemini for stability
  const strength = 0.6; // Balanced strength for visible transformation
  const steps = 30;
  const guidanceScale = 7.5;
  const negativePrompt = 'blurry, deformed, distorted, disfigured, unrecognizable';
  const [transforming, setTransforming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId && textureName) {
      loadProject();
      loadTexture();
    }
  }, [projectId, textureName]);

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();
      if (data.success) {
        setProject(data.project);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    }
  };

  const loadTexture = async () => {
    try {
      const response = await fetch(`/api/textures/${projectId}`);
      const data = await response.json();
      if (data.success) {
        const foundTexture = data.textures.find((t: TextureMetadata) => t.name === textureName);
        if (foundTexture) {
          setTexture(foundTexture);
        }
      }
    } catch (error) {
      console.error('Failed to load texture:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransform = async () => {
    if (!prompt || !texture) {
      setError('Please enter a transformation prompt');
      return;
    }

    setTransforming(true);
    setError(null);

    // Build prompt with structure preservation
    const preservationPrefix = 'preserve original composition and structure, maintain recognizable features';
    const stylePrompt = project?.commonPrompt
      ? `${project.commonPrompt}, ${prompt}`
      : prompt;
    const finalPrompt = `${preservationPrefix}, ${stylePrompt}`;

    try {
      const response = await fetch(
        `/api/textures/${projectId}/${texture.name}/transform`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: finalPrompt,
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
        await loadTexture();
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
    if (!texture) return;

    try {
      const response = await fetch(
        `/api/textures/${projectId}/${texture.name}/confirm`,
        { method: 'POST' }
      );

      const data = await response.json();
      if (data.success) {
        await loadTexture();
      }
    } catch (err) {
      console.error('Failed to confirm:', err);
    }
  };

  const handleReset = async () => {
    if (!texture) return;
    if (!confirm('Reset texture to original? This will delete all transformations.')) {
      return;
    }

    try {
      const response = await fetch(`/api/textures/${projectId}/${texture.name}/reset`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        await loadTexture();
      }
    } catch (err) {
      console.error('Failed to reset:', err);
    }
  };

  const handleRevert = async (historyIndex: number) => {
    if (!texture) return;

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
        await loadTexture();
      }
    } catch (err) {
      console.error('Failed to revert:', err);
    }
  };

  const handleBack = () => {
    navigate(`/projects/${projectId}`);
  };

  if (loading) {
    return <div className="loading">Loading texture...</div>;
  }

  if (!texture) {
    return <div className="loading">Texture not found</div>;
  }

  return (
    <div className="texture-detail">
      <div className="detail-header">
        <button className="btn btn-secondary" onClick={handleBack}>
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

          {/* Preservation Info */}
          <div className="common-prompt-info" style={{ background: '#f0f5ff', borderColor: '#b3d1ff' }}>
            <div className="info-badge" style={{ background: '#007bff' }}>Structure Preservation Active</div>
            <div className="common-prompt-text">
              <strong>Preservation Mode:</strong> Original composition and features will be maintained
            </div>
            <small className="form-help-text">
              • Strength: {strength.toFixed(2)} (Lower = more preservation)
              <br />
              • Negative prompt: "{negativePrompt}"
            </small>
          </div>

          {project?.commonPrompt && (
            <div className="common-prompt-info">
              <div className="info-badge">Common Prompt Active</div>
              <div className="common-prompt-text">
                <strong>Project Common Prompt:</strong> {project.commonPrompt}
              </div>
              <small className="form-help-text">This will be prepended to your transformation prompt</small>
            </div>
          )}

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

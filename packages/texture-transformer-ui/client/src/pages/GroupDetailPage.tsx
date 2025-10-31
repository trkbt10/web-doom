import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { TextureGroup, TextureMetadata, Project } from '../types';
import './GroupDetailPage.css';

export default function GroupDetailPage() {
  const { projectId, groupId } = useParams<{ projectId: string; groupId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [group, setGroup] = useState<TextureGroup | null>(null);
  const [textures, setTextures] = useState<Map<string, TextureMetadata>>(new Map());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [transforming, setTransforming] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [prompt, setPrompt] = useState('');
  const transformer = 'gemini'; // Always use Gemini for stability
  const strength = 0.6; // Balanced strength for visible transformation while preserving structure
  const steps = 30;
  const guidanceScale = 7.5;
  const negativePrompt = 'blurry, deformed, distorted, disfigured, unrecognizable, merged sprites, overlapping boundaries, removed guidelines, modified labels, grid corruption';
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId && groupId) {
      loadProject();
      loadGroup();
      loadTextures();
    }
  }, [projectId, groupId]);

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

  const loadGroup = async () => {
    try {
      const response = await fetch(`/api/groups/${projectId}/${groupId}`);
      const data = await response.json();
      if (data.success) {
        setGroup(data.group);
      }
    } catch (error) {
      console.error('Failed to load group:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTextures = async () => {
    try {
      const response = await fetch(`/api/textures/${projectId}`);
      const data = await response.json();
      if (data.success) {
        const textureMap = new Map<string, TextureMetadata>();
        for (const texture of data.textures) {
          textureMap.set(texture.name, texture);
        }
        setTextures(textureMap);
      }
    } catch (error) {
      console.error('Failed to load textures:', error);
    }
  };

  const handleGenerateSpriteSheet = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/groups/${projectId}/${groupId}/generate-sprite`,
        { method: 'POST' }
      );

      const data = await response.json();
      if (data.success) {
        setGroup(data.group);
      } else {
        setError(data.error || 'Failed to generate sprite sheet');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setGenerating(false);
    }
  };

  const handleTransform = async () => {
    if (!prompt.trim()) {
      setError('Please enter a transformation prompt');
      return;
    }

    setTransforming(true);
    setError(null);

    // Build sprite-sheet specific prompt with detailed guideline explanation
    const spriteSheetInstructions =
      'This is a sprite sheet containing multiple individual game sprites with clear boundary markers. ' +
      'Layout structure: ' +
      '- Lime green dashed rectangles mark the OUTER CELL boundaries (allocated space for each sprite). ' +
      '- Cyan solid rectangles mark the INNER CONTENT boundaries (actual sprite image area). ' +
      '- White text labels below each sprite show the sprite name. ' +
      '- The actual sprite image is within the cyan rectangle. DO NOT modify anything outside the cyan boundaries. ' +
      'CRITICAL RULES: ' +
      '1. Transform ONLY the content within each cyan rectangle. ' +
      '2. Each sprite is independent - do NOT blend sprites together. ' +
      '3. Preserve the exact position and size of each cyan content area. ' +
      '4. Do NOT modify the lime boundaries, labels, or grid structure. ' +
      '5. Keep each sprite recognizable and maintain its distinct identity within its cyan box.';

    const stylePrompt = project?.commonPrompt
      ? `${project.commonPrompt}, ${prompt}`
      : prompt;

    const finalPrompt = `${spriteSheetInstructions} Style: ${stylePrompt}`;

    try {
      const response = await fetch(
        `/api/groups/${projectId}/${groupId}/transform`,
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
        setGroup(data.group);
      } else {
        setError(data.error || 'Transformation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setTransforming(false);
    }
  };

  const handleExtractTextures = async () => {
    setExtracting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/groups/${projectId}/${groupId}/extract`,
        { method: 'POST' }
      );

      const data = await response.json();
      if (data.success) {
        alert(`✅ Successfully extracted ${data.textures?.length || group?.textureNames.length || 0} textures!\n\nIndividual textures have been updated and saved.`);
        // Reload textures to show updated transformations
        loadTextures();
      } else {
        setError(data.error || 'Failed to extract textures');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setExtracting(false);
    }
  };

  const handleBack = () => {
    navigate(`/projects/${projectId}/groups`);
  };

  if (loading) {
    return <div className="loading">Loading group...</div>;
  }

  if (!group) {
    return <div className="loading">Group not found</div>;
  }

  return (
    <div className="group-detail-page">
      <div className="group-detail-header">
        <button className="btn btn-secondary" onClick={handleBack}>
          ← Back to Project
        </button>
        <div className="group-detail-title">
          <h2>{group.name}</h2>
          {group.description && <p>{group.description}</p>}
        </div>
      </div>

      <div className="group-detail-stats">
        <div className="stat">
          <span className="stat-label">Textures:</span>
          <span className="stat-value">{group.textureNames.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Transforms:</span>
          <span className="stat-value">{group.transformHistory.length}</span>
        </div>
        {group.spriteSheetWidth && (
          <div className="stat">
            <span className="stat-label">Sprite Size:</span>
            <span className="stat-value">
              {group.spriteSheetWidth}x{group.spriteSheetHeight}
            </span>
          </div>
        )}
      </div>

      <div className="group-detail-content">
        {/* Step 1: Generate Sprite Sheet */}
        <div className="workflow-step">
          <h3>Step 1: Generate Sprite Sheet</h3>
          <p>Combine all textures into a single sprite sheet for consistent transformation</p>

          <button
            className="btn btn-primary"
            onClick={handleGenerateSpriteSheet}
            disabled={generating}
          >
            {generating ? 'Generating...' : (group.spriteSheetBase64 ? 'Regenerate Sprite Sheet' : 'Generate Sprite Sheet')}
          </button>

          {group.spriteSheetBase64 && (
            <div className="sprite-sheet-preview">
              <img
                src={group.spriteSheetBase64}
                alt="Sprite Sheet"
                className="sprite-sheet-image"
              />
              <div className="sprite-sheet-info">
                ✓ Sprite sheet generated ({group.spriteSheetWidth}x{group.spriteSheetHeight})
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Transform */}
        {group.spriteSheetBase64 && (
          <div className="workflow-step">
            <h3>Step 2: Transform Sprite Sheet</h3>
            <p>Apply AI transformation to the entire sprite sheet at once</p>

            <div className="transform-controls">
              {/* Guideline Structure Info */}
              <div className="common-prompt-info" style={{ background: '#f0fff4', borderColor: '#9ae6b4' }}>
                <div className="info-badge" style={{ background: '#38a169' }}>Sprite Sheet Guidelines Active</div>
                <div className="common-prompt-text">
                  <strong>Boundary Markers:</strong> Lime (outer cell) + Cyan (sprite area) + Name labels
                </div>
                <small className="form-help-text">
                  • Each sprite has padding around it to prevent overlap
                  <br />
                  • Sprite names are displayed below each image
                  <br />
                  • AI will transform only within cyan boundaries
                </small>
              </div>

              {/* Preservation Info */}
              <div className="common-prompt-info" style={{ background: '#f0f5ff', borderColor: '#b3d1ff' }}>
                <div className="info-badge" style={{ background: '#007bff' }}>Structure Preservation Active</div>
                <div className="common-prompt-text">
                  <strong>Preservation Mode:</strong> Original composition and features will be maintained
                </div>
                <small className="form-help-text">
                  • Strength: {strength.toFixed(2)} (Balanced for visible transformation)
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

              <button
                className="btn btn-primary"
                onClick={handleTransform}
                disabled={transforming || !prompt.trim()}
              >
                {transforming ? 'Transforming...' : 'Transform Sprite Sheet'}
              </button>
            </div>

            {group.transformedSpriteSheetBase64 && (
              <div className="sprite-sheet-preview">
                <img
                  src={group.transformedSpriteSheetBase64}
                  alt="Transformed Sprite Sheet"
                  className="sprite-sheet-image"
                />
                <div className="sprite-sheet-info">✓ Sprite sheet transformed</div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Extract */}
        {group.transformedSpriteSheetBase64 && (
          <div className="workflow-step">
            <h3>Step 3: Extract Individual Textures</h3>
            <p>Split the transformed sprite sheet back into individual textures</p>
            <button
              className="btn btn-success"
              onClick={handleExtractTextures}
              disabled={extracting}
            >
              {extracting ? 'Extracting...' : 'Extract Textures'}
            </button>
          </div>
        )}

        {/* Texture List */}
        <div className="workflow-step">
          <h3>Textures in Group ({group.textureNames.length})</h3>
          <div className="texture-preview-grid">
            {group.textureNames.map((name) => {
              const texture = textures.get(name);
              return (
                <div key={name} className="texture-preview-item">
                  <div className="texture-preview-image">
                    {texture?.originalBase64 ? (
                      <img
                        src={texture.transformedBase64 || texture.originalBase64}
                        alt={name}
                        className="texture-thumb-image"
                      />
                    ) : (
                      <div className="texture-thumb-placeholder">{name.substring(0, 2)}</div>
                    )}
                  </div>
                  <div className="texture-preview-name">{name}</div>
                  {texture?.transformedBase64 && (
                    <div className="texture-preview-badge">✓</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Transform History */}
        {group.transformHistory.length > 0 && (
          <div className="workflow-step">
            <h3>Transform History</h3>
            <div className="history-list">
              {group.transformHistory.map((record, index) => (
                <div key={index} className="history-item">
                  <div className="history-preview">
                    <img src={record.resultBase64} alt={`Transform ${index + 1}`} />
                  </div>
                  <div className="history-info">
                    <div className="history-date">
                      {new Date(record.timestamp).toLocaleString()}
                    </div>
                    <div className="history-prompt">{record.prompt}</div>
                    <div className="history-params">
                      {record.transformer} | Strength: {record.strength.toFixed(2)} | Steps:{' '}
                      {record.steps} | Guidance: {record.guidanceScale.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

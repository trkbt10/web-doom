import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProjectPageLayout from '../components/ProjectPageLayout';
import TextureGrid from '../components/TextureGrid';
import ExportPanel from '../components/ExportPanel';
import ProjectSettingsModal from '../components/ProjectSettingsModal';
import { useProject } from '../contexts/ProjectContext';
import type { TextureMetadata } from '../types';
import '../components/ProjectView.css';

/**
 * ProjectDetailPage - Main project view showing texture grid
 *
 * Uses ProjectContext for data (single source of truth)
 * Uses ProjectPageLayout for consistent structure
 */
export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // Get data from context (source of truth)
  const {
    project,
    textures,
    progressPercentage,
    refreshAll,
    updateProject,
  } = useProject();

  // Local UI state
  const [extracting, setExtracting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'transformed' | 'pending'>('all');
  const [showExport, setShowExport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Computed values from source of truth
  const transformedCount = textures.filter((t) => t.transformedBase64).length;
  const pendingCount = textures.length - transformedCount;

  const handleExtractTextures = async () => {
    if (!project) return;

    setExtracting(true);
    try {
      const response = await fetch(`/api/textures/${projectId}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wadPath: project.wadFile }),
      });

      const data = await response.json();
      if (data.success) {
        await refreshAll();
      }
    } catch (error) {
      console.error('Failed to extract textures:', error);
    } finally {
      setExtracting(false);
    }
  };

  const handleSelectTexture = (texture: TextureMetadata) => {
    navigate(`/projects/${projectId}/textures/${texture.name}`);
  };

  const handleSaveSettings = async (commonPrompt: string) => {
    if (!projectId) return;

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commonPrompt }),
      });

      const data = await response.json();
      if (data.success) {
        updateProject(data.project);
        setShowSettings(false);
      }
    } catch (error) {
      console.error('Failed to save project settings:', error);
    }
  };

  // Filter textures based on selection
  const filteredTextures = textures.filter((texture) => {
    if (filter === 'transformed') return texture.transformedBase64;
    if (filter === 'pending') return !texture.transformedBase64;
    return true;
  });

  return (
    <ProjectPageLayout backPath="/" backLabel="← Back to Projects">
      {/* Progress Stats */}
      <div className="project-stats">
        <div className="stat">
          <span className="stat-label">Progress:</span>
          <span className="stat-value">{progressPercentage}%</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="project-quick-actions">
        <button
          className="btn btn-primary"
          onClick={() => navigate(`/projects/${projectId}/groups`)}
        >
          📁 Manage Texture Groups
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => setShowSettings(true)}
        >
          ⚙️ Project Settings
        </button>
      </div>

      {/* Empty State */}
      {textures.length === 0 && (
        <div className="empty-textures">
          <p>No textures extracted yet</p>
          <button
            className="btn btn-primary"
            onClick={handleExtractTextures}
            disabled={extracting}
          >
            {extracting ? 'Extracting...' : 'Extract Textures from WAD'}
          </button>
        </div>
      )}

      {/* Texture Grid with Filters */}
      {textures.length > 0 && (
        <>
          <div className="texture-filters">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({textures.length})
            </button>
            <button
              className={`filter-btn ${filter === 'transformed' ? 'active' : ''}`}
              onClick={() => setFilter('transformed')}
            >
              Transformed ({transformedCount})
            </button>
            <button
              className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending ({pendingCount})
            </button>
            <div style={{ flex: 1 }} />
            <button className="btn btn-success" onClick={() => setShowExport(!showExport)}>
              📦 Export
            </button>
          </div>

          {showExport && project && (
            <ExportPanel projectId={project.id} projectName={project.name} />
          )}

          <TextureGrid
            textures={filteredTextures}
            onSelectTexture={handleSelectTexture}
          />
        </>
      )}

      {/* Modals */}
      {showSettings && project && (
        <ProjectSettingsModal
          project={project}
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
        />
      )}
    </ProjectPageLayout>
  );
}

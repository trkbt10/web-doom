import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TextureGrid from '../components/TextureGrid';
import ExportPanel from '../components/ExportPanel';
import ProjectSettingsModal from '../components/ProjectSettingsModal';
import ProjectHeader from '../components/ProjectHeader';
import type { Project, TextureMetadata } from '../types';
import '../components/ProjectView.css';

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [textures, setTextures] = useState<TextureMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [filter, setFilter] = useState<'all' | 'transformed' | 'pending'>('all');
  const [showExport, setShowExport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadTextures();
    }
  }, [projectId]);

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

  const loadTextures = async () => {
    try {
      const response = await fetch(`/api/textures/${projectId}`);
      const data = await response.json();
      if (data.success) {
        setTextures(data.textures);
      }
    } catch (error) {
      console.error('Failed to load textures:', error);
    } finally {
      setLoading(false);
    }
  };

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
        await loadTextures();
        await loadProject();
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
        setProject(data.project);
        setShowSettings(false);
      }
    } catch (error) {
      console.error('Failed to save project settings:', error);
    }
  };

  const handleCompileWAD = async () => {
    if (!projectId) return;

    setCompiling(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/compile`, {
        method: 'POST',
      });

      if (response.ok) {
        // Download the WAD file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project?.name.toLowerCase().replace(/\s+/g, '-') || 'custom'}.wad`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        alert('✅ WAD file compiled and downloaded successfully!');
      } else {
        const data = await response.json();
        alert(`❌ Failed to compile WAD: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to compile WAD:', error);
      alert(`❌ Failed to compile WAD: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCompiling(false);
    }
  };

  const filteredTextures = textures.filter((texture) => {
    if (filter === 'transformed') return texture.transformedBase64;
    if (filter === 'pending') return !texture.transformedBase64;
    return true;
  });

  if (!project) {
    return <div className="loading">Loading project...</div>;
  }

  return (
    <div className="project-view">
      <div className="project-view-header">
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          ← Back to Projects
        </button>
      </div>

      <ProjectHeader
        project={project}
        textures={textures}
        onCompileWAD={handleCompileWAD}
        compiling={compiling}
      />

      <div className="project-stats">
        <div className="stat">
          <span className="stat-label">Progress:</span>
          <span className="stat-value">
            {project.textureCount > 0
              ? `${Math.round((project.transformedCount / project.textureCount) * 100)}%`
              : '0%'}
          </span>
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

      {textures.length === 0 && !loading && (
        <div className="empty-textures">
          <p>No textures extracted yet</p>
          <button className="btn btn-primary" onClick={handleExtractTextures} disabled={extracting}>
            {extracting ? 'Extracting...' : 'Extract Textures from WAD'}
          </button>
        </div>
      )}

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
              Transformed ({textures.filter((t) => t.transformedBase64).length})
            </button>
            <button
              className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending ({textures.filter((t) => !t.transformedBase64).length})
            </button>
            <div style={{ flex: 1 }} />
            <button className="btn btn-success" onClick={() => setShowExport(!showExport)}>
              📦 Export
            </button>
          </div>

          {showExport && <ExportPanel projectId={project.id} projectName={project.name} />}

          <TextureGrid
            textures={filteredTextures}
            onSelectTexture={handleSelectTexture}
          />
        </>
      )}

      {loading && <div className="loading">Loading textures...</div>}

      {showSettings && project && (
        <ProjectSettingsModal
          project={project}
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  );
}

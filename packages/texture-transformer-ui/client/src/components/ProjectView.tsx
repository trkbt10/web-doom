import { useState, useEffect } from 'react';
import type { Project, TextureMetadata } from '../types';
import TextureGrid from './TextureGrid';
import TextureDetail from './TextureDetail';
import ExportPanel from './ExportPanel';
import './ProjectView.css';

interface ProjectViewProps {
  project: Project;
  onBack: () => void;
  onProjectUpdate: (project: Project) => void;
}

export default function ProjectView({ project, onBack, onProjectUpdate }: ProjectViewProps) {
  const [textures, setTextures] = useState<TextureMetadata[]>([]);
  const [selectedTexture, setSelectedTexture] = useState<TextureMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'transformed' | 'pending'>('all');
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    loadTextures();
  }, [project.id]);

  const loadTextures = async () => {
    try {
      const response = await fetch(`/api/textures/${project.id}`);
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
    setExtracting(true);
    try {
      const response = await fetch(`/api/textures/${project.id}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wadPath: project.wadFile }),
      });

      const data = await response.json();
      if (data.success) {
        await loadTextures();
        // Reload project to update counts
        const projectResponse = await fetch(`/api/projects/${project.id}`);
        const projectData = await projectResponse.json();
        if (projectData.success) {
          onProjectUpdate(projectData.project);
        }
      }
    } catch (error) {
      console.error('Failed to extract textures:', error);
    } finally {
      setExtracting(false);
    }
  };

  const handleTextureUpdate = async () => {
    await loadTextures();
    // Reload project to update counts
    const response = await fetch(`/api/projects/${project.id}`);
    const data = await response.json();
    if (data.success) {
      onProjectUpdate(data.project);
    }
  };

  const filteredTextures = textures.filter((texture) => {
    if (filter === 'transformed') return texture.transformedBase64;
    if (filter === 'pending') return !texture.transformedBase64;
    return true;
  });

  return (
    <div className="project-view">
      <div className="project-view-header">
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back to Projects
        </button>
        <div className="project-info">
          <h2>{project.name}</h2>
          <p>{project.description}</p>
        </div>
      </div>

      <div className="project-stats">
        <div className="stat">
          <span className="stat-label">Total Textures:</span>
          <span className="stat-value">{project.textureCount}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Transformed:</span>
          <span className="stat-value">{project.transformedCount}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Progress:</span>
          <span className="stat-value">
            {project.textureCount > 0
              ? `${Math.round((project.transformedCount / project.textureCount) * 100)}%`
              : '0%'}
          </span>
        </div>
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

          {selectedTexture ? (
            <TextureDetail
              projectId={project.id}
              texture={selectedTexture}
              onClose={() => setSelectedTexture(null)}
              onUpdate={handleTextureUpdate}
            />
          ) : (
            <TextureGrid
              textures={filteredTextures}
              onSelectTexture={setSelectedTexture}
            />
          )}
        </>
      )}

      {loading && <div className="loading">Loading textures...</div>}
    </div>
  );
}

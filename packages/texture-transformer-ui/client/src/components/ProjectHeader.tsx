import type { Project, TextureMetadata } from '../types';
import './ProjectHeader.css';

interface ProjectHeaderProps {
  project: Project;
  textures: TextureMetadata[];
  onCompileWAD: () => void;
  compiling?: boolean;
}

export default function ProjectHeader({ project, textures, onCompileWAD, compiling = false }: ProjectHeaderProps) {
  // Always calculate from actual texture array to avoid inconsistencies
  const textureCount = textures.length;
  const transformedCount = textures.filter((t) => t.transformedBase64).length;

  return (
    <div className="project-header">
      <div className="project-header-content">
        <div className="project-info">
          <h1>{project.name}</h1>
          <div className="project-stats">
            <span className="stat">
              📦 {textureCount} textures
            </span>
            <span className="stat">
              ✨ {transformedCount} transformed
            </span>
          </div>
        </div>
        <div className="project-actions">
          <button
            className="btn btn-primary btn-large"
            onClick={onCompileWAD}
            disabled={compiling}
          >
            {compiling ? '⏳ Compiling...' : '🎮 Compile WAD'}
          </button>
        </div>
      </div>
    </div>
  );
}

import type { Project } from '../types';
import './ProjectList.css';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

export default function ProjectList({
  projects,
  onSelectProject,
  onDeleteProject,
}: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="empty-state">
        <h2>No projects yet</h2>
        <p>Create a new project to start transforming WAD textures</p>
      </div>
    );
  }

  return (
    <div className="project-list">
      {projects.map((project) => (
        <div key={project.id} className="project-card">
          <div className="project-header">
            <h3>{project.name}</h3>
            <span className="project-date">
              {new Date(project.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="project-details">
            <div className="project-detail-item">
              <span className="label">WAD File:</span>
              <span className="value">{project.wadFile}</span>
            </div>
            <div className="project-detail-item">
              <span className="label">Textures:</span>
              <span className="value">
                {project.transformedCount} / {project.textureCount} transformed
              </span>
            </div>
            {project.description && (
              <div className="project-detail-item">
                <span className="label">Description:</span>
                <span className="value">{project.description}</span>
              </div>
            )}
          </div>

          <div className="project-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${project.textureCount > 0 ? (project.transformedCount / project.textureCount) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="progress-text">
              {project.textureCount > 0
                ? `${Math.round((project.transformedCount / project.textureCount) * 100)}%`
                : '0%'}
            </span>
          </div>

          <div className="project-actions">
            <button className="btn btn-primary" onClick={() => onSelectProject(project)}>
              Open Project
            </button>
            <button
              className="btn btn-danger"
              onClick={() => onDeleteProject(project.id)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

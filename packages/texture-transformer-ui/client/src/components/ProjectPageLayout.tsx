import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectHeader from './ProjectHeader';
import { useProject } from '../contexts/ProjectContext';
import './ProjectView.css';

/**
 * ProjectPageLayout - Common layout for all project-related pages
 *
 * Provides consistent structure:
 * - Back navigation button
 * - ProjectHeader with compile functionality
 * - Loading states
 * - Children content area
 *
 * This ensures all project pages have the same look and feel.
 */

interface ProjectPageLayoutProps {
  /** Page-specific content */
  children: ReactNode;
  /** Where the back button should navigate to */
  backPath: string;
  /** Label for the back button */
  backLabel?: string;
}

export default function ProjectPageLayout({
  children,
  backPath,
  backLabel = '← Back',
}: ProjectPageLayoutProps) {
  const navigate = useNavigate();
  const { project, textures, loading, compiling, compileWAD } = useProject();

  // Show loading state while project is being fetched
  if (!project) {
    return <div className="loading">Loading project...</div>;
  }

  return (
    <div className="project-view">
      {/* Navigation Header */}
      <div className="project-view-header">
        <button className="btn btn-secondary" onClick={() => navigate(backPath)}>
          {backLabel}
        </button>
      </div>

      {/* Project Header (consistent across all pages) */}
      <ProjectHeader
        project={project}
        textures={textures}
        onCompileWAD={compileWAD}
        compiling={compiling}
      />

      {/* Page-specific content */}
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        children
      )}
    </div>
  );
}

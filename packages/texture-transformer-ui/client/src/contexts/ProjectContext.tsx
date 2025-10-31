import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import type { Project, TextureMetadata } from '../types';

/**
 * ProjectContext - Single Source of Truth for project data
 *
 * This context provides centralized state management for:
 * - Project metadata
 * - Textures list
 * - Loading states
 * - Data fetching and refresh operations
 *
 * All pages within a project should use this context to ensure data consistency.
 */

interface ProjectContextValue {
  // Data (Source of Truth)
  project: Project | null;
  textures: TextureMetadata[];

  // Loading states
  loading: boolean;
  compiling: boolean;

  // Computed values (always calculated from source of truth)
  textureCount: number;
  transformedCount: number;
  pendingCount: number;
  progressPercentage: number;

  // Actions
  refreshProject: () => Promise<void>;
  refreshTextures: () => Promise<void>;
  refreshAll: () => Promise<void>;
  compileWAD: () => Promise<void>;
  updateProject: (updates: Partial<Project>) => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { projectId } = useParams<{ projectId: string }>();

  // Source of Truth
  const [project, setProject] = useState<Project | null>(null);
  const [textures, setTextures] = useState<TextureMetadata[]>([]);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [compiling, setCompiling] = useState(false);

  // Computed values (always calculated from source of truth)
  const textureCount = textures.length;
  const transformedCount = textures.filter((t) => t.transformedBase64).length;
  const pendingCount = textureCount - transformedCount;
  const progressPercentage = textureCount > 0
    ? Math.round((transformedCount / textureCount) * 100)
    : 0;

  // Load project metadata
  const refreshProject = async () => {
    if (!projectId) return;

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

  // Load textures list
  const refreshTextures = async () => {
    if (!projectId) return;

    try {
      const response = await fetch(`/api/textures/${projectId}`);
      const data = await response.json();
      if (data.success) {
        setTextures(data.textures);
      }
    } catch (error) {
      console.error('Failed to load textures:', error);
    }
  };

  // Refresh all data
  const refreshAll = async () => {
    setLoading(true);
    try {
      await Promise.all([refreshProject(), refreshTextures()]);
    } finally {
      setLoading(false);
    }
  };

  // Compile WAD file
  const compileWAD = async () => {
    if (!projectId || !project) return;

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
        a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}.wad`;
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

  // Update project in state (optimistic update)
  const updateProject = (updates: Partial<Project>) => {
    if (project) {
      setProject({ ...project, ...updates });
    }
  };

  // Initial load
  useEffect(() => {
    if (projectId) {
      refreshAll();
    }
  }, [projectId]);

  const value: ProjectContextValue = {
    project,
    textures,
    loading,
    compiling,
    textureCount,
    transformedCount,
    pendingCount,
    progressPercentage,
    refreshProject,
    refreshTextures,
    refreshAll,
    compileWAD,
    updateProject,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

/**
 * Hook to access project context
 * Throws error if used outside ProjectProvider
 */
export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

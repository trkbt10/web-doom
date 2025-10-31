import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TextureGroupList from '../components/TextureGroupList';
import CreateGroupModal from '../components/CreateGroupModal';
import AutoSuggestModal from '../components/AutoSuggestModal';
import ProjectHeader from '../components/ProjectHeader';
import type { Project, TextureGroup, TextureMetadata, GroupSuggestion } from '../types';
import './GroupsListPage.css';

export default function GroupsListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [groups, setGroups] = useState<TextureGroup[]>([]);
  const [textures, setTextures] = useState<TextureMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [compiling, setCompiling] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAutoSuggest, setShowAutoSuggest] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadGroups();
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

  const loadGroups = async () => {
    try {
      const response = await fetch(`/api/groups/${projectId}`);
      const data = await response.json();
      if (data.success) {
        setGroups(data.groups);
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
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
    }
  };

  const handleCreateGroup = async (data: {
    name: string;
    textureNames: string[];
    description?: string;
  }) => {
    try {
      const response = await fetch(`/api/groups/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.success) {
        setGroups([result.group, ...groups]);
        setShowCreateGroup(false);
        navigate(`/projects/${projectId}/groups/${result.group.id}`);
      }
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const handleSelectGroup = (group: TextureGroup) => {
    navigate(`/projects/${projectId}/groups/${group.id}`);
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) {
      return;
    }

    try {
      const response = await fetch(`/api/groups/${projectId}/${groupId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setGroups(groups.filter((g) => g.id !== groupId));
      }
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  };

  const handleCreateGroupsFromSuggestions = async (suggestions: GroupSuggestion[]) => {
    try {
      const response = await fetch(`/api/groups/${projectId}/batch-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestions }),
      });

      const data = await response.json();
      if (data.success) {
        setGroups([...data.groups, ...groups]);
        setShowAutoSuggest(false);
        await loadProject();
      }
    } catch (error) {
      console.error('Failed to create groups from suggestions:', error);
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

  if (!project) {
    return <div className="loading">Loading project...</div>;
  }

  return (
    <div className="groups-list-page">
      <div className="groups-list-header">
        <button className="btn btn-secondary" onClick={() => navigate(`/projects/${projectId}`)}>
          ← Back to Project
        </button>
      </div>

      <ProjectHeader
        project={project}
        textures={textures}
        onCompileWAD={handleCompileWAD}
        compiling={compiling}
      />

      <div className="groups-list-toolbar">
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateGroup(true)}
          disabled={textures.length === 0}
        >
          + Create Group
        </button>
        <button
          className="btn btn-success"
          onClick={() => setShowAutoSuggest(true)}
          disabled={textures.length === 0 || project.autoSuggestExecuted}
        >
          🤖 Auto-Suggest Groups
        </button>
        {project.autoSuggestExecuted && (
          <span className="toolbar-message">Auto-suggest already executed</span>
        )}
        {textures.length === 0 && (
          <span className="toolbar-message">Extract textures first to create groups</span>
        )}
      </div>

      <div className="groups-list-stats">
        <div className="stat">
          <span className="stat-label">Total Groups:</span>
          <span className="stat-value">{groups.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Total Textures:</span>
          <span className="stat-value">{textures.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Grouped Textures:</span>
          <span className="stat-value">
            {groups.reduce((sum, g) => sum + g.textureNames.length, 0)}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading groups...</div>
      ) : (
        <TextureGroupList
          groups={groups}
          textures={new Map(textures.map((t) => [t.name, t]))}
          onSelectGroup={handleSelectGroup}
          onDeleteGroup={handleDeleteGroup}
        />
      )}

      {showCreateGroup && (
        <CreateGroupModal
          textures={textures}
          onClose={() => setShowCreateGroup(false)}
          onCreate={handleCreateGroup}
        />
      )}

      {showAutoSuggest && (
        <AutoSuggestModal
          projectId={project.id}
          textureNames={textures.map((t) => t.name)}
          onClose={() => setShowAutoSuggest(false)}
          onCreateGroups={handleCreateGroupsFromSuggestions}
        />
      )}
    </div>
  );
}

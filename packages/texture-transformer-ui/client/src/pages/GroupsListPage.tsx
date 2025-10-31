import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProjectPageLayout from '../components/ProjectPageLayout';
import TextureGroupList from '../components/TextureGroupList';
import CreateGroupModal from '../components/CreateGroupModal';
import AutoSuggestModal from '../components/AutoSuggestModal';
import { useProject } from '../contexts/ProjectContext';
import type { TextureGroup, GroupSuggestion } from '../types';
import './GroupsListPage.css';

/**
 * GroupsListPage - Texture groups management view
 *
 * Uses ProjectContext for data (single source of truth)
 * Uses ProjectPageLayout for consistent structure
 */
export default function GroupsListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // Get data from context (source of truth)
  const { project, textures, refreshProject } = useProject();

  // Local state for groups (groups are specific to this page)
  const [groups, setGroups] = useState<TextureGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAutoSuggest, setShowAutoSuggest] = useState(false);

  // Load groups
  useEffect(() => {
    if (projectId) {
      loadGroups();
    }
  }, [projectId]);

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
        await refreshProject();
      }
    } catch (error) {
      console.error('Failed to create groups from suggestions:', error);
    }
  };

  // Computed values from source of truth
  const groupedTextureCount = groups.reduce((sum, g) => sum + g.textureNames.length, 0);

  return (
    <ProjectPageLayout
      backPath={`/projects/${projectId}`}
      backLabel="← Back to Project"
    >
      {/* Toolbar */}
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
          disabled={textures.length === 0 || project?.autoSuggestExecuted}
        >
          🤖 Auto-Suggest Groups
        </button>
        {project?.autoSuggestExecuted && (
          <span className="toolbar-message">Auto-suggest already executed</span>
        )}
        {textures.length === 0 && (
          <span className="toolbar-message">Extract textures first to create groups</span>
        )}
      </div>

      {/* Stats */}
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
          <span className="stat-value">{groupedTextureCount}</span>
        </div>
      </div>

      {/* Groups List */}
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

      {/* Modals */}
      {showCreateGroup && (
        <CreateGroupModal
          textures={textures}
          onClose={() => setShowCreateGroup(false)}
          onCreate={handleCreateGroup}
        />
      )}

      {showAutoSuggest && project && (
        <AutoSuggestModal
          projectId={project.id}
          textureNames={textures.map((t) => t.name)}
          onClose={() => setShowAutoSuggest(false)}
          onCreateGroups={handleCreateGroupsFromSuggestions}
        />
      )}
    </ProjectPageLayout>
  );
}

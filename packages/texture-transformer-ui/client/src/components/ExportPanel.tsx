import { useState } from 'react';
import './ExportPanel.css';

interface ExportPanelProps {
  projectId: string;
  projectName: string;
}

export default function ExportPanel({ projectId, projectName }: ExportPanelProps) {
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState<'wad' | 'project' | null>(null);

  const handleExportWAD = async () => {
    setExporting(true);
    setExportType('wad');

    try {
      const response = await fetch(`/api/export/${projectId}/wad`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        alert(
          `WAD exported successfully!\n${data.replacedCount} textures replaced.\nFile: ${data.filePath}`
        );
      } else {
        alert(`Export failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Export WAD error:', error);
      alert('Export failed');
    } finally {
      setExporting(false);
      setExportType(null);
    }
  };

  const handleExportProject = async () => {
    setExporting(true);
    setExportType('project');

    try {
      const response = await fetch(`/api/export/${projectId}/project`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success) {
        alert(`Project exported successfully!\nFile: ${data.filePath}`);
      } else {
        alert(`Export failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Export project error:', error);
      alert('Export failed');
    } finally {
      setExporting(false);
      setExportType(null);
    }
  };

  const handleExportJSON = async () => {
    try {
      const response = await fetch(`/api/export/${projectId}/json`, {
        method: 'POST',
      });

      const data = await response.json();
      if (data.success && data.data) {
        // Download as JSON file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName}-metadata.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert(`Export failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Export JSON error:', error);
      alert('Export failed');
    }
  };

  return (
    <div className="export-panel">
      <h3>Export Options</h3>

      <div className="export-options">
        <div className="export-option">
          <h4>📦 Export Transformed WAD</h4>
          <p>Create a new WAD file with all transformed textures</p>
          <button
            className="btn btn-primary"
            onClick={handleExportWAD}
            disabled={exporting}
          >
            {exporting && exportType === 'wad' ? 'Exporting...' : 'Export WAD'}
          </button>
        </div>

        <div className="export-option">
          <h4>💾 Export Project Archive</h4>
          <p>Export entire project with all images and metadata</p>
          <button
            className="btn btn-secondary"
            onClick={handleExportProject}
            disabled={exporting}
          >
            {exporting && exportType === 'project'
              ? 'Exporting...'
              : 'Export Project'}
          </button>
        </div>

        <div className="export-option">
          <h4>📄 Export Metadata (JSON)</h4>
          <p>Export project and texture metadata as JSON</p>
          <button className="btn btn-secondary" onClick={handleExportJSON}>
            Export JSON
          </button>
        </div>
      </div>
    </div>
  );
}

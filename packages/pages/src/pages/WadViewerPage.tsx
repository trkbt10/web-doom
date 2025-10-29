import { useState, useRef, DragEvent } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import {
  decode,
  validate,
  getMetadata,
  printStructure,
  type WadFile,
  type WadMetadata,
  type WadValidationResult,
} from '@web-doom/wad';
import WadViewerMainPage from './WadViewer/WadViewerMainPage';
import TextureGalleryPage from './WadViewer/TextureGalleryPage';
import AudioPreviewPage from './WadViewer/AudioPreviewPage';
import './WadViewerPage.css';

function WadViewerPage() {
  const [wadFile, setWadFile] = useState<WadFile | null>(null);
  const [metadata, setMetadata] = useState<WadMetadata | null>(null);
  const [validation, setValidation] = useState<WadValidationResult | null>(null);
  const [structure, setStructure] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    try {
      setError('');
      const arrayBuffer = await file.arrayBuffer();
      const wad = decode(arrayBuffer);
      const meta = getMetadata(wad);
      const validationResult = validate(wad);
      const structureText = printStructure(wad);

      setWadFile(wad);
      setMetadata(meta);
      setValidation(validationResult);
      setStructure(structureText);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse WAD file');
      setWadFile(null);
      setMetadata(null);
      setValidation(null);
      setStructure('');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="wad-viewer-page">
      <div className="wad-viewer-container">
        <header className="page-header">
          <h1>WAD Viewer</h1>
          <p>View and analyze DOOM WAD files</p>
        </header>

        <div
          className={`file-upload ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".wad"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div className="upload-content">
            <div className="upload-icon">📁</div>
            <p className="upload-text">
              {isDragging ? 'Drop WAD file here' : 'Click or drag WAD file here'}
            </p>
            <p className="upload-hint">Supports .wad files</p>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {wadFile && metadata && validation && (
          <>
            <nav className="wad-viewer-nav">
              <NavLink
                to="/wad-viewer"
                end
                className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
              >
                Overview
              </NavLink>
              <NavLink
                to="/wad-viewer/textures"
                className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
              >
                Textures
              </NavLink>
              <NavLink
                to="/wad-viewer/audio"
                className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
              >
                Audio
              </NavLink>
            </nav>

            <Routes>
              <Route
                index
                element={
                  <WadViewerMainPage
                    wadFile={wadFile}
                    metadata={metadata}
                    validation={validation}
                    structure={structure}
                  />
                }
              />
              <Route
                path="textures"
                element={<TextureGalleryPage wadFile={wadFile} />}
              />
              <Route
                path="audio"
                element={<AudioPreviewPage wadFile={wadFile} />}
              />
            </Routes>
          </>
        )}
      </div>
    </div>
  );
}

export default WadViewerPage;

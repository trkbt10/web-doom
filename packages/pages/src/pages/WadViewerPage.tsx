import { useState, useRef, DragEvent } from 'react';
import {
  decode,
  validate,
  getMetadata,
  printStructure,
  type WadFile,
  type WadMetadata,
  type WadValidationResult,
} from '@web-doom/wad';
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
          <div className="wad-info">
            <section className="info-section">
              <h2>File Information</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Type:</span>
                  <span className="info-value">{metadata.type}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Lumps:</span>
                  <span className="info-value">{metadata.lumpCount}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Total Size:</span>
                  <span className="info-value">{metadata.totalSize} bytes</span>
                </div>
              </div>
            </section>

            <section className="info-section">
              <h2>Validation</h2>
              <div className={`validation-status ${validation.valid ? 'valid' : 'invalid'}`}>
                {validation.valid ? '✓ Valid WAD file' : '✗ Invalid WAD file'}
              </div>
              {validation.errors && validation.errors.length > 0 && (
                <div className="validation-errors">
                  <h3>Errors:</h3>
                  <ul>
                    {validation.errors.map((error: string, index: number) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              {validation.warnings && validation.warnings.length > 0 && (
                <div className="validation-warnings">
                  <h3>Warnings:</h3>
                  <ul>
                    {validation.warnings.map((warning: string, index: number) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section className="info-section">
              <h2>Structure</h2>
              <div className="structure-view">
                <pre>{structure}</pre>
              </div>
            </section>

            <section className="info-section">
              <h2>Lumps ({wadFile.lumps.length})</h2>
              <div className="lumps-list">
                {wadFile.lumps.map((lump: any, index: number) => (
                  <div key={index} className="lump-item">
                    <span className="lump-name">{lump.name}</span>
                    <span className="lump-size">{lump.size} bytes</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default WadViewerPage;

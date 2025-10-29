import type { ReactElement } from 'react';
import type { WadFile, WadMetadata, WadValidationResult } from '@web-doom/wad';

interface WadViewerMainPageProps {
  wadFile: WadFile;
  metadata: WadMetadata;
  validation: WadValidationResult;
  structure: string;
}

function WadViewerMainPage({ wadFile, metadata, validation, structure }: WadViewerMainPageProps): ReactElement {
  return (
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
  );
}

export default WadViewerMainPage;

import { useState, useRef, DragEvent } from 'react';
import {
  loadFileToCanvas,
  canvasToPNG,
  canvasToPicture,
  pictureToCanvas,
  decodePicture,
  encodePicture,
  DEFAULT_DOOM_PALETTE,
} from '@web-doom/wad';
import './ImageConverterPage.css';

type ConversionMode = 'to-doom' | 'from-doom';

function ImageConverterPage() {
  const [mode, setMode] = useState<ConversionMode>('to-doom');
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [outputUrl, setOutputUrl] = useState<string>('');
  const [outputFilename, setOutputFilename] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileToDoom = async (file: File) => {
    try {
      setError('');

      // Load image to canvas
      const canvas = await loadFileToCanvas(file);
      setPreviewUrl(canvas.toDataURL());

      // Convert to DOOM picture format
      const picture = canvasToPicture(canvas, { palette: DEFAULT_DOOM_PALETTE });

      // Encode to binary
      const encoded = encodePicture(picture);

      // Create blob and URL for download
      const blob = new Blob([encoded], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);

      setOutputUrl(url);
      setOutputFilename(file.name.replace(/\.(png|jpg|jpeg)$/i, '.lmp'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert image');
      setPreviewUrl('');
      setOutputUrl('');
    }
  };

  const handleFileFromDoom = async (file: File) => {
    try {
      setError('');

      // Read DOOM picture file
      const arrayBuffer = await file.arrayBuffer();
      const picture = decodePicture(arrayBuffer);

      // Convert to canvas
      const canvas = pictureToCanvas(picture, { palette: DEFAULT_DOOM_PALETTE });
      const dataUrl = canvas.toDataURL();
      setPreviewUrl(dataUrl);

      // Convert to PNG blob
      const blob = await canvasToPNG(canvas);
      const url = URL.createObjectURL(blob);

      setOutputUrl(url);
      setOutputFilename(file.name.replace(/\.lmp$/i, '.png'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert DOOM picture');
      setPreviewUrl('');
      setOutputUrl('');
    }
  };

  const handleFile = async (file: File) => {
    if (mode === 'to-doom') {
      await handleFileToDoom(file);
    } else {
      await handleFileFromDoom(file);
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

  const handleModeChange = (newMode: ConversionMode) => {
    setMode(newMode);
    setError('');
    setPreviewUrl('');
    setOutputUrl('');
    setOutputFilename('');
  };

  const handleDownload = () => {
    if (outputUrl && outputFilename) {
      const a = document.createElement('a');
      a.href = outputUrl;
      a.download = outputFilename;
      a.click();
    }
  };

  const acceptedFormats = mode === 'to-doom' ? '.png,.jpg,.jpeg' : '.lmp';
  const uploadText = mode === 'to-doom'
    ? 'PNG/JPEG to DOOM Picture Format'
    : 'DOOM Picture Format to PNG';
  const uploadHint = mode === 'to-doom'
    ? 'Supports PNG and JPEG images'
    : 'Supports .lmp DOOM picture files';

  return (
    <div className="image-converter-page">
      <div className="image-converter-container">
        <header className="page-header">
          <h1>Image Converter</h1>
          <p>Convert between PNG/JPEG and DOOM picture format</p>
        </header>

        <div className="mode-selector">
          <button
            onClick={() => handleModeChange('to-doom')}
            className={`mode-button ${mode === 'to-doom' ? 'active' : ''}`}
          >
            PNG/JPEG → DOOM
          </button>
          <button
            onClick={() => handleModeChange('from-doom')}
            className={`mode-button ${mode === 'from-doom' ? 'active' : ''}`}
          >
            DOOM → PNG
          </button>
        </div>

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
            accept={acceptedFormats}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div className="upload-content">
            <div className="upload-icon">🖼️</div>
            <p className="upload-text">
              {isDragging ? 'Drop file here' : uploadText}
            </p>
            <p className="upload-hint">{uploadHint}</p>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {previewUrl && (
          <div className="preview-section">
            <h2>Preview</h2>
            <div className="preview-container">
              <img src={previewUrl} alt="Preview" className="preview-image" />
            </div>
          </div>
        )}

        {outputUrl && (
          <div className="output-section">
            <h2>Conversion Complete</h2>
            <div className="output-info">
              <p>File ready for download: <strong>{outputFilename}</strong></p>
              <button onClick={handleDownload} className="download-button">
                Download File
              </button>
            </div>
          </div>
        )}

        <div className="info-section">
          <h2>About DOOM Picture Format</h2>
          <p>
            The DOOM picture format is a specialized image format used in DOOM WAD files
            for textures, sprites, and other graphics. It uses column-based encoding with
            run-length compression and supports transparency through the DOOM palette.
          </p>
          <h3>Conversion Details</h3>
          <ul>
            <li><strong>PNG/JPEG → DOOM:</strong> Converts standard images to DOOM picture format (.lmp). Colors are quantized to the nearest DOOM palette color.</li>
            <li><strong>DOOM → PNG:</strong> Converts DOOM picture files to standard PNG format, preserving transparency.</li>
            <li><strong>Palette:</strong> Uses the standard DOOM palette (256 colors).</li>
            <li><strong>Transparency:</strong> Cyan (#00FFFF) is treated as transparent when converting to DOOM format.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ImageConverterPage;

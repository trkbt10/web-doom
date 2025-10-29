import { useState, useRef, useEffect, DragEvent } from 'react';
import { type DoomEngine } from '@web-doom/core';
import { decode } from '@web-doom/wad';
import './WebDoomPage.css';

function WebDoomPage() {
  const [engine, setEngine] = useState<DoomEngine | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (engine) {
        engine.dispose();
      }
    };
  }, [engine]);

  const handleFile = async (file: File) => {
    try {
      setError('');
      const arrayBuffer = await file.arrayBuffer();

      if (!canvasRef.current) {
        throw new Error('Canvas not ready');
      }

      // Decode WAD file to validate it
      decode(arrayBuffer);

      // TODO: Implement proper renderer and engine initialization
      // For now, this is a placeholder to prevent type errors
      throw new Error('Engine initialization not yet implemented. Please use the WAD Viewer for now.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load WAD file');
      setEngine(null);
      setIsRunning(false);
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

  const handleStart = () => {
    if (engine && !isRunning) {
      engine.start();
      setIsRunning(true);
    }
  };

  const handleStop = () => {
    if (engine && isRunning) {
      engine.stop();
      setIsRunning(false);
    }
  };

  return (
    <div className="web-doom-page">
      <div className="web-doom-container">
        <header className="page-header">
          <h1>Web DOOM</h1>
          <p>Play DOOM in your browser</p>
        </header>

        {!engine && (
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
              <div className="upload-icon">🎮</div>
              <p className="upload-text">
                {isDragging ? 'Drop WAD file here' : 'Click or drag WAD file here'}
              </p>
              <p className="upload-hint">Load DOOM.WAD or DOOM2.WAD to start</p>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {engine && (
          <div className="game-container">
            <div className="canvas-wrapper">
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="game-canvas"
              />
            </div>

            <div className="controls">
              <button
                onClick={handleStart}
                disabled={isRunning}
                className="control-button start-button"
              >
                {isRunning ? 'Running...' : 'Start Game'}
              </button>
              <button
                onClick={handleStop}
                disabled={!isRunning}
                className="control-button stop-button"
              >
                Stop
              </button>
              <button
                onClick={handleClick}
                className="control-button load-button"
              >
                Load New WAD
              </button>
            </div>

            <div className="game-info">
              <h3>Controls</h3>
              <ul>
                <li><strong>Arrow Keys:</strong> Move forward/backward, turn left/right</li>
                <li><strong>Space:</strong> Use/Open doors</li>
                <li><strong>Ctrl:</strong> Fire weapon</li>
                <li><strong>ESC:</strong> Pause menu</li>
              </ul>
              <p className="info-note">
                Note: This is a work-in-progress implementation. Not all features are complete.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WebDoomPage;

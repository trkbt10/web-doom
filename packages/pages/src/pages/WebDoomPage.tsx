import { useState, useRef, useEffect, DragEvent } from 'react';
import { createDoomEngine, createCanvas2DRenderer, type DoomEngine } from '@web-doom/core';
import { decode } from '@web-doom/wad';
import './WebDoomPage.css';

function WebDoomPage() {
  const [engine, setEngine] = useState<DoomEngine | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Try to load default WAD on mount
    loadDefaultWAD();

    return () => {
      if (engine) {
        engine.dispose();
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (engine) {
        engine.dispose();
      }
    };
  }, [engine]);

  const loadDefaultWAD = async () => {
    // Try to load a default WAD from public/wads directory
    const defaultWads = ['DOOM1.WAD', 'doom1.wad', 'DOOM.WAD', 'doom.wad'];

    for (const wadName of defaultWads) {
      try {
        const response = await fetch(`/web-doom/wads/${wadName}`);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          await initializeEngine(arrayBuffer);
          setLoadingMessage(`Loaded ${wadName}`);
          return;
        }
      } catch (err) {
        // Continue to next WAD
        console.debug(`Could not load ${wadName}:`, err);
      }
    }

    // No default WAD found
    setLoadingMessage('No default WAD found. Please upload a WAD file to play.');
  };

  const initializeEngine = async (arrayBuffer: ArrayBuffer) => {
    if (!canvasRef.current) {
      throw new Error('Canvas not ready');
    }

    // Decode WAD file
    const wadFile = decode(arrayBuffer);

    // Create renderer
    const renderer = createCanvas2DRenderer(canvasRef.current);
    renderer.init({
      width: 640,
      height: 480,
      scale: 0.1,
    });

    // Create engine
    const newEngine = await createDoomEngine({
      wad: wadFile,
      renderer,
      element: canvasRef.current,
      initialMap: 'E1M1', // Try DOOM1 format first
    });

    // If E1M1 doesn't exist, try MAP01 (DOOM2 format)
    const mapNames = newEngine.getMapNames();
    if (mapNames.length > 0 && !mapNames.includes('E1M1')) {
      await newEngine.loadMap(mapNames[0]);
    }

    setEngine(newEngine);
    setError('');
  };

  const handleFile = async (file: File) => {
    try {
      setError('');
      setLoadingMessage(`Loading ${file.name}...`);
      const arrayBuffer = await file.arrayBuffer();

      // Dispose old engine if exists
      if (engine) {
        engine.dispose();
        setEngine(null);
      }

      await initializeEngine(arrayBuffer);
      setLoadingMessage(`Loaded ${file.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load WAD file');
      setEngine(null);
      setIsRunning(false);
      setLoadingMessage('');
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

        <input
          ref={fileInputRef}
          type="file"
          accept=".wad"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {loadingMessage && (
          <div className="info-message" style={{
            padding: '10px',
            margin: '10px 0',
            background: '#003300',
            color: '#00ff00',
            border: '1px solid #00ff00',
            borderRadius: '4px'
          }}>
            {loadingMessage}
          </div>
        )}

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="game-container">
          <div className="canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="game-canvas"
              style={{ border: '2px solid #333', background: '#000' }}
            />
            {!engine && !error && (
              <div
                className={`file-upload-overlay ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0, 0, 0, 0.8)',
                  cursor: 'pointer',
                  border: isDragging ? '3px dashed #00ff00' : 'none'
                }}
              >
                <div className="upload-content" style={{ textAlign: 'center', color: '#fff' }}>
                  <div className="upload-icon" style={{ fontSize: '48px', marginBottom: '20px' }}>🎮</div>
                  <p className="upload-text" style={{ fontSize: '18px', marginBottom: '10px' }}>
                    {isDragging ? 'Drop WAD file here' : 'Click or drag WAD file here'}
                  </p>
                  <p className="upload-hint" style={{ fontSize: '14px', color: '#aaa' }}>
                    Load DOOM.WAD or DOOM1.WAD to start
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="controls">
            <button
              onClick={handleStart}
              disabled={!engine || isRunning}
              className="control-button start-button"
            >
              {isRunning ? 'Running...' : 'Start Game'}
            </button>
            <button
              onClick={handleStop}
              disabled={!engine || !isRunning}
              className="control-button stop-button"
            >
              Stop
            </button>
            <button
              onClick={handleClick}
              className="control-button load-button"
            >
              Load {engine ? 'New' : ''} WAD
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
              Note: This is a work-in-progress implementation using a 2D top-down renderer. Not all features are complete.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WebDoomPage;

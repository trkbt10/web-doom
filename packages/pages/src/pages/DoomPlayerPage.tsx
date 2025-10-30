import { useState, useEffect } from 'react';
import { useDoom, DoomCanvas, DoomController } from '../doom';
import {
  doomControllerSchema,
  doomControllerSchemaPortrait,
} from '@web-doom/game-controller';

export function DoomPlayerPage() {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [selectedWadName, setSelectedWadName] = useState<string>('');
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  const baseUrl = import.meta.env.BASE_URL;

  const {
    status,
    isReady,
    isGameStarted,
    error,
    loadWadFile,
    loadDefaultWad,
    handleControllerInput,
  } = useDoom({
    canvas,
    baseUrl,
    autoInit: true,
  });

  // Detect orientation changes
  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setSelectedWadName(file.name);
      await loadWadFile(file);
    } catch (err) {
      console.error('Failed to load WAD:', err);
    }
  };

  const handleLoadDefault = async () => {
    try {
      setSelectedWadName('doom1.wad (Shareware)');
      await loadDefaultWad();
    } catch (err) {
      console.error('Failed to load default WAD:', err);
    }
  };

  // Fixed canvas resolution
  const canvasWidth = 960;
  const canvasHeight = 720;

  // Calculate display dimensions
  const getDisplayDimensions = () => {
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;
    const aspectRatio = 4 / 3;

    if (isLandscape) {
      const targetWidth = maxWidth * 0.55;
      const targetHeight = targetWidth / aspectRatio;
      return {
        width: isGameStarted ? Math.floor(targetWidth) : Math.min(480, maxWidth * 0.8),
        height: isGameStarted ? Math.floor(targetHeight) : Math.floor(Math.min(480, maxWidth * 0.8) / aspectRatio),
      };
    } else {
      const availableHeight = maxHeight * 0.5;
      let width = maxWidth;
      let height = width / aspectRatio;

      if (height > availableHeight) {
        height = availableHeight;
        width = height * aspectRatio;
      }

      return {
        width: isGameStarted ? Math.floor(width) : Math.min(480, maxWidth * 0.8),
        height: isGameStarted ? Math.floor(height) : Math.floor(Math.min(480, maxWidth * 0.8) / aspectRatio),
      };
    }
  };

  const displayDimensions = getDisplayDimensions();

  // Select controller schema based on orientation
  const controllerSchema = isLandscape ? doomControllerSchema : doomControllerSchemaPortrait;

  // Calculate controller size for portrait mode
  const getControllerStyle = () => {
    if (isLandscape) {
      return {
        width: '100%',
        height: '100%',
      };
    }

    // Portrait mode: fit controller in available space below canvas
    const availableHeight = window.innerHeight - displayDimensions.height;
    const availableWidth = window.innerWidth;
    const controllerAspectRatio = controllerSchema.width / controllerSchema.height;

    // Calculate size based on available space
    const widthBasedHeight = availableWidth / controllerAspectRatio;
    const heightBasedWidth = availableHeight * controllerAspectRatio;

    let maxWidth: string;
    let maxHeight: string;

    if (widthBasedHeight <= availableHeight * 0.9) {
      // Width-limited: use full width with some padding
      maxWidth = `${availableWidth * 0.95}px`;
      maxHeight = `${widthBasedHeight}px`;
    } else {
      // Height-limited: fit within available height
      maxHeight = `${availableHeight * 0.9}px`;
      maxWidth = `${heightBasedWidth}px`;
    }

    return {
      maxWidth,
      maxHeight,
      width: 'auto',
      height: 'auto',
    };
  };

  const controllerStyle = getControllerStyle();

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      backgroundColor: '#000',
      position: 'relative',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Canvas Layer - Always rendered */}
      <div style={{
        position: 'absolute',
        top: isGameStarted && isLandscape ? '20px' : 0,
        left: isGameStarted && isLandscape ? '20px' : '50%',
        transform: isGameStarted && isLandscape ? 'none' : 'translateX(-50%)',
        zIndex: isGameStarted ? 100 : 1,
        opacity: !isGameStarted ? 0.3 : 1,
        boxShadow: isGameStarted && isLandscape ? '0 8px 32px rgba(0, 0, 0, 0.8)' : 'none',
        border: isGameStarted && isLandscape ? '2px solid #8B0000' : 'none',
        borderRadius: isGameStarted && isLandscape ? '4px' : 0,
        overflow: 'hidden',
        pointerEvents: !isGameStarted ? 'none' : 'auto',
      }}>
        <DoomCanvas
          ref={setCanvas}
          width={canvasWidth}
          height={canvasHeight}
          displayWidth={displayDimensions.width}
          displayHeight={displayDimensions.height}
        />
      </div>

      {/* Controller Layer - Always rendered, only visible when game started */}
      {isGameStarted && (
        <div style={{
          position: 'absolute',
          top: isLandscape ? 0 : `${displayDimensions.height}px`,
          left: 0,
          width: '100%',
          height: isLandscape ? '100%' : `calc(100vh - ${displayDimensions.height}px)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: isLandscape ? 1 : 50,
        }}>
          <DoomController
            onInput={handleControllerInput}
            schema={controllerSchema}
            enabled={isGameStarted}
            showFeedback={true}
            style={controllerStyle}
          />
        </div>
      )}

      {/* WAD Selection Overlay - Only shown when game not started */}
      {!isGameStarted && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          zIndex: 10,
        }}>
          <div style={{
            maxWidth: '500px',
            width: '90%',
            backgroundColor: 'rgba(20, 20, 20, 0.95)',
            border: '2px solid #8B0000',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 8px 32px rgba(139, 0, 0, 0.3)',
            color: '#fff',
          }}>
            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h1 style={{
                margin: '0 0 8px 0',
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#8B0000',
                textShadow: '0 0 10px rgba(139, 0, 0, 0.5)',
                letterSpacing: '2px',
              }}>
                DOOM
              </h1>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#888',
                letterSpacing: '1px',
              }}>
                WebAssembly Edition
              </p>
            </div>

            {/* Status - Loading */}
            {!isReady && !error && (
              <div style={{
                textAlign: 'center',
                padding: '24px',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '8px',
                marginBottom: '20px',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
                <strong style={{ fontSize: '16px' }}>Initializing DOOM Engine...</strong>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#999' }}>
                  Loading WebAssembly module
                </p>
              </div>
            )}

            {/* Status - Error */}
            {error && (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                border: '1px solid rgba(244, 67, 54, 0.3)',
                borderRadius: '8px',
                marginBottom: '20px',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
                <strong style={{ color: '#f44336' }}>Error</strong>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                  {error.message}
                </p>
              </div>
            )}

            {/* WAD Selection UI */}
            {isReady && (
              <>
                <div style={{
                  textAlign: 'center',
                  marginBottom: '24px',
                  padding: '16px',
                  backgroundColor: 'rgba(33, 150, 243, 0.05)',
                  borderRadius: '8px',
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎮</div>
                  <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#2196F3',
                  }}>
                    Select Your Game
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                    Choose a WAD file to start playing
                  </p>
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    onClick={handleLoadDefault}
                    style={{
                      width: '100%',
                      padding: '16px',
                      backgroundColor: '#8B0000',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 12px rgba(139, 0, 0, 0.3)',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#a00000';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 0, 0, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#8B0000';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 0, 0, 0.3)';
                    }}
                  >
                    🎮 Play DOOM Shareware
                  </button>

                  <label htmlFor="wad-file-input" style={{
                    display: 'block',
                    width: '100%',
                    padding: '16px',
                    backgroundColor: '#1a1a1a',
                    color: 'white',
                    border: '2px solid #444',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#2a2a2a';
                    e.currentTarget.style.borderColor = '#666';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a1a1a';
                    e.currentTarget.style.borderColor = '#444';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  >
                    📁 Upload Custom WAD
                  </label>
                  <input
                    id="wad-file-input"
                    type="file"
                    accept=".wad"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Info */}
                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#888',
                }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: '#aaa' }}>
                    Supported WAD files:
                  </p>
                  <p style={{ margin: '4px 0' }}>• doom.wad, doom2.wad</p>
                  <p style={{ margin: '4px 0' }}>• plutonia.wad, tnt.wad</p>
                  <p style={{ margin: '4px 0' }}>• Custom PWADs</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Status indicator when game is running */}
      {isGameStarted && isLandscape && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          padding: '4px 12px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderRadius: '4px',
          fontSize: '10px',
          color: '#888',
          zIndex: 100,
        }}>
          {selectedWadName}
        </div>
      )}
    </div>
  );
}

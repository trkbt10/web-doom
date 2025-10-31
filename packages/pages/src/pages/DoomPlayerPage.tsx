import { useState, useEffect, useMemo, useRef } from 'react';
import { useDoom, DoomCanvas, DoomController } from '../doom';
import {
  doomControllerSchema,
  doomControllerSchemaPortrait,
  ThemeSelector,
} from '@web-doom/game-controller';
import { useElementSize } from '../hooks/useElementSize';
import { useAvailableThemes } from '../hooks/useAvailableThemes';

export function DoomPlayerPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const containerSize = useElementSize(containerRef);

  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [selectedWadName, setSelectedWadName] = useState<string>('');
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  const baseUrl = import.meta.env.BASE_URL;

  // Load available themes from manifest.json
  const manifestUrl = `${baseUrl}controllers/manifest.json`;
  const { themes: availableThemes, loading: themesLoading } = useAvailableThemes(manifestUrl);

  // Controller theme state with localStorage persistence
  const [controllerTheme, setControllerTheme] = useState<string>(() => {
    try {
      return localStorage.getItem('doom-controller-theme') || 'doom';
    } catch {
      return 'doom';
    }
  });

  // Save theme to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('doom-controller-theme', controllerTheme);
    } catch {
      // Ignore localStorage errors
    }
  }, [controllerTheme]);

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

  // Detect orientation based on container size
  useEffect(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return;

    const newIsLandscape = containerSize.width > containerSize.height;
    console.log('[DoomPlayerPage] Orientation change:', {
      width: containerSize.width,
      height: containerSize.height,
      isLandscape: newIsLandscape
    });
    setIsLandscape(newIsLandscape);
  }, [containerSize.width, containerSize.height]);

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

  // Fixed canvas resolution (DOOM standard resolution)
  // Higher resolutions cause memory access errors in the WASM module
  const canvasWidth = 640;
  const canvasHeight = 480;

  // Select controller schema based on orientation
  const controllerSchema = isLandscape ? doomControllerSchema : doomControllerSchemaPortrait;

  // Debug: allow disabling controller/UI overlays via query (?ui=0)
  const showUI = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const ui = u.searchParams.get('ui');
      return ui !== '0';
    } catch {
      return true;
    }
  }, []);

  console.log('[DoomPlayerPage] Controller schema selected:', {
    isLandscape,
    schemaName: controllerSchema.name,
    schemaOrientation: controllerSchema.orientation,
    schemaDimensions: `${controllerSchema.width}x${controllerSchema.height}`
  });

  // Calculate controller scale to fit container (maintain aspect ratio, no crop)
  // Maximum scale is 1.0 to prevent upscaling beyond original size
  const controllerScale = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return 1;

    const scaleX = containerSize.width / controllerSchema.width;
    const scaleY = containerSize.height / controllerSchema.height;
    return Math.min(scaleX, scaleY, 1.0);
  }, [containerSize.width, containerSize.height, controllerSchema.width, controllerSchema.height]);

  // Calculate scaled controller dimensions
  const scaledControllerWidth = controllerSchema.width * controllerScale;
  const scaledControllerHeight = controllerSchema.height * controllerScale;

  // Calculate canvas position (from displayArea in schema)
  const displayArea = controllerSchema.displayArea;
  const canvasPosition = useMemo(() => {
    if (!displayArea || containerSize.width === 0 || containerSize.height === 0) {
      return { top: 0, left: 0, width: 640, height: 480 };
    }

    // Center the controller in container
    const controllerLeft = (containerSize.width - scaledControllerWidth) / 2;
    const controllerTop = (containerSize.height - scaledControllerHeight) / 2;

    return {
      top: Math.floor(controllerTop + displayArea.y * controllerScale),
      left: Math.floor(controllerLeft + displayArea.x * controllerScale),
      width: Math.floor(displayArea.width * controllerScale),
      height: Math.floor(displayArea.height * controllerScale),
    };
  }, [displayArea, controllerScale, scaledControllerWidth, scaledControllerHeight, containerSize.width, containerSize.height]);

  // DOOM canvas resolution
  const displayDimensions = {
    width: canvasPosition.width,
    height: canvasPosition.height,
  };

  // Controller style
  const controllerStyle = useMemo(() => {
    return {
      width: `${scaledControllerWidth}px`,
      height: `${scaledControllerHeight}px`,
    };
  }, [scaledControllerWidth, scaledControllerHeight]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        backgroundColor: '#000',
        position: 'relative',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Controller Layer - Centered, scaled to fit */}
      {isGameStarted && showUI && containerSize.width > 0 && containerSize.height > 0 && (
        <div style={{
          position: 'absolute',
          top: `${(containerSize.height - scaledControllerHeight) / 2}px`,
          left: `${(containerSize.width - scaledControllerWidth) / 2}px`,
          width: `${scaledControllerWidth}px`,
          height: `${scaledControllerHeight}px`,
          zIndex: 1,
        }}>
          <DoomController
            onInput={handleControllerInput}
            schema={controllerSchema}
            enabled={isGameStarted}
            showFeedback={true}
            style={controllerStyle}
            theme={controllerTheme}
            baseUrl={baseUrl}
          />
        </div>
      )}

      {/* Canvas Layer - Positioned in displayArea */}
      <div style={{
        position: 'absolute',
        top: `${canvasPosition.top}px`,
        left: `${canvasPosition.left}px`,
        width: `${canvasPosition.width}px`,
        height: `${canvasPosition.height}px`,
        zIndex: isGameStarted ? 10 : 1,
        opacity: !isGameStarted ? 0.3 : 1,
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

      {/* WAD Selection Overlay - Only shown when game not started */}
      {!isGameStarted && showUI && (
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

                {/* Controller Theme Selector */}
                <div style={{
                  marginTop: '20px',
                  padding: '16px',
                  backgroundColor: 'rgba(139, 0, 0, 0.05)',
                  border: '1px solid rgba(139, 0, 0, 0.2)',
                  borderRadius: '8px',
                }}>
                  <p style={{
                    margin: '0 0 12px 0',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    color: '#8B0000'
                  }}>
                    🎨 Controller Theme
                  </p>
                  {themesLoading ? (
                    <div style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#1a1a1a',
                      color: '#666',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}>
                      Loading themes...
                    </div>
                  ) : availableThemes.length > 0 ? (
                    <ThemeSelector
                      value={controllerTheme}
                      onChange={setControllerTheme}
                      themes={availableThemes}
                      mode="dropdown"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: '#1a1a1a',
                        color: '#fff',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#1a1a1a',
                      color: '#666',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}>
                      No themes available
                    </div>
                  )}
                  <p style={{
                    margin: '8px 0 0 0',
                    fontSize: '11px',
                    color: '#666'
                  }}>
                    Select a visual style for the game controller
                  </p>
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

import { useState } from 'react';
import { useDoom, DoomCanvas, DoomController } from '../doom';

export function DoomPlayerPage() {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [selectedWadName, setSelectedWadName] = useState<string>('');
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

  const handleLoadDefault = () => {
    try {
      setSelectedWadName('doom1.wad (Shareware)');
      loadDefaultWad();
    } catch (err) {
      console.error('Failed to load default WAD:', err);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <h1>DOOM Player (WebAssembly)</h1>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          Status: <strong>{status}</strong>
          {error && (
            <span style={{ color: '#d32f2f', marginLeft: '10px' }}>
              ⚠️ {error.message}
            </span>
          )}
        </div>

        {!isGameStarted && isReady && (
          <div style={{ padding: '15px', backgroundColor: '#e7f3ff', border: '1px solid #2196F3', borderRadius: '4px', marginBottom: '15px' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Select a WAD file to play</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <label htmlFor="wad-file-input" style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}>
                  📁 Choose WAD File
                </label>
                <input
                  id="wad-file-input"
                  type="file"
                  accept=".wad"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>
              <span>or</span>
              <button
                onClick={handleLoadDefault}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🎮 Use Default DOOM Shareware
              </button>
            </div>
            {selectedWadName && (
              <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                Selected: <strong>{selectedWadName}</strong>
              </div>
            )}
            <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#666' }}>
              You can use any DOOM WAD file: doom.wad, doom2.wad, plutonia.wad, tnt.wad, etc.
            </p>
          </div>
        )}

        {isGameStarted && (
          <div style={{ padding: '15px', backgroundColor: '#d4edda', border: '1px solid #28a745', borderRadius: '4px', marginBottom: '15px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#155724' }}>✅ Game Running</h3>
            <p style={{ margin: '5px 0', color: '#155724' }}>
              Playing: <strong>{selectedWadName}</strong>
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔄 Reload Page to Play Different WAD
            </button>
          </div>
        )}

        {!isReady && !error && (
          <div style={{ padding: '10px', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '4px' }}>
            <strong>⏳ Loading DOOM engine...</strong>
            <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>
              Please wait while the WebAssembly module initializes.
            </p>
          </div>
        )}
      </div>

      <DoomCanvas
        ref={setCanvas}
        width={800}
        height={600}
      />

      {isGameStarted && (
        <div style={{ marginTop: '20px', width: '100%', maxWidth: '100%' }}>
          <h3 style={{ marginBottom: '10px', textAlign: 'center' }}>Game Controller</h3>
          <p style={{ marginBottom: '10px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
            Touch, gamepad, or keyboard controls supported
          </p>
          <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            <DoomController
              onInput={handleControllerInput}
              enabled={isGameStarted}
              showFeedback={true}
              style={{
                width: '100%',
                maxWidth: '100%',
              }}
            />
          </div>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h3>About</h3>
        <p>
          This page uses <strong>Chocolate Doom WebAssembly</strong> (doom-wasm by Cloudflare).
          It runs DOOM natively in your browser using WebAssembly.
        </p>
        <p>
          <strong>🎮 Play with any WAD file!</strong> Upload your own DOOM, DOOM II, Final DOOM (Plutonia/TNT),
          or custom WAD files to play them directly in your browser.
        </p>

        <h4>Control Methods</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '15px' }}>
          <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <strong>⌨️ Keyboard</strong>
            <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px', fontSize: '12px' }}>
              <li>Arrow Keys: Move/Turn</li>
              <li>Ctrl: Fire</li>
              <li>Space: Use</li>
              <li>Alt: Strafe</li>
              <li>[ / ]: Change weapon</li>
              <li>Esc: Menu</li>
            </ul>
          </div>
          <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <strong>🎮 Gamepad</strong>
            <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px', fontSize: '12px' }}>
              <li>D-pad: Move/Turn</li>
              <li>A: Fire</li>
              <li>B: Use</li>
              <li>L/R bumpers: Strafe</li>
              <li>X/Y: Change weapon</li>
              <li>Start: Menu</li>
            </ul>
          </div>
          <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <strong>📱 Touch</strong>
            <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px', fontSize: '12px' }}>
              <li>On-screen D-pad</li>
              <li>Virtual buttons</li>
              <li>Multi-touch support</li>
              <li>Works on mobile devices</li>
            </ul>
          </div>
        </div>

        <h4>Supported WAD Files</h4>
        <ul>
          <li><strong>doom.wad</strong> - DOOM (Registered version)</li>
          <li><strong>doom2.wad</strong> - DOOM II: Hell on Earth</li>
          <li><strong>plutonia.wad</strong> - Final DOOM: The Plutonia Experiment</li>
          <li><strong>tnt.wad</strong> - Final DOOM: TNT: Evilution</li>
          <li><strong>Custom PWADs</strong> - Most custom WAD files should work</li>
        </ul>

        <h4>Technical Details</h4>
        <ul>
          <li>WebAssembly (WASM) for native performance</li>
          <li>Initial Memory: 256MB, Max: 512MB</li>
          <li>Game Controller API + Touch Events + Pointer Events</li>
          <li>Cross-platform: Desktop, Mobile, Gamepad support</li>
        </ul>
      </div>
    </div>
  );
}

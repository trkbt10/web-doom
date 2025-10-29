import type { ReactElement } from 'react';
import { useState, useRef, useEffect } from 'react';
import { GameController, doomControllerSchema, type ControllerInputEvent, type ControllerState } from '@web-doom/game-controller';
import './GameControllerPage.css';

interface LogEntry {
  timestamp: number;
  buttonId: string;
  pressed: boolean;
  source: string;
}

function GameControllerPage(): ReactElement {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [state, setState] = useState<ControllerState | null>(null);
  const [showState, setShowState] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest log
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleInput = (event: ControllerInputEvent) => {
    const logEntry: LogEntry = {
      timestamp: Date.now(),
      buttonId: event.buttonId,
      pressed: event.pressed,
      source: event.source,
    };

    setLogs(prev => [...prev.slice(-49), logEntry]); // Keep last 50 logs
  };

  const handleStateChange = (newState: ControllerState) => {
    setState(newState);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getPressedButtons = () => {
    if (!state) return [];
    return Object.entries(state)
      .filter(([_, buttonState]) => buttonState.pressed)
      .map(([id]) => id);
  };

  return (
    <div className="game-controller-page">
      <div className="controller-container">
        <header className="page-header">
          <h1>Game Controller</h1>
          <p>Interactive game controller with touch, mouse, and gamepad support</p>
        </header>

        <section className="controller-section">
          <h2>Controller Demo</h2>
          <p className="section-description">
            Try clicking, touching, or using a gamepad. The controller supports all input methods!
          </p>

          <div className="controller-wrapper">
            <GameController
              schema={doomControllerSchema}
              onInput={handleInput}
              onStateChange={handleStateChange}
              showFeedback={true}
            />
          </div>

          <div className="state-toggle">
            <label>
              <input
                type="checkbox"
                checked={showState}
                onChange={(e) => setShowState(e.target.checked)}
              />
              Show Controller State
            </label>
          </div>

          {showState && state && (
            <div className="state-display">
              <h3>Active Buttons</h3>
              <div className="pressed-buttons">
                {getPressedButtons().length > 0 ? (
                  getPressedButtons().map(id => (
                    <span key={id} className="button-badge">{id}</span>
                  ))
                ) : (
                  <span className="no-input">No buttons pressed</span>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="logs-section">
          <div className="logs-header">
            <h2>Input Log</h2>
            <button onClick={clearLogs} className="clear-button">
              Clear Log
            </button>
          </div>

          <div className="logs-container">
            {logs.length === 0 ? (
              <div className="no-logs">No input events yet. Try pressing some buttons!</div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={`${log.timestamp}-${index}`}
                  className={`log-entry ${log.pressed ? 'pressed' : 'released'}`}
                >
                  <span className="log-time">
                    {new Date(log.timestamp).toLocaleTimeString('en-US', {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      fractionalSecondDigits: 3
                    })}
                  </span>
                  <span className="log-button">{log.buttonId}</span>
                  <span className={`log-action ${log.pressed ? 'action-pressed' : 'action-released'}`}>
                    {log.pressed ? 'PRESS' : 'RELEASE'}
                  </span>
                  <span className="log-source">{log.source}</span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </section>

        <section className="info-section">
          <h2>Features</h2>
          <div className="features-grid">
            <div className="feature-item">
              <h3>Multi-Input Support</h3>
              <p>Touch, mouse, and gamepad inputs all work seamlessly</p>
            </div>
            <div className="feature-item">
              <h3>iOS Optimized</h3>
              <p>Touch event handling with scroll prevention</p>
            </div>
            <div className="feature-item">
              <h3>Multi-touch</h3>
              <p>Support for multiple simultaneous inputs</p>
            </div>
            <div className="feature-item">
              <h3>D-pad Slide Detection</h3>
              <p>Smooth directional input when sliding finger</p>
            </div>
          </div>

          <h3>How to Use</h3>
          <ul className="usage-list">
            <li><strong>Touch/Mouse:</strong> Click or tap buttons on the controller</li>
            <li><strong>Gamepad:</strong> Connect a gamepad and press buttons (automatically detected)</li>
            <li><strong>D-pad:</strong> Slide your finger/mouse across directions for smooth transitions</li>
          </ul>

          <h3>Button Mapping</h3>
          <div className="button-mapping">
            <table>
              <thead>
                <tr>
                  <th>Button</th>
                  <th>ID</th>
                  <th>Function</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>D-pad Up</td>
                  <td>move-forward</td>
                  <td>Move forward</td>
                </tr>
                <tr>
                  <td>D-pad Down</td>
                  <td>move-backward</td>
                  <td>Move backward</td>
                </tr>
                <tr>
                  <td>D-pad Left</td>
                  <td>turn-left</td>
                  <td>Turn left</td>
                </tr>
                <tr>
                  <td>D-pad Right</td>
                  <td>turn-right</td>
                  <td>Turn right</td>
                </tr>
                <tr>
                  <td>A (Red)</td>
                  <td>fire</td>
                  <td>Fire weapon</td>
                </tr>
                <tr>
                  <td>B (Blue)</td>
                  <td>use</td>
                  <td>Use/Open</td>
                </tr>
                <tr>
                  <td>X (Green)</td>
                  <td>weapon-next</td>
                  <td>Next weapon</td>
                </tr>
                <tr>
                  <td>Y (Orange)</td>
                  <td>weapon-prev</td>
                  <td>Previous weapon</td>
                </tr>
                <tr>
                  <td>L (Left shoulder)</td>
                  <td>strafe-left</td>
                  <td>Strafe left</td>
                </tr>
                <tr>
                  <td>R (Right shoulder)</td>
                  <td>strafe-right</td>
                  <td>Strafe right</td>
                </tr>
                <tr>
                  <td>Menu</td>
                  <td>menu</td>
                  <td>Pause/Menu</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default GameControllerPage;

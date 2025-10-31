/**
 * Example: Using themed controller in pages
 *
 * This is a complete example showing how to use the theme system in your app.
 */

import React, { useState } from 'react';
import {
  ThemedController,
  ThemeSelector,
  doomControllerSchema,
  doomControllerSchemaPortrait,
  type ControllerInputEvent,
} from '@web-doom/game-controller';

/**
 * Basic example - just specify a theme ID
 */
export function BasicThemedController() {
  return (
    <ThemedController
      schema={doomControllerSchema}
      theme="cyberpunk"
      onInput={(event) => console.log('Input:', event)}
    />
  );
}

/**
 * Example with theme selector
 */
export function ThemedControllerWithSelector() {
  const [theme, setTheme] = useState('cyberpunk');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');

  const schema = orientation === 'landscape' ? doomControllerSchema : doomControllerSchemaPortrait;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Select Controller Theme</h2>

      {/* Orientation selector */}
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setOrientation('landscape')}>
          Landscape
        </button>
        <button onClick={() => setOrientation('portrait')}>
          Portrait
        </button>
      </div>

      {/* Theme selector - Grid mode */}
      <ThemeSelector value={theme} onChange={setTheme} mode="grid" />

      {/* Controller */}
      <div style={{ marginTop: '20px' }}>
        <ThemedController
          schema={schema}
          theme={theme}
          onInput={(event) => console.log('Input:', event)}
        />
      </div>

      <p>Current theme: {theme}</p>
      <p>Orientation: {orientation}</p>
    </div>
  );
}

/**
 * Example with dropdown theme selector
 */
export function CompactThemedController() {
  const [theme, setTheme] = useState('cyberpunk');

  return (
    <div>
      <label>
        Theme:
        <ThemeSelector value={theme} onChange={setTheme} mode="dropdown" />
      </label>

      <ThemedController
        schema={doomControllerSchema}
        theme={theme}
        onInput={(event) => console.log(event)}
      />
    </div>
  );
}

/**
 * Example with list theme selector
 */
export function ThemedControllerWithList() {
  const [theme, setTheme] = useState('cyberpunk');

  // Only show specific themes
  const availableThemes = ['cyberpunk', 'doom', 'retro', 'neon'];

  return (
    <div style={{ display: 'flex', gap: '20px' }}>
      <div style={{ width: '300px' }}>
        <h3>Choose a Theme</h3>
        <ThemeSelector
          value={theme}
          onChange={setTheme}
          mode="list"
          themes={availableThemes}
        />
      </div>

      <div>
        <ThemedController
          schema={doomControllerSchema}
          theme={theme}
          onInput={(event) => console.log(event)}
        />
      </div>
    </div>
  );
}

/**
 * Example with game logic
 */
export function ThemedControllerGame() {
  const [theme, setTheme] = useState('doom');
  const [lastInput, setLastInput] = useState<string>('');
  const [score, setScore] = useState(0);

  const handleInput = (event: ControllerInputEvent) => {
    setLastInput(`${event.buttonId}: ${event.pressed ? 'pressed' : 'released'}`);

    if (event.pressed) {
      // Increment score on button press
      setScore((s) => s + 1);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h2>DOOM Controller Game</h2>
        <p>Score: {score}</p>
        <p>Last input: {lastInput || 'None'}</p>

        <label style={{ marginTop: '10px', display: 'block' }}>
          Theme:
          <ThemeSelector value={theme} onChange={setTheme} mode="dropdown" />
        </label>
      </div>

      <ThemedController
        schema={doomControllerSchema}
        theme={theme}
        onInput={handleInput}
        showFeedback={true}
      />
    </div>
  );
}

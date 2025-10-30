/**
 * DOOM WebAssembly Engine Core
 *
 * This module handles the core DOOM engine initialization, WAD loading, and game lifecycle.
 */

declare global {
  interface Window {
    Module: any;
    callMain: (args: string[]) => void;
  }
}

export interface DoomConfig {
  baseUrl: string;
  canvas: HTMLCanvasElement;
  onStatusChange?: (status: string) => void;
  onModuleReady?: () => void;
  onGameStart?: () => void;
  onError?: (error: Error) => void;
}

export interface DoomKeyMapping {
  [buttonId: string]: string;
}

export class DoomEngine {
  private config: DoomConfig;
  private isModuleReady = false;
  private isGameStarted = false;
  private scriptLoaded = false;
  private keyMapping: DoomKeyMapping = {
    'move-forward': 'ArrowUp',
    'move-backward': 'ArrowDown',
    'turn-left': 'ArrowLeft',
    'turn-right': 'ArrowRight',
    'strafe-left': 'Alt',
    'strafe-right': 'Alt', // Will handle with Shift+Alt
    'fire': 'Control',
    'use': ' ', // Space
    'weapon-next': ']',
    'weapon-prev': '[',
    'menu': 'Escape',
  };
  private pressedKeys = new Set<string>();

  constructor(config: DoomConfig) {
    this.config = config;
  }

  /**
   * Initialize the DOOM engine
   */
  async initialize(): Promise<void> {
    if (this.scriptLoaded) {
      this.setStatus('DOOM engine already initialized');
      return;
    }

    try {
      this.setStatus('Initializing DOOM engine...');

      // Setup Module before loading the script
      window.Module = {
        onRuntimeInitialized: () => {
          this.isModuleReady = true;
          this.setStatus('Module ready. Select a WAD file to start.');
          this.config.onModuleReady?.();
        },
        noInitialRun: true,
        preRun: [],
        printErr: (text: string) => {
          // Suppress requestAnimationFrame warning - this is Chocolate Doom's issue
          if (text.includes('requestAnimationFrame')) return;
          console.error('[DOOM]', text);
        },
        canvas: this.config.canvas,
        print: (text: string) => {
          // Parse doom protocol messages
          if (text.startsWith('doom:')) {
            const parts = text.split(',');
            const code = parseInt(parts[0].split(':')[1].trim());
            const message = parts.slice(1).join(',').trim();

            switch (code) {
              case 10:
                this.setStatus('Game started!');
                this.config.onGameStart?.();
                break;
              case 11:
                this.setStatus('Entering fullscreen');
                break;
              default:
                this.setStatus(message);
            }
          }
        },
        setStatus: (text: string) => {
          if (text) {
            this.setStatus(text);
          }
        },
        totalDependencies: 0,
        monitorRunDependencies: (left: number) => {
          const total = Math.max(window.Module.totalDependencies || 0, left);
          window.Module.totalDependencies = total;
          if (left > 0) {
            this.setStatus(`Preparing... (${total - left}/${total})`);
          } else {
            this.setStatus('All downloads complete');
          }
        },
      };

      // Check if script is already loaded
      const doomPath = `${this.config.baseUrl}doom`;
      const scriptUrl = `${doomPath}/websockets-doom.js`;
      const existingScript = document.querySelector(`script[src="${scriptUrl}"]`);
      if (existingScript) {
        this.setStatus('DOOM script already loaded');
        return;
      }

      // Load the WASM module
      this.setStatus('Loading DOOM...');

      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.onerror = (event) => {
        const error = new Error(`Failed to load DOOM. Please run the build script first.`);
        this.setStatus(error.message);
        this.config.onError?.(error);
      };
      script.onload = () => {
        this.scriptLoaded = true;
        this.setStatus('DOOM script loaded');
      };
      document.body.appendChild(script);

    } catch (error) {
      console.error('Failed to load DOOM:', error);
      const err = error instanceof Error ? error : new Error(String(error));
      this.setStatus(`Error: ${err.message}`);
      this.config.onError?.(err);
    }
  }

  /**
   * Load a WAD file from user upload
   */
  async loadWadFile(file: File): Promise<void> {
    if (!this.isModuleReady) {
      throw new Error('Module not ready yet. Please wait.');
    }

    if (this.isGameStarted) {
      throw new Error('Game already started. Reload the page to play a different WAD.');
    }

    if (!file.name.toLowerCase().endsWith('.wad')) {
      throw new Error('Please select a .wad file');
    }

    try {
      this.setStatus(`Loading ${file.name}...`);

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Write to Emscripten virtual filesystem
      const wadFileName = 'game.wad';
      window.Module.FS.writeFile(wadFileName, uint8Array);

      this.setStatus(`Starting DOOM with ${file.name}...`);

      // Start DOOM with the uploaded WAD
      this.startGame(wadFileName);
    } catch (error) {
      console.error('Failed to load WAD:', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Load the default DOOM shareware WAD
   */
  loadDefaultWad(): void {
    if (!this.isModuleReady) {
      throw new Error('Module not ready yet. Please wait.');
    }

    if (this.isGameStarted) {
      throw new Error('Game already started. Reload the page to play a different WAD.');
    }

    try {
      this.setStatus('Loading default doom1.wad...');

      const doomPath = `${this.config.baseUrl}doom`;

      // Load default WAD from server with callbacks
      window.Module.FS.createPreloadedFile(
        '',
        'doom1.wad',
        `${doomPath}/doom1.wad`,
        true,
        true,
        () => {
          // onload callback
          this.setStatus('Starting DOOM...');
          this.startGame('doom1.wad');
        },
        (error: unknown) => {
          // onerror callback
          console.error('Failed to load default WAD:', error);
          this.setStatus(`Error: Failed to load doom1.wad`);
          this.config.onError?.(new Error('Failed to load doom1.wad'));
        }
      );
    } catch (error) {
      console.error('Failed to load default WAD:', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Start the game with a specified WAD file
   */
  private startGame(wadFileName: string): void {
    // Ensure default.cfg is loaded first
    this.ensureDefaultConfig();

    const args = ['-iwad', wadFileName, '-window', '-nogui', '-nomusic', '-config', 'default.cfg'];

    if (typeof window.callMain === 'function') {
      window.callMain(args);
      this.isGameStarted = true;
      this.setStatus('DOOM is running!');

      // Focus canvas for keyboard input
      setTimeout(() => {
        this.config.canvas.focus();
      }, 100);
    } else {
      throw new Error('callMain function not available');
    }
  }

  /**
   * Ensure default.cfg exists in the virtual filesystem
   */
  private ensureDefaultConfig(): void {
    try {
      // Check if default.cfg already exists
      const stat = window.Module.FS.stat('default.cfg');
      if (stat) {
        return; // Already exists
      }
    } catch (e) {
      // File doesn't exist, create it synchronously
      const doomPath = `${this.config.baseUrl}doom`;
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `${doomPath}/default.cfg`, false); // Synchronous
      xhr.send(null);

      if (xhr.status === 200) {
        window.Module.FS.writeFile('default.cfg', xhr.responseText);
      } else {
        console.warn('Failed to load default.cfg, game will use defaults');
      }
    }
  }

  /**
   * Simulate key press from controller input
   */
  handleControllerInput(buttonId: string, pressed: boolean): void {
    if (!this.isGameStarted) return;

    const key = this.keyMapping[buttonId];
    if (!key) return;

    try {
      // Track pressed keys to avoid duplicate events
      if (pressed) {
        if (this.pressedKeys.has(buttonId)) return;
        this.pressedKeys.add(buttonId);
      } else {
        this.pressedKeys.delete(buttonId);
      }

      // Create keyboard event with all necessary properties
      const eventType = pressed ? 'keydown' : 'keyup';
      const keyCode = this.getKeyCodeNumber(key);

      // Create event with deprecated but necessary properties for Emscripten
      const event = new KeyboardEvent(eventType, {
        key,
        code: this.getKeyCode(key),
        keyCode,
        which: keyCode,
        bubbles: true,
        cancelable: true,
      });

      // Dispatch to document (Emscripten listens on document, not canvas)
      document.dispatchEvent(event);

      console.log(`[Controller] ${eventType} ${buttonId} → ${key} (${keyCode})`);
    } catch (error) {
      console.error('Failed to handle controller input:', error);
    }
  }

  /**
   * Get key code from key value
   */
  private getKeyCode(key: string): string {
    const codeMap: { [key: string]: string } = {
      'ArrowUp': 'ArrowUp',
      'ArrowDown': 'ArrowDown',
      'ArrowLeft': 'ArrowLeft',
      'ArrowRight': 'ArrowRight',
      'Control': 'ControlLeft',
      ' ': 'Space',
      'Escape': 'Escape',
      'Alt': 'AltLeft',
      '[': 'BracketLeft',
      ']': 'BracketRight',
    };
    return codeMap[key] || key;
  }

  /**
   * Get numeric keyCode from key value (for legacy support)
   */
  private getKeyCodeNumber(key: string): number {
    const keyCodeMap: { [key: string]: number } = {
      'ArrowUp': 38,
      'ArrowDown': 40,
      'ArrowLeft': 37,
      'ArrowRight': 39,
      'Control': 17,
      ' ': 32,
      'Escape': 27,
      'Alt': 18,
      '[': 219,
      ']': 221,
    };
    return keyCodeMap[key] || key.charCodeAt(0);
  }

  /**
   * Check if the module is ready
   */
  isReady(): boolean {
    return this.isModuleReady;
  }

  /**
   * Check if the game has started
   */
  hasGameStarted(): boolean {
    return this.isGameStarted;
  }

  /**
   * Set status message
   */
  private setStatus(message: string): void {
    this.config.onStatusChange?.(message);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    // Note: We don't cleanup Module or remove the script on unmount
    // because DOOM needs to persist across navigation
    this.pressedKeys.clear();
  }
}

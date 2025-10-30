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
  private audioContext?: AudioContext;
  private isAudioReady = false;
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
   * Create AudioContext (but don't resume yet - wait for user gesture)
   */
  private createAudioContext(): void {
    if (this.audioContext) {
      return;
    }

    try {
      // Create AudioContext (will be in 'suspended' state due to autoplay policy)
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('[DOOM] AudioContext created, state:', this.audioContext.state);
      console.log('[DOOM] Audio will be initialized on user interaction (WAD selection)');
    } catch (error) {
      console.warn('[DOOM] Failed to create AudioContext:', error);
      // Continue without audio
    }
  }

  /**
   * Initialize and warm up the Web Audio API (must be called from user gesture)
   */
  private async initializeAudio(): Promise<void> {
    if (this.isAudioReady) {
      console.log('[DOOM] Audio already initialized');
      return;
    }

    // Create AudioContext if not already created
    if (!this.audioContext) {
      this.createAudioContext();
    }

    if (!this.audioContext) {
      console.warn('[DOOM] No AudioContext available');
      return;
    }

    this.setStatus('Initializing audio system...');

    try {
      // Resume if suspended (browser autoplay policy)
      // This MUST be called from a user gesture context
      if (this.audioContext.state === 'suspended') {
        this.setStatus('Resuming audio context...');
        console.log('[DOOM] Attempting to resume AudioContext...');
        await this.audioContext.resume();
        console.log('[DOOM] AudioContext resumed, state:', this.audioContext.state);
      }

      // Warm up the audio context by playing a silent buffer
      this.setStatus('Warming up audio system...');
      await this.warmUpAudio();

      this.isAudioReady = true;
      this.setStatus('Audio system ready');
      console.log('[DOOM] Audio system initialized and warmed up');
    } catch (error) {
      console.warn('[DOOM] Failed to initialize audio:', error);
      this.setStatus('Audio initialization failed (will continue without audio)');
      // Don't throw - continue without audio
    }
  }

  /**
   * Warm up the audio context by playing a silent buffer
   * This ensures the audio system is fully initialized and ready
   */
  private async warmUpAudio(): Promise<void> {
    if (!this.audioContext) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        // Create a silent buffer (10ms of silence)
        const sampleRate = this.audioContext!.sampleRate;
        const bufferSize = Math.floor(sampleRate * 0.01); // 10ms
        const buffer = this.audioContext!.createBuffer(1, bufferSize, sampleRate);

        // Create and connect audio nodes
        const source = this.audioContext!.createBufferSource();
        source.buffer = buffer;

        // Create a gain node set to very low volume (almost silent)
        const gainNode = this.audioContext!.createGain();
        gainNode.gain.value = 0.001;

        source.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);

        // Play the silent buffer and wait for it to finish
        source.onended = () => {
          console.log('[DOOM] Audio warm-up complete');
          resolve();
        };

        source.start(0);

        // Timeout after 1 second
        setTimeout(() => {
          console.log('[DOOM] Audio warm-up timeout (continuing anyway)');
          resolve();
        }, 1000);
      } catch (error) {
        console.warn('[DOOM] Audio warm-up failed:', error);
        reject(error);
      }
    });
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

      // Create AudioContext (but don't resume - wait for user gesture)
      this.createAudioContext();

      // Setup Module before loading the script
      const self = this;
      window.Module = {
        onRuntimeInitialized: () => {
          this.isModuleReady = true;
          this.setStatus('Module ready. Select a WAD file to start.');
          this.config.onModuleReady?.();
        },
        noInitialRun: true,
        preRun: [
          function() {
            // Initialize SDL2 audio context if available
            if (self.audioContext && typeof (window as any).SDL2 !== 'undefined') {
              (window as any).SDL2.audioContext = self.audioContext;
              console.log('[DOOM] SDL2 audio context attached to Emscripten');
              console.log('[DOOM] AudioContext state:', self.audioContext.state);
              console.log('[DOOM] Sample rate:', self.audioContext.sampleRate);
            } else if (!self.audioContext) {
              console.warn('[DOOM] No AudioContext available, audio will be disabled');
            }
          }
        ],
        printErr: (text: string) => {
          // Suppress requestAnimationFrame warning - this is Chocolate Doom's issue
          if (text.includes('requestAnimationFrame')) return;

          // Handle memory errors
          if (text.includes('memory') || text.includes('out of bounds')) {
            console.error('[DOOM] Memory error:', text);
            this.setStatus('Error: Memory access error. Try reloading the page.');
            this.config.onError?.(new Error(`Memory error: ${text}`));
            return;
          }

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
        // SDL2 audio context will be set in preRun
        SDL2: this.audioContext ? { audioContext: this.audioContext } : undefined,
        // Note: Memory settings are configured at Emscripten build time in configure.ac
        // INITIAL_MEMORY: 256MB, MAXIMUM_MEMORY: 512MB, ALLOW_MEMORY_GROWTH: true
      };

      // Log audio context status
      if (this.audioContext) {
        console.log('[DOOM] AudioContext created, state:', this.audioContext.state);
        console.log('[DOOM] Audio will be initialized when you load a WAD file');
      }

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
      // Initialize audio (this is called from user gesture - file selection)
      console.log('[DOOM] Initializing audio from user gesture...');
      await this.initializeAudio();

      this.setStatus(`Loading ${file.name}...`);

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Write to Emscripten virtual filesystem
      const wadFileName = 'game.wad';
      window.Module.FS.writeFile(wadFileName, uint8Array);

      this.setStatus(`Starting DOOM with ${file.name}...`);

      // Start DOOM with the uploaded WAD
      await this.startGame(wadFileName);
    } catch (error) {
      console.error('Failed to load WAD:', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  /**
   * Load the default DOOM shareware WAD
   */
  async loadDefaultWad(): Promise<void> {
    if (!this.isModuleReady) {
      throw new Error('Module not ready yet. Please wait.');
    }

    if (this.isGameStarted) {
      throw new Error('Game already started. Reload the page to play a different WAD.');
    }

    try {
      // Initialize audio (this is called from user gesture - button click)
      console.log('[DOOM] Initializing audio from user gesture...');
      await this.initializeAudio();

      this.setStatus('Loading default doom1.wad...');

      const doomPath = `${this.config.baseUrl}doom`;

      // Load default WAD from server with callbacks
      window.Module.FS.createPreloadedFile(
        '',
        'doom1.wad',
        `${doomPath}/doom1.wad`,
        true,
        true,
        async () => {
          // onload callback
          this.setStatus('Starting DOOM...');
          await this.startGame('doom1.wad');
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
  private async startGame(wadFileName: string): Promise<void> {
    // Ensure default.cfg is loaded first
    this.ensureDefaultConfig();

    // Ensure AudioContext is running (should already be warmed up)
    if (this.audioContext) {
      try {
        if (this.audioContext.state === 'suspended') {
          this.setStatus('Resuming audio...');
          await this.audioContext.resume();
          console.log('[DOOM] AudioContext resumed before game start, state:', this.audioContext.state);
        } else {
          console.log('[DOOM] AudioContext already running, state:', this.audioContext.state);
        }
      } catch (e) {
        console.warn('[DOOM] Failed to resume AudioContext:', e);
      }
    } else {
      console.log('[DOOM] Starting game without audio');
    }

    // Get canvas dimensions for DOOM resolution
    const canvasWidth = this.config.canvas.width;
    const canvasHeight = this.config.canvas.height;

    console.log(`[DOOM] Canvas element size: ${canvasWidth}x${canvasHeight}`);
    console.log(`[DOOM] Canvas display size: ${this.config.canvas.style.width} x ${this.config.canvas.style.height}`);

    const args = [
      '-iwad', wadFileName,
      '-window',
      '-nogui',
      '-nomusic',
      '-config', 'default.cfg',
      '-width', canvasWidth.toString(),
      '-height', canvasHeight.toString(),
    ];

    console.log(`[DOOM] Starting with resolution: ${canvasWidth}x${canvasHeight}`);
    console.log(`[DOOM] Arguments:`, args);

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
  async destroy(): Promise<void> {
    // Note: We don't cleanup Module or remove the script on unmount
    // because DOOM needs to persist across navigation
    this.pressedKeys.clear();

    // Close audio context if it exists
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
        console.log('[DOOM] AudioContext closed');
      } catch (e) {
        console.warn('[DOOM] Failed to close AudioContext:', e);
      }
    }
  }

  /**
   * Get audio readiness status
   */
  getAudioStatus(): { ready: boolean; state?: string } {
    return {
      ready: this.isAudioReady,
      state: this.audioContext?.state,
    };
  }
}

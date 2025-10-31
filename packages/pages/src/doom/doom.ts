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
    'strafe-left': ',',   // DOOM default strafe left key
    'strafe-right': '.',  // DOOM default strafe right key
    'fire': 'Control',
    'use': ' ', // Space
    'weapon-next': ']',
    'weapon-prev': '[',
    'menu': 'Escape',
    'confirm': 'Enter', // For menu selection (New Game, etc.)
    'automap': 'Tab',   // Show automap
  };
  // Track pressed keys by their actual key value (not buttonId)
  // to prevent duplicate events when multiple buttons map to the same key
  private pressedKeys = new Set<string>();

  constructor(config: DoomConfig) {
    this.config = config;
  }

  // Removed WebGL state monkey-patching to avoid interfering with SDL/Emscripten renderer

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
      const { canvas } = this.config;
      window.Module = {
        onRuntimeInitialized: () => {
          this.isModuleReady = true;
          console.log('[DOOM] WebAssembly runtime initialized');
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
            console.error('[DOOM] This usually means the WASM module ran out of memory.');
            console.error('[DOOM] The module was built with 384MB initial memory, 1GB maximum.');
            this.setStatus('Error: Memory access error. Please reload the page and try again.');
            this.config.onError?.(new Error(`Memory error: ${text}`));
            return;
          }

          // Handle WAD resource errors
          if (text.includes('not found') || text.includes('W_GetNumForName')) {
            console.error('[DOOM] WAD resource error:', text);
            this.setStatus('Error: WAD resource not found. Please check the WAD file.');
            this.config.onError?.(new Error(`WAD error: ${text}`));
            return;
          }

          console.error('[DOOM]', text);
        },
        canvas,
        print: (text: string) => {
          // Parse doom protocol messages
          if (text.startsWith('doom:')) {
            const parts = text.split(',');
            const code = parseInt(parts[0].split(':')[1].trim());
            const message = parts.slice(1).join(',').trim();

            switch (code) {
              case 10:
                this.setStatus('Game started!');
                // Clear canvas on game start to prevent ghosting
                if (this.config.canvas) {
                  const gl = this.config.canvas.getContext('webgl') || this.config.canvas.getContext('webgl2');
                  if (gl) {
                    gl.clearColor(0, 0, 0, 1);
                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                  }
                }
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
        // TOTAL_MEMORY: 64MB, ALLOW_MEMORY_GROWTH: 0 (disabled for stability)
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
    const applyPatches = (text: string): string => {
      const setOrAdd = (cfg: string, key: string, value: string): string => {
        const re = new RegExp(`^${key}\\s+.*$`, 'm');
        if (re.test(cfg)) return cfg.replace(re, `${key} ${value}`);
        return cfg.trimEnd() + `\n${key} ${value}\n`;
      };

      let out = text || '';
      // Enforce crisp scaling and avoid any visual flash
      out = setOrAdd(out, 'integer_scaling', '1');
      out = setOrAdd(out, 'vga_porch_flash', '0');
      // Avoid SDL joystick path to prevent duplicate inputs with web controller
      out = setOrAdd(out, 'use_joystick', '0');
      // Align key bindings with our UI mappings (SDL scancodes)
      // Arrows
      out = setOrAdd(out, 'key_up', '82');     // SDL_SCANCODE_UP
      out = setOrAdd(out, 'key_down', '81');   // SDL_SCANCODE_DOWN
      out = setOrAdd(out, 'key_left', '80');   // SDL_SCANCODE_LEFT
      out = setOrAdd(out, 'key_right', '79');  // SDL_SCANCODE_RIGHT
      // Actions
      out = setOrAdd(out, 'key_fire', '224');  // SDL_SCANCODE_LCTRL
      out = setOrAdd(out, 'key_use', '44');    // SDL_SCANCODE_SPACE
      // Strafes (direct keys, not modifier)
      out = setOrAdd(out, 'key_strafeleft', '54');   // SDL_SCANCODE_COMMA
      out = setOrAdd(out, 'key_straferight', '55');  // SDL_SCANCODE_PERIOD
      // Optional: keep strafe modifier as Alt (46) if present
      // Optional: force software renderer via query (?doom_soft=1) for debugging
      try {
        const url = new URL(window.location.href);
        const soft = url.searchParams.get('doom_soft');
        if (soft === '1') {
          out = setOrAdd(out, 'force_software_renderer', '1');
        }
      } catch {}
      // Respect user's previous choice otherwise
      return out;
    };

    try {
      // Try to read existing and patch in place
      const existing = window.Module.FS.readFile('default.cfg', { encoding: 'utf8' });
      const patched = applyPatches(existing as unknown as string);
      window.Module.FS.writeFile('default.cfg', patched);
      return;
    } catch (_) {
      // File doesn't exist, fetch and write patched version synchronously
      const doomPath = `${this.config.baseUrl}doom`;
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `${doomPath}/default.cfg`, false);
      xhr.send(null);
      if (xhr.status === 200) {
        const patched = applyPatches(xhr.responseText);
        window.Module.FS.writeFile('default.cfg', patched);
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
    if (!key) {
      console.warn(`[Controller] No key mapping for button: ${buttonId}`);
      return;
    }

    try {
      console.log(`[Controller] Input: ${buttonId} → ${key} (${pressed ? 'pressed' : 'released'})`);

      // Track pressed keys by their actual key value to avoid duplicate events
      // (multiple buttons might map to the same key)
      if (pressed) {
        if (this.pressedKeys.has(key)) {
          console.log(`[Controller] ⚠️ Skipping duplicate keydown for ${buttonId} → ${key}`);
          return;
        }
        this.pressedKeys.add(key);
      } else {
        if (!this.pressedKeys.has(key)) {
          console.log(`[Controller] ⚠️ Skipping duplicate keyup for ${buttonId} → ${key}`);
          return;
        }
        this.pressedKeys.delete(key);
      }

      // Method 1: Try using SDL2 API directly (most reliable for Emscripten)
      if (this.sendSDLKeyEvent(key, pressed)) {
        console.log(`[Controller] ✓ SDL: ${pressed ? 'keydown' : 'keyup'} ${buttonId} → ${key}`);
        return;
      }

      // Method 2: Fallback to creating proper keyboard event
      const eventType = pressed ? 'keydown' : 'keyup';
      const keyCode = this.getKeyCodeNumber(key);
      const code = this.getKeyCode(key);

      // Create base event
      const event = new KeyboardEvent(eventType, {
        key,
        code,
        bubbles: true,
        cancelable: true,
        view: window,
      });

      // Override readonly properties using Object.defineProperty
      // (Emscripten's SDL checks these legacy properties)
      try {
        Object.defineProperty(event, 'keyCode', { value: keyCode });
        Object.defineProperty(event, 'which', { value: keyCode });
      } catch (e) {
        // Some browsers don't allow this - continue anyway
      }

      // Dispatch to document (Emscripten listens here)
      document.dispatchEvent(event);
      console.log(`[Controller] ✓ KeyboardEvent: ${eventType} ${buttonId} → ${key}`);

    } catch (error) {
      console.error('[Controller] ❌ Failed to handle controller input:', error);
    }
  }

  /**
   * Send key event via SDL2 API if available
   * @returns true if SDL2 API was used successfully
   */
  private sendSDLKeyEvent(key: string, pressed: boolean): boolean {
    try {
      // Check if SDL2 API is available in Module
      const Module = window.Module;
      if (!Module || !Module.SDL2) {
        return false;
      }

      // Get SDL scancode for the key
      const scancode = this.getSDLScancode(key);
      if (scancode === null) {
        return false;
      }

      // Check if SDL_SendKeyboardKey function exists
      // This is exposed by Emscripten's SDL implementation
      if (typeof Module._SDL_SendKeyboardKey === 'function') {
        // SDL_SendKeyboardKey(SDL_PRESSED or SDL_RELEASED, SDL_Scancode)
        const SDL_PRESSED = 1;
        const SDL_RELEASED = 0;
        Module._SDL_SendKeyboardKey(pressed ? SDL_PRESSED : SDL_RELEASED, scancode);
        return true;
      }

      // Alternative: Try using the asm.js/wasm exported function
      if (Module.asm && typeof Module.asm._SDL_SendKeyboardKey === 'function') {
        const SDL_PRESSED = 1;
        const SDL_RELEASED = 0;
        Module.asm._SDL_SendKeyboardKey(pressed ? SDL_PRESSED : SDL_RELEASED, scancode);
        return true;
      }

      return false;
    } catch (error) {
      console.warn('SDL2 API call failed:', error);
      return false;
    }
  }

  /**
   * Map key string to SDL scancode
   * SDL scancode reference: https://wiki.libsdl.org/SDL2/SDL_Scancode
   */
  private getSDLScancode(key: string): number | null {
    const scancodeMap: { [key: string]: number } = {
      // Arrow keys
      'ArrowUp': 82,      // SDL_SCANCODE_UP
      'ArrowDown': 81,    // SDL_SCANCODE_DOWN
      'ArrowLeft': 80,    // SDL_SCANCODE_LEFT
      'ArrowRight': 79,   // SDL_SCANCODE_RIGHT
      // Modifiers
      'Control': 224,     // SDL_SCANCODE_LCTRL
      'Alt': 226,         // SDL_SCANCODE_LALT
      'Shift': 225,       // SDL_SCANCODE_LSHIFT
      // Common keys
      ' ': 44,            // SDL_SCANCODE_SPACE
      'Escape': 41,       // SDL_SCANCODE_ESCAPE
      '[': 47,            // SDL_SCANCODE_LEFTBRACKET
      ']': 48,            // SDL_SCANCODE_RIGHTBRACKET
      'Enter': 40,        // SDL_SCANCODE_RETURN
      'Tab': 43,          // SDL_SCANCODE_TAB
      ',': 54,            // SDL_SCANCODE_COMMA
      '.': 55,            // SDL_SCANCODE_PERIOD
      // Letters (a-z are scancodes 4-29)
      'a': 4, 'b': 5, 'c': 6, 'd': 7, 'e': 8, 'f': 9, 'g': 10,
      'h': 11, 'i': 12, 'j': 13, 'k': 14, 'l': 15, 'm': 16,
      'n': 17, 'o': 18, 'p': 19, 'q': 20, 'r': 21, 's': 22,
      't': 23, 'u': 24, 'v': 25, 'w': 26, 'x': 27, 'y': 28, 'z': 29,
      // Numbers (1-9,0 are scancodes 30-39)
      '1': 30, '2': 31, '3': 32, '4': 33, '5': 34,
      '6': 35, '7': 36, '8': 37, '9': 38, '0': 39,
    };

    return scancodeMap[key] ?? null;
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
      ',': 'Comma',
      '.': 'Period',
      'Enter': 'Enter',
      'Tab': 'Tab',
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
      ',': 188,
      '.': 190,
      'Enter': 13,
      'Tab': 9,
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

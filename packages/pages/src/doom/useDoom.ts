import { useEffect, useState, useRef, useCallback } from 'react';
import { DoomEngine, DoomConfig } from './doom';

export interface UseDoomOptions {
  canvas: HTMLCanvasElement | null;
  baseUrl: string;
  autoInit?: boolean;
}

export interface UseDoomReturn {
  status: string;
  isReady: boolean;
  isGameStarted: boolean;
  error: Error | null;
  loadWadFile: (file: File) => Promise<void>;
  loadDefaultWad: () => void;
  handleControllerInput: (buttonId: string, pressed: boolean) => void;
}

/**
 * React hook for managing DOOM engine
 */
export function useDoom(options: UseDoomOptions): UseDoomReturn {
  const { canvas, baseUrl, autoInit = true } = options;

  const [status, setStatus] = useState<string>('Initializing...');
  const [isReady, setIsReady] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const engineRef = useRef<DoomEngine | null>(null);

  // Initialize DOOM engine
  useEffect(() => {
    if (!canvas || !autoInit) return;

    const config: DoomConfig = {
      baseUrl,
      canvas,
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
      },
      onModuleReady: () => {
        setIsReady(true);
      },
      onGameStart: () => {
        setIsGameStarted(true);
      },
      onError: (err) => {
        setError(err);
      },
    };

    const engine = new DoomEngine(config);
    engineRef.current = engine;

    engine.initialize().catch((err) => {
      setError(err);
    });

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [canvas, baseUrl, autoInit]);

  /**
   * Load a WAD file from user upload
   */
  const loadWadFile = useCallback(async (file: File) => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setError(null);
      await engineRef.current.loadWadFile(file);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, []);

  /**
   * Load the default DOOM shareware WAD
   */
  const loadDefaultWad = useCallback(() => {
    if (!engineRef.current) {
      throw new Error('Engine not initialized');
    }

    try {
      setError(null);
      engineRef.current.loadDefaultWad();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, []);

  /**
   * Handle controller input
   */
  const handleControllerInput = useCallback((buttonId: string, pressed: boolean) => {
    if (!engineRef.current) return;
    engineRef.current.handleControllerInput(buttonId, pressed);
  }, []);

  return {
    status,
    isReady,
    isGameStarted,
    error,
    loadWadFile,
    loadDefaultWad,
    handleControllerInput,
  };
}

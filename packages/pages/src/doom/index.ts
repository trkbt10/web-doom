/**
 * DOOM module - Clean separation of concerns
 *
 * - doom.ts: Core engine logic (Module initialization, WAD loading, game start)
 * - useDoom.ts: React hook for managing DOOM engine
 * - DoomCanvas.tsx: Canvas rendering component
 * - DoomController.tsx: Game controller component with keyboard/gamepad/touch support
 */

// Core engine
export { DoomEngine } from './doom';
export type { DoomConfig, DoomKeyMapping } from './doom';

// React hook
export { useDoom } from './useDoom';
export type { UseDoomOptions, UseDoomReturn } from './useDoom';

// Components
export { DoomCanvas } from './DoomCanvas';
export type { DoomCanvasProps } from './DoomCanvas';

export { DoomController } from './DoomController';
export type { DoomControllerProps } from './DoomController';

/**
 * Web DOOM - DOOM engine implementation for web
 */

import { decode, type WadFile } from '@web-doom/wad';

export interface DoomConfig {
  canvas: HTMLCanvasElement;
  wadFile: ArrayBuffer;
}

/**
 * Main DOOM engine class
 */
export class DoomEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private wad: WadFile;
  private running: boolean = false;
  private lastTime: number = 0;

  constructor(config: DoomConfig) {
    this.canvas = config.canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;
    this.wad = decode(config.wadFile);
  }

  /**
   * Initialize the engine
   */
  init(): void {
    console.log('DOOM Engine initialized');
    console.log('WAD Type:', this.wad.header.identification);
    console.log('Lumps:', this.wad.header.numlumps);
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.gameLoop();
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.running = false;
  }

  /**
   * Main game loop
   */
  private gameLoop = (): void => {
    if (!this.running) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();

    requestAnimationFrame(this.gameLoop);
  };

  /**
   * Update game state
   */
  private update(deltaTime: number): void {
    // TODO: Implement game logic
  }

  /**
   * Render frame
   */
  private render(): void {
    // Clear screen
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // TODO: Implement rendering
  }
}

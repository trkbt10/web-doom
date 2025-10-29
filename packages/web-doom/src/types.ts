/**
 * Core types for the DOOM engine
 */

import { WadFile } from '@web-doom/wad';

/**
 * 2D Vector
 */
export interface Vec2 {
  x: number;
  y: number;
}

/**
 * 3D Vector
 */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Angle in radians
 */
export type Angle = number;

/**
 * Bounding box
 */
export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Time in seconds
 */
export type TimeSeconds = number;

/**
 * Fixed-point number (DOOM uses 16.16 fixed point)
 */
export type Fixed = number;

/**
 * Game difficulty level
 */
export enum Difficulty {
  Easy = 1,
  Medium = 2,
  Hard = 3,
  Nightmare = 4,
}

/**
 * Game mode
 */
export enum GameMode {
  Shareware = 'shareware',
  Registered = 'registered',
  Commercial = 'commercial',
}

/**
 * Line flags
 */
export enum LineFlags {
  BLOCKING = 0x0001, // Blocks players and monsters
  BLOCKMONSTERS = 0x0002, // Blocks monsters only
  TWOSIDED = 0x0004, // Two-sided line
  DONTPEGTOP = 0x0008, // Upper texture unpegged
  DONTPEGBOTTOM = 0x0010, // Lower texture unpegged
  SECRET = 0x0020, // Secret line (shows as one-sided on map)
  SOUNDBLOCK = 0x0040, // Blocks sound
  DONTDRAW = 0x0080, // Not drawn on automap
  MAPPED = 0x0100, // Already seen on automap
}

/**
 * Configuration for the DOOM engine
 */
export interface DoomConfig {
  /** WAD file data */
  wad: WadFile;
  /** Starting episode (1-based) */
  episode?: number;
  /** Starting map (1-based) */
  map?: number;
  /** Game difficulty */
  difficulty?: Difficulty;
  /** Game mode */
  gameMode?: GameMode;
}

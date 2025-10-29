/**
 * Entity (Thing) types for DOOM
 */

import type { Vec3, Angle } from '../types';

/**
 * Thing types from DOOM
 */
export enum ThingType {
  // Players
  Player1Start = 1,
  Player2Start = 2,
  Player3Start = 3,
  Player4Start = 4,
  DeathmatchStart = 11,

  // Weapons
  Shotgun = 2001,
  Chaingun = 2002,
  RocketLauncher = 2003,
  PlasmaGun = 2004,
  Chainsaw = 2005,
  BFG9000 = 2006,

  // Ammo
  Clip = 2007,
  Shell = 2008,
  RocketAmmo = 2010,
  CellCharge = 2047,
  AmmoBox = 2048,
  ShellBox = 2049,
  RocketBox = 2046,
  CellPack = 17,

  // Health
  Stimpack = 2011,
  Medikit = 2012,

  // Armor
  ArmorBonus = 2015,
  GreenArmor = 2018,
  BlueArmor = 2019,

  // Powerups
  Invulnerability = 2022,
  Berserk = 2023,
  Invisibility = 2024,
  RadiationSuit = 2025,
  ComputerMap = 2026,
  LightAmp = 2045,

  // Keys
  BlueKeycard = 5,
  YellowKeycard = 6,
  RedKeycard = 13,
  BlueSkullKey = 40,
  YellowSkullKey = 39,
  RedSkullKey = 38,

  // Monsters
  FormerHuman = 3004,
  FormerSergeant = 9,
  FormerCommando = 65,
  Imp = 3001,
  Demon = 3002,
  Spectre = 58,
  LostSoul = 3006,
  Cacodemon = 3005,
  HellKnight = 69,
  BaronOfHell = 3003,
  Arachnotron = 68,
  PainElemental = 71,
  Revenant = 66,
  Mancubus = 67,
  Archvile = 64,
  Cyberdemon = 16,
  SpiderMastermind = 7,

  // Decorations
  TechColumn = 48,
  TallGreenColumn = 30,
  ShortGreenColumn = 31,
  TallRedColumn = 32,
  ShortRedColumn = 33,
}

/**
 * Thing flags
 */
export enum ThingFlags {
  SKILL1 = 0x0001,
  SKILL2 = 0x0002,
  SKILL3 = 0x0004,
  DEAF = 0x0008,
  MULTI = 0x0010,
}

/**
 * Thing state
 */
export enum ThingState {
  Spawning,
  Idle,
  Walking,
  Running,
  Attacking,
  Pain,
  Dying,
  Dead,
  Removed,
}

/**
 * Raw thing data from WAD
 */
export interface ThingData {
  x: number;
  y: number;
  angle: Angle;
  type: number;
  flags: number;
}

/**
 * A thing (entity) in the game world
 */
export interface Thing {
  id: number;
  type: ThingType;
  position: Vec3;
  angle: Angle;
  velocity: Vec3;
  state: ThingState;
  flags: number;
  health: number;
  radius: number;
  height: number;
  sprite: string;
  frame: number;
  tics: number; // Time until next state change
  target?: number; // Target thing ID (for AI)
  threshold: number; // Refire threshold
  moveDir: number; // Movement direction
  moveCount: number; // Movement counter
}

/**
 * Thing template/definition
 */
export interface ThingDef {
  type: ThingType;
  radius: number;
  height: number;
  health: number;
  speed: number;
  sprite: string;
  solid: boolean;
  shootable: boolean;
  floating: boolean;
}

/**
 * Get thing definition by type
 */
export function getThingDef(type: ThingType): ThingDef | null {
  return thingDefs.get(type) ?? null;
}

/**
 * Thing definitions database
 */
const thingDefs = new Map<ThingType, ThingDef>([
  // Weapons
  [
    ThingType.Shotgun,
    {
      type: ThingType.Shotgun,
      radius: 20,
      height: 16,
      health: 1000,
      speed: 0,
      sprite: 'SHOT',
      solid: false,
      shootable: false,
      floating: false,
    },
  ],
  [
    ThingType.Chaingun,
    {
      type: ThingType.Chaingun,
      radius: 20,
      height: 16,
      health: 1000,
      speed: 0,
      sprite: 'MGUN',
      solid: false,
      shootable: false,
      floating: false,
    },
  ],

  // Ammo
  [
    ThingType.Clip,
    {
      type: ThingType.Clip,
      radius: 20,
      height: 16,
      health: 1000,
      speed: 0,
      sprite: 'CLIP',
      solid: false,
      shootable: false,
      floating: false,
    },
  ],
  [
    ThingType.Shell,
    {
      type: ThingType.Shell,
      radius: 20,
      height: 16,
      health: 1000,
      speed: 0,
      sprite: 'SHEL',
      solid: false,
      shootable: false,
      floating: false,
    },
  ],

  // Health
  [
    ThingType.Stimpack,
    {
      type: ThingType.Stimpack,
      radius: 20,
      height: 16,
      health: 1000,
      speed: 0,
      sprite: 'STIM',
      solid: false,
      shootable: false,
      floating: false,
    },
  ],
  [
    ThingType.Medikit,
    {
      type: ThingType.Medikit,
      radius: 20,
      height: 16,
      health: 1000,
      speed: 0,
      sprite: 'MEDI',
      solid: false,
      shootable: false,
      floating: false,
    },
  ],

  // Monsters - Former Humans
  [
    ThingType.FormerHuman,
    {
      type: ThingType.FormerHuman,
      radius: 20,
      height: 56,
      health: 20,
      speed: 8,
      sprite: 'POSS',
      solid: true,
      shootable: true,
      floating: false,
    },
  ],
  [
    ThingType.FormerSergeant,
    {
      type: ThingType.FormerSergeant,
      radius: 20,
      height: 56,
      health: 30,
      speed: 8,
      sprite: 'SPOS',
      solid: true,
      shootable: true,
      floating: false,
    },
  ],

  // Monsters - Demons
  [
    ThingType.Imp,
    {
      type: ThingType.Imp,
      radius: 20,
      height: 56,
      health: 60,
      speed: 8,
      sprite: 'TROO',
      solid: true,
      shootable: true,
      floating: false,
    },
  ],
  [
    ThingType.Demon,
    {
      type: ThingType.Demon,
      radius: 30,
      height: 56,
      health: 150,
      speed: 10,
      sprite: 'SARG',
      solid: true,
      shootable: true,
      floating: false,
    },
  ],
  [
    ThingType.Cacodemon,
    {
      type: ThingType.Cacodemon,
      radius: 31,
      height: 56,
      health: 400,
      speed: 8,
      sprite: 'HEAD',
      solid: true,
      shootable: true,
      floating: true,
    },
  ],
  [
    ThingType.BaronOfHell,
    {
      type: ThingType.BaronOfHell,
      radius: 24,
      height: 64,
      health: 1000,
      speed: 8,
      sprite: 'BOSS',
      solid: true,
      shootable: true,
      floating: false,
    },
  ],
]);

/**
 * Check if thing type is a monster
 */
export function isMonster(type: ThingType): boolean {
  return (
    type === ThingType.FormerHuman ||
    type === ThingType.FormerSergeant ||
    type === ThingType.FormerCommando ||
    type === ThingType.Imp ||
    type === ThingType.Demon ||
    type === ThingType.Spectre ||
    type === ThingType.LostSoul ||
    type === ThingType.Cacodemon ||
    type === ThingType.HellKnight ||
    type === ThingType.BaronOfHell ||
    type === ThingType.Arachnotron ||
    type === ThingType.PainElemental ||
    type === ThingType.Revenant ||
    type === ThingType.Mancubus ||
    type === ThingType.Archvile ||
    type === ThingType.Cyberdemon ||
    type === ThingType.SpiderMastermind
  );
}

/**
 * Check if thing type is a pickup
 */
export function isPickup(type: ThingType): boolean {
  return (
    (type >= 2001 && type <= 2049) || // Weapons, ammo, health, armor
    type === 17 || // Cell pack
    type === ThingType.BlueKeycard ||
    type === ThingType.YellowKeycard ||
    type === ThingType.RedKeycard ||
    type === ThingType.BlueSkullKey ||
    type === ThingType.YellowSkullKey ||
    type === ThingType.RedSkullKey
  );
}

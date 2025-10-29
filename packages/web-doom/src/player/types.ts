/**
 * Player-related types
 */

import type { Vec3, Angle } from '../types';

/**
 * Weapon types
 */
export enum WeaponType {
  Fist = 0,
  Pistol = 1,
  Shotgun = 2,
  Chaingun = 3,
  RocketLauncher = 4,
  PlasmaRifle = 5,
  BFG9000 = 6,
  Chainsaw = 7,
}

/**
 * Ammo types
 */
export enum AmmoType {
  Bullets = 0,
  Shells = 1,
  Rockets = 2,
  Cells = 3,
}

/**
 * Player state
 */
export enum PlayerState {
  Alive,
  Dead,
  Reborn,
}

/**
 * Player weapon state
 */
export interface WeaponState {
  type: WeaponType;
  ammoType: AmmoType | null;
  owned: boolean;
}

/**
 * Player inventory
 */
export interface Inventory {
  weapons: boolean[]; // Indexed by WeaponType
  ammo: number[]; // Indexed by AmmoType
  maxAmmo: number[]; // Indexed by AmmoType
  keys: {
    blue: boolean;
    yellow: boolean;
    red: boolean;
    blueSkull: boolean;
    yellowSkull: boolean;
    redSkull: boolean;
  };
}

/**
 * Player stats
 */
export interface PlayerStats {
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  armorType: number; // 1 = green, 2 = blue
}

/**
 * Player state
 */
export interface Player {
  /** Player number (0-3) */
  id: number;

  /** Current state */
  state: PlayerState;

  /** Position in world */
  position: Vec3;

  /** View angle (yaw) */
  angle: Angle;

  /** View pitch */
  pitch: Angle;

  /** Velocity */
  velocity: Vec3;

  /** Stats */
  stats: PlayerStats;

  /** Inventory */
  inventory: Inventory;

  /** Current weapon */
  currentWeapon: WeaponType;

  /** Pending weapon (for weapon switching) */
  pendingWeapon: WeaponType | null;

  /** Weapon refire counter */
  refire: number;

  /** Player movement */
  forwardMove: number; // -1 to 1
  sideMove: number; // -1 to 1

  /** Attacking */
  attacking: boolean;

  /** Using (opening doors, etc.) */
  using: boolean;
}

/**
 * Create a new player
 */
export function createPlayer(id: number, position: Vec3, angle: Angle): Player {
  return {
    id,
    state: PlayerState.Alive,
    position,
    angle,
    pitch: 0,
    velocity: { x: 0, y: 0, z: 0 },
    stats: {
      health: 100,
      maxHealth: 100,
      armor: 0,
      maxArmor: 200,
      armorType: 0,
    },
    inventory: {
      weapons: [true, true, false, false, false, false, false, false], // Start with fist and pistol
      ammo: [50, 0, 0, 0], // Start with 50 bullets
      maxAmmo: [200, 50, 50, 300],
      keys: {
        blue: false,
        yellow: false,
        red: false,
        blueSkull: false,
        yellowSkull: false,
        redSkull: false,
      },
    },
    currentWeapon: WeaponType.Pistol,
    pendingWeapon: null,
    refire: 0,
    forwardMove: 0,
    sideMove: 0,
    attacking: false,
    using: false,
  };
}

/**
 * Get ammo type for weapon
 */
export function getWeaponAmmoType(weapon: WeaponType): AmmoType | null {
  switch (weapon) {
    case WeaponType.Fist:
    case WeaponType.Chainsaw:
      return null; // No ammo required
    case WeaponType.Pistol:
    case WeaponType.Chaingun:
      return AmmoType.Bullets;
    case WeaponType.Shotgun:
      return AmmoType.Shells;
    case WeaponType.RocketLauncher:
      return AmmoType.Rockets;
    case WeaponType.PlasmaRifle:
    case WeaponType.BFG9000:
      return AmmoType.Cells;
  }
}

/**
 * Check if player has ammo for weapon
 */
export function hasAmmoForWeapon(player: Player, weapon: WeaponType): boolean {
  const ammoType = getWeaponAmmoType(weapon);
  if (ammoType === null) return true; // No ammo required
  return player.inventory.ammo[ammoType] > 0;
}

/**
 * Switch to weapon if possible
 */
export function switchWeapon(player: Player, weapon: WeaponType): Player {
  if (!player.inventory.weapons[weapon]) {
    return player; // Don't have this weapon
  }

  if (!hasAmmoForWeapon(player, weapon)) {
    return player; // No ammo
  }

  return {
    ...player,
    pendingWeapon: weapon,
  };
}

/**
 * Add ammo to player
 */
export function addAmmo(player: Player, ammoType: AmmoType, amount: number): Player {
  const newAmmo = [...player.inventory.ammo];
  newAmmo[ammoType] = Math.min(
    newAmmo[ammoType] + amount,
    player.inventory.maxAmmo[ammoType]
  );

  return {
    ...player,
    inventory: {
      ...player.inventory,
      ammo: newAmmo,
    },
  };
}

/**
 * Give weapon to player
 */
export function giveWeapon(player: Player, weapon: WeaponType): Player {
  const newWeapons = [...player.inventory.weapons];
  newWeapons[weapon] = true;

  return {
    ...player,
    inventory: {
      ...player.inventory,
      weapons: newWeapons,
    },
  };
}

/**
 * Damage player
 */
export function damagePlayer(player: Player, damage: number): Player {
  // Calculate damage with armor
  let actualDamage = damage;
  if (player.stats.armor > 0) {
    const saved = Math.floor(damage * (player.stats.armorType === 2 ? 0.5 : 0.33));
    const newArmor = Math.max(0, player.stats.armor - saved);
    actualDamage = damage - saved;

    const newHealth = Math.max(0, player.stats.health - actualDamage);

    return {
      ...player,
      stats: {
        ...player.stats,
        health: newHealth,
        armor: newArmor,
      },
      state: newHealth <= 0 ? PlayerState.Dead : player.state,
    };
  }

  const newHealth = Math.max(0, player.stats.health - actualDamage);

  return {
    ...player,
    stats: {
      ...player.stats,
      health: newHealth,
    },
    state: newHealth <= 0 ? PlayerState.Dead : player.state,
  };
}

/**
 * Heal player
 */
export function healPlayer(player: Player, amount: number): Player {
  return {
    ...player,
    stats: {
      ...player.stats,
      health: Math.min(player.stats.health + amount, player.stats.maxHealth),
    },
  };
}

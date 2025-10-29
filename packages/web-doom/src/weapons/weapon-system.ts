/**
 * Weapon system
 */

import type { Thing } from '../entities/types';
import type { MapData } from '../map/types';
import { isMonster } from '../entities/types';

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

export interface WeaponDef {
  type: WeaponType;
  damage: number;
  ammoPerShot: number;
  ammoType: number; // Index into ammo array
  fireRate: number; // Shots per second
  spread: number; // Angle spread in radians
  projectile: boolean; // true for rockets/plasma, false for hitscan
  pelletsPerShot: number; // For shotgun
}

export const weaponDefs: Map<WeaponType, WeaponDef> = new Map([
  [
    WeaponType.Fist,
    {
      type: WeaponType.Fist,
      damage: 10,
      ammoPerShot: 0,
      ammoType: -1,
      fireRate: 2,
      spread: 0,
      projectile: false,
      pelletsPerShot: 1,
    },
  ],
  [
    WeaponType.Pistol,
    {
      type: WeaponType.Pistol,
      damage: 10,
      ammoPerShot: 1,
      ammoType: 0, // Bullets
      fireRate: 3,
      spread: 0.05,
      projectile: false,
      pelletsPerShot: 1,
    },
  ],
  [
    WeaponType.Shotgun,
    {
      type: WeaponType.Shotgun,
      damage: 7,
      ammoPerShot: 1,
      ammoType: 1, // Shells
      fireRate: 1,
      spread: 0.15,
      projectile: false,
      pelletsPerShot: 7,
    },
  ],
  [
    WeaponType.Chaingun,
    {
      type: WeaponType.Chaingun,
      damage: 10,
      ammoPerShot: 1,
      ammoType: 0, // Bullets
      fireRate: 8,
      spread: 0.07,
      projectile: false,
      pelletsPerShot: 1,
    },
  ],
]);

/**
 * Fire a hitscan weapon
 */
export function fireHitscanWeapon(
  weaponType: WeaponType,
  playerPosition: { x: number; y: number; z: number },
  playerAngle: number,
  things: Thing[],
  mapData: MapData
): Thing | null {
  const weaponDef = weaponDefs.get(weaponType);
  if (!weaponDef || weaponDef.projectile) return null;

  let closestHit: Thing | null = null;
  let closestDistance = Infinity;

  // Fire each pellet (for shotgun)
  for (let pellet = 0; pellet < weaponDef.pelletsPerShot; pellet++) {
    // Calculate ray direction with spread
    const spread = (Math.random() - 0.5) * weaponDef.spread;
    const rayAngle = playerAngle + spread;
    const rayDirX = Math.cos(rayAngle);
    const rayDirY = Math.sin(rayAngle);

    // Check all things for hits
    for (const thing of things) {
      if (!isMonster(thing.type)) continue;
      if (thing.health <= 0) continue;

      // Transform thing to ray space
      const relX = thing.position.x - playerPosition.x;
      const relY = thing.position.y - playerPosition.y;

      // Rotate to ray direction
      const cos = Math.cos(-rayAngle);
      const sin = Math.sin(-rayAngle);
      const localX = relX * cos - relY * sin;
      const localY = relX * sin + relY * cos;

      // Check if in front of player
      if (localY <= 0) continue;

      // Check if within thing radius
      if (Math.abs(localX) <= thing.radius) {
        const distance = Math.sqrt(relX * relX + relY * relY);

        // Check for wall occlusion
        if (!isOccluded(playerPosition, thing.position, distance, mapData)) {
          if (distance < closestDistance) {
            closestDistance = distance;
            closestHit = thing;
          }
        }
      }
    }
  }

  return closestHit;
}

/**
 * Check if line of sight is occluded by walls
 */
function isOccluded(
  from: { x: number; y: number },
  to: { x: number; y: number },
  maxDistance: number,
  mapData: MapData
): boolean {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > maxDistance) return true;

  const rayDirX = dx / distance;
  const rayDirY = dy / distance;

  // Check intersection with solid walls
  for (const linedef of mapData.linedefs) {
    // Only check solid walls (no left sidedef)
    if (linedef.leftSidedef >= 0) continue;

    const v1 = mapData.vertices[linedef.startVertex];
    const v2 = mapData.vertices[linedef.endVertex];

    // Ray-line intersection
    const lineDirX = v2.x - v1.x;
    const lineDirY = v2.y - v1.y;

    const denominator = rayDirX * lineDirY - rayDirY * lineDirX;
    if (Math.abs(denominator) < 0.0001) continue;

    const dx2 = v1.x - from.x;
    const dy2 = v1.y - from.y;

    const t1 = (dx2 * lineDirY - dy2 * lineDirX) / denominator;
    const t2 = (dx2 * rayDirY - dy2 * rayDirX) / denominator;

    // Check if intersection is valid and closer than target
    if (t1 > 0 && t1 < distance && t2 >= 0 && t2 <= 1) {
      return true; // Occluded by wall
    }
  }

  return false;
}

/**
 * Apply damage to a thing
 */
export function applyDamage(thing: Thing, damage: number): void {
  thing.health -= damage;
  if (thing.health <= 0) {
    thing.health = 0;
    thing.state = 7; // Dead state (ThingState.Dead)
  }
}

/**
 * Calculate weapon damage with randomness
 */
export function calculateDamage(weaponDef: WeaponDef): number {
  const baseDamage = weaponDef.damage;
  // DOOM damage formula: damage * random(1, 8)
  const multiplier = Math.floor(Math.random() * 8) + 1;
  return baseDamage * multiplier;
}

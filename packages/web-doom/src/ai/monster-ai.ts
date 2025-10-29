/**
 * Monster AI system
 */

import type { Thing } from '../entities/types';
import type { Player } from '../player/types';
import type { MapData } from '../map/types';
import { getThingDef, isMonster } from '../entities/types';

/**
 * Update monster AI
 */
export function updateMonsterAI(
  thing: Thing,
  player: Player,
  mapData: MapData,
  deltaTime: number
): Thing {
  if (!isMonster(thing.type)) return thing;
  if (thing.health <= 0) return thing;

  const thingDef = getThingDef(thing.type);
  if (!thingDef) return thing;

  // Calculate distance to player
  const dx = player.position.x - thing.position.x;
  const dy = player.position.y - thing.position.y;
  const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);

  const newThing = { ...thing };

  // Aggro range
  const aggroRange = 1024;
  const attackRange = 128;

  if (distanceToPlayer < aggroRange) {
    // Set player as target
    newThing.target = 0; // Player ID

    // Face the player
    newThing.angle = Math.atan2(dy, dx);

    if (distanceToPlayer > attackRange) {
      // Move towards player
      const moveSpeed = thingDef.speed;
      const moveX = Math.cos(newThing.angle) * moveSpeed * deltaTime;
      const moveY = Math.sin(newThing.angle) * moveSpeed * deltaTime;

      // Simple movement (no collision for now)
      newThing.position.x += moveX;
      newThing.position.y += moveY;

      newThing.state = 2; // Walking state (ThingState.Walking)
    } else {
      // In attack range
      newThing.state = 4; // Attacking state (ThingState.Attacking)

      // Attack player periodically
      newThing.tics += deltaTime;
      if (newThing.tics >= 1.0) {
        // Attack!
        newThing.tics = 0;
        // Damage will be applied by a separate system
      }
    }
  } else {
    // Idle
    newThing.state = 1; // Idle state (ThingState.Idle)
    newThing.target = undefined;
  }

  return newThing;
}

/**
 * Apply monster attack damage to player
 */
export function applyMonsterDamage(
  thing: Thing,
  player: Player,
  distanceToPlayer: number
): Player {
  if (!isMonster(thing.type)) return player;
  if (thing.health <= 0) return player;
  if (thing.state !== 4) return player; // Not attacking
  if (thing.tics < 1.0) return player; // Not ready to attack

  const attackRange = 128;
  if (distanceToPlayer > attackRange) return player;

  // Calculate damage based on monster type
  let damage = 0;
  switch (thing.type) {
    case 3004: // Former Human
      damage = Math.floor(Math.random() * 3) + 1;
      break;
    case 9: // Former Sergeant
      damage = Math.floor(Math.random() * 5) + 1;
      break;
    case 3001: // Imp
      damage = Math.floor(Math.random() * 8) + 1;
      break;
    case 3002: // Demon
      damage = Math.floor(Math.random() * 10) + 1;
      break;
    case 3005: // Cacodemon
      damage = Math.floor(Math.random() * 10) + 1;
      break;
    case 3003: // Baron of Hell
      damage = Math.floor(Math.random() * 20) + 1;
      break;
    default:
      damage = Math.floor(Math.random() * 5) + 1;
  }

  // Apply damage to player
  const newPlayer = { ...player };

  // Armor absorbs some damage
  if (newPlayer.stats.armor > 0) {
    const armorDamage = Math.floor(damage / 3);
    newPlayer.stats.armor = Math.max(0, newPlayer.stats.armor - armorDamage);
    damage -= armorDamage;
  }

  newPlayer.stats.health = Math.max(0, newPlayer.stats.health - damage);

  return newPlayer;
}

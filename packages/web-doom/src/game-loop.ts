/**
 * Game loop with fixed timestep
 */

import type { DoomGameState } from './game-state';
import { updateGameState, updateFPS, getActivePlayer, updatePlayer, removeThing, updateThing } from './game-state';
import type { Renderer } from './renderer';
import { getMovementInput, getTurnInput, clearFrameInput, isActionActive } from './input/input';
import { InputAction } from './input/input';
import { tryMove, getHeightAt } from './physics/collision';
import type { TimeSeconds } from './types';
import { isPickup, ThingType } from './entities/types';
import { activateLinedef } from './map/sector-actions';
import { fireHitscanWeapon, calculateDamage, applyDamage, weaponDefs, WeaponType } from './weapons/weapon-system';
import { updateMonsterAI, applyMonsterDamage } from './ai/monster-ai';

/**
 * Game loop configuration
 */
export interface GameLoopConfig {
  /** Target updates per second */
  updatesPerSecond: number;
  /** Maximum frame skip */
  maxFrameSkip: number;
}

/**
 * Default game loop configuration
 */
export const defaultGameLoopConfig: GameLoopConfig = {
  updatesPerSecond: 35, // DOOM's original 35 FPS
  maxFrameSkip: 5,
};

/**
 * Game loop state
 */
interface GameLoopState {
  running: boolean;
  lastTime: number;
  accumulator: number;
  frameId: number | null;
  fpsTime: number;
  fpsFrames: number;
}

/**
 * Create a game loop
 */
export function createGameLoop(
  getState: () => DoomGameState,
  setState: (state: DoomGameState) => void,
  renderer: Renderer,
  config: GameLoopConfig = defaultGameLoopConfig
): {
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
} {
  const fixedDeltaTime = 1 / config.updatesPerSecond;

  const loopState: GameLoopState = {
    running: false,
    lastTime: 0,
    accumulator: 0,
    frameId: null,
    fpsTime: 0,
    fpsFrames: 0,
  };

  const loop = (currentTime: number): void => {
    if (!loopState.running) return;

    // Calculate delta time in seconds
    const deltaTime = Math.min((currentTime - loopState.lastTime) / 1000, 0.1);
    loopState.lastTime = currentTime;

    // Add to accumulator
    loopState.accumulator += deltaTime;

    // Fixed timestep updates
    let steps = 0;
    while (loopState.accumulator >= fixedDeltaTime && steps < config.maxFrameSkip) {
      // Update game state
      let state = getState();
      state = update(state, fixedDeltaTime);
      setState(state);

      loopState.accumulator -= fixedDeltaTime;
      steps++;
    }

    // Render
    const state = getState();
    render(state, renderer);

    // Update FPS
    loopState.fpsFrames++;
    if (currentTime - loopState.fpsTime >= 1000) {
      const fps = (loopState.fpsFrames * 1000) / (currentTime - loopState.fpsTime);
      setState(updateFPS(state, Math.round(fps)));
      loopState.fpsFrames = 0;
      loopState.fpsTime = currentTime;
    }

    // Clear frame-based input
    clearFrameInput(state.input);

    // Request next frame
    loopState.frameId = requestAnimationFrame(loop);
  };

  return {
    start: () => {
      if (loopState.running) return;

      loopState.running = true;
      loopState.lastTime = performance.now();
      loopState.accumulator = 0;
      loopState.fpsTime = performance.now();
      loopState.fpsFrames = 0;

      loopState.frameId = requestAnimationFrame(loop);
    },

    stop: () => {
      loopState.running = false;
      if (loopState.frameId !== null) {
        cancelAnimationFrame(loopState.frameId);
        loopState.frameId = null;
      }
    },

    isRunning: () => loopState.running,
  };
}

/**
 * Update game logic
 */
function update(state: DoomGameState, deltaTime: TimeSeconds): DoomGameState {
  // Update base state
  state = updateGameState(state, deltaTime);

  // Update sector actions (doors, lifts, etc.)
  if (state.map) {
    state.sectorActionManager.update(state.map, deltaTime);
  }

  // Update particle system
  state.particleSystem.update(deltaTime);

  // Update player
  state = updatePlayerLogic(state, deltaTime);

  // Update things/entities
  state = updateThings(state, deltaTime);

  return state;
}

/**
 * Update player logic
 */
function updatePlayerLogic(state: DoomGameState, deltaTime: TimeSeconds): DoomGameState {
  if (!state.map) return state;

  const player = getActivePlayer(state);
  if (!player) return state;

  // Get input
  const movement = getMovementInput(state.input);
  const turn = getTurnInput(state.input);
  const isRunning = isActionActive(state.input, InputAction.Run);

  // Movement speed
  const moveSpeed = isRunning ? 100 : 50; // Units per second
  const turnSpeed = 3.0; // Radians per second

  // Update angle
  let newAngle = player.angle + turn.yaw * deltaTime * turnSpeed;
  // Normalize angle
  while (newAngle < 0) newAngle += Math.PI * 2;
  while (newAngle >= Math.PI * 2) newAngle -= Math.PI * 2;

  // Update pitch
  let newPitch = player.pitch + turn.pitch * deltaTime;
  newPitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, newPitch));

  // Calculate movement
  const forwardX = Math.cos(newAngle) * movement.forward * moveSpeed * deltaTime;
  const forwardY = Math.sin(newAngle) * movement.forward * moveSpeed * deltaTime;
  const strafeX = Math.cos(newAngle - Math.PI / 2) * movement.strafe * moveSpeed * deltaTime;
  const strafeY = Math.sin(newAngle - Math.PI / 2) * movement.strafe * moveSpeed * deltaTime;

  const moveX = forwardX + strafeX;
  const moveY = forwardY + strafeY;

  // Try to move
  const from = { x: player.position.x, y: player.position.y };
  const to = { x: player.position.x + moveX, y: player.position.y + moveY };

  const collision = tryMove(state.map, from, to, 16, 56); // Player radius and height

  // Update position
  let newPosition = { ...player.position, x: collision.position.x, y: collision.position.y };

  // Update Z position based on sector height
  const heights = getHeightAt(state.map, collision.position);
  if (heights) {
    newPosition.z = heights.floor + 41; // Player view height from floor
  }

  // Update player
  const newPlayer = {
    ...player,
    position: newPosition,
    angle: newAngle,
    pitch: newPitch,
    forwardMove: movement.forward,
    sideMove: movement.strafe,
    attacking: isActionActive(state.input, InputAction.Fire),
    using: isActionActive(state.input, InputAction.Use),
  };

  state = updatePlayer(state, state.activePlayer, newPlayer);

  // Check for item pickups
  state = checkItemPickups(state, newPlayer);

  // Check for use action
  if (isActionActive(state.input, InputAction.Use)) {
    tryUseAction(state, newPlayer);
  }

  // Check for fire action
  if (isActionActive(state.input, InputAction.Fire)) {
    state = tryFireWeapon(state, newPlayer);
  }

  return state;
}

/**
 * Try to fire weapon
 */
function tryFireWeapon(state: DoomGameState, player: any): DoomGameState {
  if (!state.map) return state;

  // Check if player has ammo
  const weaponType = player.currentWeapon as WeaponType;
  const weaponDef = weaponDefs.get(weaponType);

  if (!weaponDef) return state;

  // Check ammo
  if (weaponDef.ammoPerShot > 0) {
    const ammoType = weaponDef.ammoType;
    if (player.inventory.ammo[ammoType] < weaponDef.ammoPerShot) {
      // Out of ammo
      return state;
    }

    // Consume ammo
    const newPlayer = { ...player };
    newPlayer.inventory.ammo[ammoType] -= weaponDef.ammoPerShot;
    state = updatePlayer(state, state.activePlayer, newPlayer);
  }

  // Fire hitscan weapon
  const hitResult = fireHitscanWeapon(
    weaponType,
    player.position,
    player.angle,
    state.things,
    state.map
  );

  if (hitResult) {
    // Calculate hit direction
    const dx = hitResult.position.x - player.position.x;
    const dy = hitResult.position.y - player.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const dirX = dx / distance;
    const dirY = dy / distance;

    if (hitResult.type === 'thing' && hitResult.thing) {
      // Hit a thing - create blood particles
      const damage = calculateDamage(weaponDef);
      applyDamage(hitResult.thing, damage);
      state = updateThing(state, hitResult.thing.id, hitResult.thing);

      // Create blood particles
      state.particleSystem.createBlood(
        hitResult.position,
        { x: dirX, y: dirY, z: 0 },
        15
      );
    } else if (hitResult.type === 'wall') {
      // Hit a wall - create bullet puff and sparks
      state.particleSystem.createBulletPuff(hitResult.position);
      state.particleSystem.createSparks(hitResult.position, 3);
    }
  }

  return state;
}

/**
 * Try to use/activate something (doors, switches, etc.)
 */
function tryUseAction(state: DoomGameState, player: any): void {
  if (!state.map) return;

  const useRange = 64; // Use distance
  const playerX = player.position.x;
  const playerY = player.position.y;
  const playerAngle = player.angle;

  // Calculate ray direction
  const rayDirX = Math.cos(playerAngle);
  const rayDirY = Math.sin(playerAngle);

  // Check linedefs in front of player
  for (let i = 0; i < state.map.linedefs.length; i++) {
    const linedef = state.map.linedefs[i];
    if (linedef.specialType === 0) continue;

    const v1 = state.map.vertices[linedef.startVertex];
    const v2 = state.map.vertices[linedef.endVertex];

    // Calculate distance to linedef
    const lineX1 = v1.x;
    const lineY1 = v1.y;
    const lineX2 = v2.x;
    const lineY2 = v2.y;

    // Calculate closest point on line to player
    const dx = lineX2 - lineX1;
    const dy = lineY2 - lineY1;
    const lineLength = Math.sqrt(dx * dx + dy * dy);

    if (lineLength < 0.1) continue;

    const t = Math.max(
      0,
      Math.min(
        1,
        ((playerX - lineX1) * dx + (playerY - lineY1) * dy) / (lineLength * lineLength)
      )
    );

    const closestX = lineX1 + t * dx;
    const closestY = lineY1 + t * dy;

    const distX = closestX - playerX;
    const distY = closestY - playerY;
    const distance = Math.sqrt(distX * distX + distY * distY);

    // Check if within use range
    if (distance > useRange) continue;

    // Check if facing the line
    const toLineX = closestX - playerX;
    const toLineY = closestY - playerY;
    const dot = rayDirX * toLineX + rayDirY * toLineY;

    if (dot > 0) {
      // Activate the linedef
      activateLinedef(state.map, i, state.sectorActionManager);
      return; // Only activate one per use
    }
  }
}

/**
 * Check for and handle item pickups
 */
function checkItemPickups(state: DoomGameState, player: any): DoomGameState {
  const pickupRadius = 32; // Pickup distance

  // Check all things for pickups
  for (const thing of state.things) {
    if (!isPickup(thing.type)) continue;

    // Calculate distance to player
    const dx = thing.position.x - player.position.x;
    const dy = thing.position.y - player.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If close enough, pick up the item
    if (distance <= pickupRadius + thing.radius) {
      state = pickupItem(state, player, thing);
      state = removeThing(state, thing.id);
    }
  }

  return state;
}

/**
 * Handle picking up an item
 */
function pickupItem(state: DoomGameState, player: any, thing: any): DoomGameState {
  const newPlayer = { ...player };

  // Handle different item types
  switch (thing.type) {
    // Health items
    case ThingType.Stimpack:
      newPlayer.stats.health = Math.min(newPlayer.stats.health + 10, 100);
      break;
    case ThingType.Medikit:
      newPlayer.stats.health = Math.min(newPlayer.stats.health + 25, 100);
      break;

    // Armor items
    case ThingType.GreenArmor:
      newPlayer.stats.armor = Math.max(newPlayer.stats.armor, 100);
      break;
    case ThingType.BlueArmor:
      newPlayer.stats.armor = Math.max(newPlayer.stats.armor, 200);
      break;
    case ThingType.ArmorBonus:
      newPlayer.stats.armor = Math.min(newPlayer.stats.armor + 1, 200);
      break;

    // Ammo
    case ThingType.Clip:
      newPlayer.inventory.ammo[0] = Math.min(newPlayer.inventory.ammo[0] + 10, newPlayer.inventory.maxAmmo[0]);
      break;
    case ThingType.AmmoBox:
      newPlayer.inventory.ammo[0] = Math.min(newPlayer.inventory.ammo[0] + 50, newPlayer.inventory.maxAmmo[0]);
      break;
    case ThingType.Shell:
      newPlayer.inventory.ammo[1] = Math.min(newPlayer.inventory.ammo[1] + 4, newPlayer.inventory.maxAmmo[1]);
      break;
    case ThingType.ShellBox:
      newPlayer.inventory.ammo[1] = Math.min(newPlayer.inventory.ammo[1] + 20, newPlayer.inventory.maxAmmo[1]);
      break;

    // Weapons
    case ThingType.Shotgun:
      if (!newPlayer.inventory.weapons.includes(2)) {
        newPlayer.inventory.weapons.push(2);
      }
      newPlayer.inventory.ammo[1] = Math.min(newPlayer.inventory.ammo[1] + 8, newPlayer.inventory.maxAmmo[1]);
      break;
    case ThingType.Chaingun:
      if (!newPlayer.inventory.weapons.includes(3)) {
        newPlayer.inventory.weapons.push(3);
      }
      newPlayer.inventory.ammo[0] = Math.min(newPlayer.inventory.ammo[0] + 20, newPlayer.inventory.maxAmmo[0]);
      break;

    // Keys
    case ThingType.BlueKeycard:
      newPlayer.inventory.keys.blue = true;
      break;
    case ThingType.YellowKeycard:
      newPlayer.inventory.keys.yellow = true;
      break;
    case ThingType.RedKeycard:
      newPlayer.inventory.keys.red = true;
      break;
    case ThingType.BlueSkullKey:
      newPlayer.inventory.keys.blueSkull = true;
      break;
    case ThingType.YellowSkullKey:
      newPlayer.inventory.keys.yellowSkull = true;
      break;
    case ThingType.RedSkullKey:
      newPlayer.inventory.keys.redSkull = true;
      break;
  }

  return updatePlayer(state, state.activePlayer, newPlayer);
}

/**
 * Update things/entities
 */
function updateThings(state: DoomGameState, deltaTime: TimeSeconds): DoomGameState {
  if (!state.map) return state;

  const player = getActivePlayer(state);
  if (!player) return state;

  // Update each thing
  for (let i = 0; i < state.things.length; i++) {
    const thing = state.things[i];

    // Update monster AI
    const updatedThing = updateMonsterAI(thing, player, state.map, deltaTime);
    if (updatedThing !== thing) {
      state = updateThing(state, thing.id, updatedThing);
    }

    // Check if monster is attacking player
    const dx = player.position.x - updatedThing.position.x;
    const dy = player.position.y - updatedThing.position.y;
    const distanceToPlayer = Math.sqrt(dx * dx + dy * dy);

    const updatedPlayer = applyMonsterDamage(updatedThing, player, distanceToPlayer);
    if (updatedPlayer !== player) {
      state = updatePlayer(state, state.activePlayer, updatedPlayer);
    }
  }

  return state;
}

/**
 * Render game
 */
function render(state: DoomGameState, renderer: Renderer): void {
  renderer.beginFrame();
  renderer.clear('#000000');

  if (!state.map) {
    renderer.endFrame();
    return;
  }

  const player = getActivePlayer(state);
  if (!player) {
    renderer.endFrame();
    return;
  }

  // Set camera
  renderer.setCamera({
    position: player.position,
    angle: player.angle,
    pitch: player.pitch,
    fov: Math.PI / 2, // 90 degrees
  });

  // Pass map data to renderer if it supports it (for Canvas3DRenderer)
  if ('setMapData' in renderer && typeof renderer.setMapData === 'function') {
    renderer.setMapData(state.map);
  }

  // Pass particles to renderer
  if ('setParticles' in renderer && typeof renderer.setParticles === 'function') {
    renderer.setParticles(state.particleSystem.getParticles());
  }

  // Pass weapon state to renderer (TODO: get from player state)
  if ('setWeaponState' in renderer && typeof renderer.setWeaponState === 'function') {
    // For now, create a basic weapon state from player
    const weaponState = {
      weaponType: player.currentWeapon,
      firing: player.attacking || false,
      fireFrame: 0,
      reloadTime: 0,
    };
    renderer.setWeaponState(weaponState);
  }

  // Render world
  renderWorld(state, renderer);

  // Render player indicator (always visible in top-down view)
  renderer.renderAutomap(
    state.showAutomap ? state.map.linedefs : [],
    { x: player.position.x, y: player.position.y },
    player.angle,
    1.0
  );

  // Render HUD
  renderer.renderHUD({
    health: player.stats.health,
    armor: player.stats.armor,
    ammo: player.inventory.ammo[0], // Current weapon ammo
    maxAmmo: player.inventory.maxAmmo[0],
    weapons: player.inventory.weapons,
    currentWeapon: player.currentWeapon,
    keys: {
      blue: player.inventory.keys.blue || player.inventory.keys.blueSkull,
      yellow: player.inventory.keys.yellow || player.inventory.keys.yellowSkull,
      red: player.inventory.keys.red || player.inventory.keys.redSkull,
    },
    face: 'STFST01', // TODO: Dynamic face based on health/state
    fps: state.fps,
  });

  renderer.endFrame();
}

/**
 * Render the game world
 */
function renderWorld(state: DoomGameState, renderer: Renderer): void {
  if (!state.map) return;

  const player = getActivePlayer(state);
  if (!player) return;

  // TODO: Implement proper 3D rendering with BSP traversal
  // For now, just render a basic representation

  // Render all sectors (simplified)
  for (let i = 0; i < state.map.sectors.length; i++) {
    const sector = state.map.sectors[i];

    // Find vertices for this sector (by checking linedefs)
    const vertices: Array<{ x: number; y: number }> = [];
    for (const linedef of state.map.linedefs) {
      const sidedef =
        linedef.rightSidedef >= 0 ? state.map.sidedefs[linedef.rightSidedef] : null;
      if (sidedef && sidedef.sector === i) {
        const v = state.map.vertices[linedef.startVertex];
        vertices.push({ x: v.x, y: v.y });
      }
    }

    if (vertices.length > 0) {
      renderer.renderFloor(sector, vertices);
      renderer.renderCeiling(sector, vertices);
    }
  }

  // Render all walls (linedefs)
  for (const linedef of state.map.linedefs) {
    const v1 = state.map.vertices[linedef.startVertex];
    const v2 = state.map.vertices[linedef.endVertex];

    if (linedef.rightSidedef >= 0) {
      const sidedef = state.map.sidedefs[linedef.rightSidedef];
      const sector = state.map.sectors[sidedef.sector];

      renderer.renderWall(
        { x: v1.x, y: v1.y },
        { x: v2.x, y: v2.y },
        sector.ceilingHeight - sector.floorHeight,
        sidedef.middleTexture || sidedef.upperTexture || 'GRAY',
        sidedef
      );
    }
  }

  // Render things
  for (const thing of state.things) {
    // TODO: Project thing to screen space
    const screenPos = { x: 0, y: 0 }; // Placeholder
    renderer.renderSprite(thing, screenPos, 1.0);
  }
}

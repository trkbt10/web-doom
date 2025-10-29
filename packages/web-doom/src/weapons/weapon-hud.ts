/**
 * Weapon HUD rendering system
 */

import type { SpriteManager } from '../graphics/sprite-manager';
import { WeaponType } from './weapon-system';

export interface WeaponState {
  currentWeapon: WeaponType;
  firing: boolean;
  fireFrame: number;
  fireTime: number;
}

/**
 * Weapon sprite names for each weapon type
 */
const weaponSpriteNames = new Map<WeaponType, string>([
  [WeaponType.Fist, 'PUNG'],
  [WeaponType.Pistol, 'PISG'],
  [WeaponType.Shotgun, 'SHTG'],
  [WeaponType.Chaingun, 'CHGG'],
  [WeaponType.RocketLauncher, 'MISG'],
  [WeaponType.PlasmaRifle, 'PLSG'],
  [WeaponType.BFG9000, 'BFGG'],
  [WeaponType.Chainsaw, 'SAWG'],
]);

/**
 * Number of fire animation frames for each weapon
 */
const weaponFireFrames = new Map<WeaponType, number>([
  [WeaponType.Fist, 3],
  [WeaponType.Pistol, 3],
  [WeaponType.Shotgun, 4],
  [WeaponType.Chaingun, 2],
  [WeaponType.RocketLauncher, 4],
  [WeaponType.PlasmaRifle, 2],
  [WeaponType.BFG9000, 4],
  [WeaponType.Chainsaw, 2],
]);

/**
 * Update weapon animation state
 */
export function updateWeaponState(state: WeaponState, deltaTime: number, firing: boolean): WeaponState {
  const newState = { ...state };

  if (firing && !state.firing) {
    // Start firing animation
    newState.firing = true;
    newState.fireFrame = 1;
    newState.fireTime = 0;
  }

  if (newState.firing) {
    newState.fireTime += deltaTime;

    // Animation speed: ~0.1 seconds per frame
    const frameTime = 0.1;
    if (newState.fireTime >= frameTime) {
      newState.fireTime -= frameTime;
      newState.fireFrame++;

      const maxFrames = weaponFireFrames.get(newState.currentWeapon) || 3;
      if (newState.fireFrame > maxFrames) {
        // Animation complete
        newState.firing = false;
        newState.fireFrame = 0;
        newState.fireTime = 0;
      }
    }
  }

  return newState;
}

/**
 * Render weapon sprite on HUD
 */
export function renderWeaponHUD(
  ctx: CanvasRenderingContext2D,
  spriteManager: SpriteManager,
  weaponState: WeaponState,
  canvasWidth: number,
  canvasHeight: number
): void {
  const spriteName = weaponSpriteNames.get(weaponState.currentWeapon);
  if (!spriteName) return;

  // Determine which frame to show
  let frameChar = 'A'; // Idle frame
  if (weaponState.firing && weaponState.fireFrame > 0) {
    // Fire animation frames: B, C, D, E, etc.
    frameChar = String.fromCharCode(65 + weaponState.fireFrame); // A=65, B=66, etc.
  }

  // Get sprite from sprite manager
  const fullSpriteName = `${spriteName}${frameChar}0`; // A0 = idle, B0 = first fire frame, etc.
  const spriteData = spriteManager.getSprite(fullSpriteName);

  if (!spriteData) {
    // Try without rotation number
    const altSpriteName = `${spriteName}${frameChar}`;
    const altSpriteData = spriteManager.getSprite(altSpriteName);
    if (altSpriteData) {
      renderWeaponSprite(ctx, altSpriteData.canvas, canvasWidth, canvasHeight);
    }
    return;
  }

  renderWeaponSprite(ctx, spriteData.canvas, canvasWidth, canvasHeight);
}

/**
 * Render the weapon sprite canvas
 */
function renderWeaponSprite(
  ctx: CanvasRenderingContext2D,
  spriteCanvas: HTMLCanvasElement,
  canvasWidth: number,
  canvasHeight: number
): void {
  // Calculate weapon position (bottom center of screen)
  const scale = 2.0; // Weapons are displayed 2x size
  const weaponWidth = spriteCanvas.width * scale;
  const weaponHeight = spriteCanvas.height * scale;

  const x = (canvasWidth - weaponWidth) / 2;
  const y = canvasHeight - weaponHeight - 10; // 10 pixels from bottom

  // Draw weapon sprite
  ctx.drawImage(
    spriteCanvas,
    x,
    y,
    weaponWidth,
    weaponHeight
  );
}

/**
 * Create initial weapon state
 */
export function createWeaponState(weaponType: WeaponType): WeaponState {
  return {
    currentWeapon: weaponType,
    firing: false,
    fireFrame: 0,
    fireTime: 0,
  };
}

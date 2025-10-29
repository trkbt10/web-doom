/**
 * Tests for player-related types and functions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createPlayer,
  getWeaponAmmoType,
  hasAmmoForWeapon,
  switchWeapon,
  addAmmo,
  giveWeapon,
  damagePlayer,
  healPlayer,
  WeaponType,
  AmmoType,
  PlayerState,
  type Player,
} from './types';

describe('player/types', () => {
  describe('createPlayer', () => {
    it('should create a player with default values', () => {
      const player = createPlayer(0, { x: 100, y: 200, z: 0 }, Math.PI / 2);

      expect(player.id).toBe(0);
      expect(player.state).toBe(PlayerState.Alive);
      expect(player.position).toEqual({ x: 100, y: 200, z: 0 });
      expect(player.angle).toBe(Math.PI / 2);
      expect(player.pitch).toBe(0);
      expect(player.velocity).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should create player with starting health and armor', () => {
      const player = createPlayer(0, { x: 0, y: 0, z: 0 }, 0);

      expect(player.stats.health).toBe(100);
      expect(player.stats.maxHealth).toBe(100);
      expect(player.stats.armor).toBe(0);
      expect(player.stats.maxArmor).toBe(200);
      expect(player.stats.armorType).toBe(0);
    });

    it('should create player with starting weapons and ammo', () => {
      const player = createPlayer(0, { x: 0, y: 0, z: 0 }, 0);

      // Should start with fist and pistol
      expect(player.inventory.weapons[WeaponType.Fist]).toBe(true);
      expect(player.inventory.weapons[WeaponType.Pistol]).toBe(true);
      expect(player.inventory.weapons[WeaponType.Shotgun]).toBe(false);

      // Should start with 50 bullets
      expect(player.inventory.ammo[AmmoType.Bullets]).toBe(50);
      expect(player.inventory.ammo[AmmoType.Shells]).toBe(0);
      expect(player.inventory.ammo[AmmoType.Rockets]).toBe(0);
      expect(player.inventory.ammo[AmmoType.Cells]).toBe(0);

      expect(player.currentWeapon).toBe(WeaponType.Pistol);
    });

    it('should create player with no keys', () => {
      const player = createPlayer(0, { x: 0, y: 0, z: 0 }, 0);

      expect(player.inventory.keys).toEqual({
        blue: false,
        yellow: false,
        red: false,
        blueSkull: false,
        yellowSkull: false,
        redSkull: false,
      });
    });
  });

  describe('getWeaponAmmoType', () => {
    it('should return null for fist', () => {
      expect(getWeaponAmmoType(WeaponType.Fist)).toBeNull();
    });

    it('should return null for chainsaw', () => {
      expect(getWeaponAmmoType(WeaponType.Chainsaw)).toBeNull();
    });

    it('should return bullets for pistol', () => {
      expect(getWeaponAmmoType(WeaponType.Pistol)).toBe(AmmoType.Bullets);
    });

    it('should return bullets for chaingun', () => {
      expect(getWeaponAmmoType(WeaponType.Chaingun)).toBe(AmmoType.Bullets);
    });

    it('should return shells for shotgun', () => {
      expect(getWeaponAmmoType(WeaponType.Shotgun)).toBe(AmmoType.Shells);
    });

    it('should return rockets for rocket launcher', () => {
      expect(getWeaponAmmoType(WeaponType.RocketLauncher)).toBe(AmmoType.Rockets);
    });

    it('should return cells for plasma rifle', () => {
      expect(getWeaponAmmoType(WeaponType.PlasmaRifle)).toBe(AmmoType.Cells);
    });

    it('should return cells for BFG9000', () => {
      expect(getWeaponAmmoType(WeaponType.BFG9000)).toBe(AmmoType.Cells);
    });
  });

  describe('hasAmmoForWeapon', () => {
    let player: Player;

    beforeEach(() => {
      player = createPlayer(0, { x: 0, y: 0, z: 0 }, 0);
    });

    it('should return true for fist (no ammo required)', () => {
      expect(hasAmmoForWeapon(player, WeaponType.Fist)).toBe(true);
    });

    it('should return true for chainsaw (no ammo required)', () => {
      expect(hasAmmoForWeapon(player, WeaponType.Chainsaw)).toBe(true);
    });

    it('should return true when player has bullets for pistol', () => {
      expect(hasAmmoForWeapon(player, WeaponType.Pistol)).toBe(true);
    });

    it('should return false when player has no shells for shotgun', () => {
      expect(hasAmmoForWeapon(player, WeaponType.Shotgun)).toBe(false);
    });

    it('should return true when player has shells for shotgun', () => {
      player = addAmmo(player, AmmoType.Shells, 10);
      expect(hasAmmoForWeapon(player, WeaponType.Shotgun)).toBe(true);
    });

    it('should return false when ammo is exactly 0', () => {
      player.inventory.ammo[AmmoType.Bullets] = 0;
      expect(hasAmmoForWeapon(player, WeaponType.Pistol)).toBe(false);
    });
  });

  describe('switchWeapon', () => {
    let player: Player;

    beforeEach(() => {
      player = createPlayer(0, { x: 0, y: 0, z: 0 }, 0);
      player = giveWeapon(player, WeaponType.Shotgun);
      player = addAmmo(player, AmmoType.Shells, 10);
    });

    it('should set pending weapon when switching to owned weapon with ammo', () => {
      const updated = switchWeapon(player, WeaponType.Shotgun);

      expect(updated.pendingWeapon).toBe(WeaponType.Shotgun);
    });

    it('should not switch when weapon is not owned', () => {
      const updated = switchWeapon(player, WeaponType.RocketLauncher);

      expect(updated.pendingWeapon).toBeNull();
      expect(updated).toEqual(player);
    });

    it('should not switch when no ammo for weapon', () => {
      player = giveWeapon(player, WeaponType.RocketLauncher);
      const updated = switchWeapon(player, WeaponType.RocketLauncher);

      expect(updated.pendingWeapon).toBeNull();
    });

    it('should allow switching to fist (no ammo required)', () => {
      const updated = switchWeapon(player, WeaponType.Fist);

      expect(updated.pendingWeapon).toBe(WeaponType.Fist);
    });
  });

  describe('addAmmo', () => {
    let player: Player;

    beforeEach(() => {
      player = createPlayer(0, { x: 0, y: 0, z: 0 }, 0);
    });

    it('should add ammo to existing amount', () => {
      const updated = addAmmo(player, AmmoType.Bullets, 20);

      expect(updated.inventory.ammo[AmmoType.Bullets]).toBe(70); // 50 + 20
    });

    it('should not exceed max ammo', () => {
      const updated = addAmmo(player, AmmoType.Bullets, 200);

      expect(updated.inventory.ammo[AmmoType.Bullets]).toBe(200); // Max is 200
    });

    it('should add ammo to empty slot', () => {
      const updated = addAmmo(player, AmmoType.Shells, 10);

      expect(updated.inventory.ammo[AmmoType.Shells]).toBe(10);
    });

    it('should handle adding 0 ammo', () => {
      const updated = addAmmo(player, AmmoType.Bullets, 0);

      expect(updated.inventory.ammo[AmmoType.Bullets]).toBe(50);
    });

    it('should respect different max ammo for different types', () => {
      let updated = addAmmo(player, AmmoType.Shells, 100);
      expect(updated.inventory.ammo[AmmoType.Shells]).toBe(50); // Max for shells is 50

      updated = addAmmo(updated, AmmoType.Cells, 400);
      expect(updated.inventory.ammo[AmmoType.Cells]).toBe(300); // Max for cells is 300
    });
  });

  describe('giveWeapon', () => {
    let player: Player;

    beforeEach(() => {
      player = createPlayer(0, { x: 0, y: 0, z: 0 }, 0);
    });

    it('should give weapon to player', () => {
      const updated = giveWeapon(player, WeaponType.Shotgun);

      expect(updated.inventory.weapons[WeaponType.Shotgun]).toBe(true);
    });

    it('should not affect other weapons', () => {
      const updated = giveWeapon(player, WeaponType.Shotgun);

      expect(updated.inventory.weapons[WeaponType.Pistol]).toBe(true);
      expect(updated.inventory.weapons[WeaponType.RocketLauncher]).toBe(false);
    });

    it('should be idempotent (giving same weapon twice)', () => {
      let updated = giveWeapon(player, WeaponType.Shotgun);
      updated = giveWeapon(updated, WeaponType.Shotgun);

      expect(updated.inventory.weapons[WeaponType.Shotgun]).toBe(true);
    });
  });

  describe('damagePlayer', () => {
    let player: Player;

    beforeEach(() => {
      player = createPlayer(0, { x: 0, y: 0, z: 0 }, 0);
    });

    it('should reduce health when no armor', () => {
      const updated = damagePlayer(player, 30);

      expect(updated.stats.health).toBe(70);
      expect(updated.state).toBe(PlayerState.Alive);
    });

    it('should kill player when health reaches 0', () => {
      const updated = damagePlayer(player, 100);

      expect(updated.stats.health).toBe(0);
      expect(updated.state).toBe(PlayerState.Dead);
    });

    it('should kill player when damage exceeds health', () => {
      const updated = damagePlayer(player, 150);

      expect(updated.stats.health).toBe(0);
      expect(updated.state).toBe(PlayerState.Dead);
    });

    it('should reduce armor and health with green armor (33% absorption)', () => {
      player.stats.armor = 50;
      player.stats.armorType = 1; // Green armor

      const updated = damagePlayer(player, 30);

      // Armor absorbs 33% = 10 damage
      // Health takes 20 damage
      expect(updated.stats.armor).toBe(40); // 50 - 10
      expect(updated.stats.health).toBe(80); // 100 - 20
    });

    it('should reduce armor and health with blue armor (50% absorption)', () => {
      player.stats.armor = 100;
      player.stats.armorType = 2; // Blue armor

      const updated = damagePlayer(player, 40);

      // Armor absorbs 50% = 20 damage
      // Health takes 20 damage
      expect(updated.stats.armor).toBe(80); // 100 - 20
      expect(updated.stats.health).toBe(80); // 100 - 20
    });

    it('should not let armor go below 0', () => {
      player.stats.armor = 5;
      player.stats.armorType = 2;

      const updated = damagePlayer(player, 40);

      expect(updated.stats.armor).toBe(0);
      // Even though armor absorbed some damage, health still takes remaining
      expect(updated.stats.health).toBeLessThan(100);
    });

    it('should handle 0 damage', () => {
      const updated = damagePlayer(player, 0);

      expect(updated.stats.health).toBe(100);
      expect(updated.stats.armor).toBe(0);
    });
  });

  describe('healPlayer', () => {
    let player: Player;

    beforeEach(() => {
      player = createPlayer(0, { x: 0, y: 0, z: 0 }, 0);
      player.stats.health = 50;
    });

    it('should increase health', () => {
      const updated = healPlayer(player, 30);

      expect(updated.stats.health).toBe(80);
    });

    it('should not exceed max health', () => {
      const updated = healPlayer(player, 100);

      expect(updated.stats.health).toBe(100);
    });

    it('should handle healing at full health', () => {
      player.stats.health = 100;
      const updated = healPlayer(player, 20);

      expect(updated.stats.health).toBe(100);
    });

    it('should handle 0 healing', () => {
      const updated = healPlayer(player, 0);

      expect(updated.stats.health).toBe(50);
    });

    it('should not revive dead player', () => {
      player.state = PlayerState.Dead;
      player.stats.health = 0;

      const updated = healPlayer(player, 50);

      expect(updated.stats.health).toBe(50);
      expect(updated.state).toBe(PlayerState.Dead); // State doesn't change
    });
  });
});

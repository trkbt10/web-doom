/**
 * Tests for entity (Thing) types and functions
 */

import { describe, it, expect } from 'vitest';
import {
  getThingDef,
  isMonster,
  isPickup,
  ThingType,
  type ThingDef,
} from './types';

describe('entities/types', () => {
  describe('getThingDef', () => {
    it('should return definition for shotgun', () => {
      const def = getThingDef(ThingType.Shotgun);

      expect(def).not.toBeNull();
      expect(def?.type).toBe(ThingType.Shotgun);
      expect(def?.sprite).toBe('SHOT');
      expect(def?.solid).toBe(false);
      expect(def?.shootable).toBe(false);
    });

    it('should return definition for chaingun', () => {
      const def = getThingDef(ThingType.Chaingun);

      expect(def).not.toBeNull();
      expect(def?.type).toBe(ThingType.Chaingun);
      expect(def?.sprite).toBe('MGUN');
    });

    it('should return definition for clip (bullets)', () => {
      const def = getThingDef(ThingType.Clip);

      expect(def).not.toBeNull();
      expect(def?.type).toBe(ThingType.Clip);
      expect(def?.sprite).toBe('CLIP');
      expect(def?.solid).toBe(false);
    });

    it('should return definition for stimpack', () => {
      const def = getThingDef(ThingType.Stimpack);

      expect(def).not.toBeNull();
      expect(def?.type).toBe(ThingType.Stimpack);
      expect(def?.sprite).toBe('STIM');
    });

    it('should return definition for medikit', () => {
      const def = getThingDef(ThingType.Medikit);

      expect(def).not.toBeNull();
      expect(def?.type).toBe(ThingType.Medikit);
      expect(def?.sprite).toBe('MEDI');
    });

    it('should return definition for former human', () => {
      const def = getThingDef(ThingType.FormerHuman);

      expect(def).not.toBeNull();
      expect(def?.type).toBe(ThingType.FormerHuman);
      expect(def?.sprite).toBe('POSS');
      expect(def?.health).toBe(20);
      expect(def?.solid).toBe(true);
      expect(def?.shootable).toBe(true);
      expect(def?.floating).toBe(false);
    });

    it('should return definition for former sergeant', () => {
      const def = getThingDef(ThingType.FormerSergeant);

      expect(def).not.toBeNull();
      expect(def?.health).toBe(30);
      expect(def?.sprite).toBe('SPOS');
    });

    it('should return definition for imp', () => {
      const def = getThingDef(ThingType.Imp);

      expect(def).not.toBeNull();
      expect(def?.type).toBe(ThingType.Imp);
      expect(def?.sprite).toBe('TROO');
      expect(def?.health).toBe(60);
      expect(def?.radius).toBe(20);
      expect(def?.height).toBe(56);
    });

    it('should return definition for demon', () => {
      const def = getThingDef(ThingType.Demon);

      expect(def).not.toBeNull();
      expect(def?.health).toBe(150);
      expect(def?.radius).toBe(30);
      expect(def?.sprite).toBe('SARG');
    });

    it('should return definition for cacodemon', () => {
      const def = getThingDef(ThingType.Cacodemon);

      expect(def).not.toBeNull();
      expect(def?.health).toBe(400);
      expect(def?.sprite).toBe('HEAD');
      expect(def?.floating).toBe(true);
    });

    it('should return definition for baron of hell', () => {
      const def = getThingDef(ThingType.BaronOfHell);

      expect(def).not.toBeNull();
      expect(def?.health).toBe(1000);
      expect(def?.sprite).toBe('BOSS');
    });

    it('should return null for undefined thing type', () => {
      const def = getThingDef(99999 as ThingType);

      expect(def).toBeNull();
    });

    it('should return null for player start (no thing def)', () => {
      const def = getThingDef(ThingType.Player1Start);

      expect(def).toBeNull();
    });
  });

  describe('isMonster', () => {
    it('should return true for former human', () => {
      expect(isMonster(ThingType.FormerHuman)).toBe(true);
    });

    it('should return true for former sergeant', () => {
      expect(isMonster(ThingType.FormerSergeant)).toBe(true);
    });

    it('should return true for former commando', () => {
      expect(isMonster(ThingType.FormerCommando)).toBe(true);
    });

    it('should return true for imp', () => {
      expect(isMonster(ThingType.Imp)).toBe(true);
    });

    it('should return true for demon', () => {
      expect(isMonster(ThingType.Demon)).toBe(true);
    });

    it('should return true for spectre', () => {
      expect(isMonster(ThingType.Spectre)).toBe(true);
    });

    it('should return true for lost soul', () => {
      expect(isMonster(ThingType.LostSoul)).toBe(true);
    });

    it('should return true for cacodemon', () => {
      expect(isMonster(ThingType.Cacodemon)).toBe(true);
    });

    it('should return true for hell knight', () => {
      expect(isMonster(ThingType.HellKnight)).toBe(true);
    });

    it('should return true for baron of hell', () => {
      expect(isMonster(ThingType.BaronOfHell)).toBe(true);
    });

    it('should return true for arachnotron', () => {
      expect(isMonster(ThingType.Arachnotron)).toBe(true);
    });

    it('should return true for pain elemental', () => {
      expect(isMonster(ThingType.PainElemental)).toBe(true);
    });

    it('should return true for revenant', () => {
      expect(isMonster(ThingType.Revenant)).toBe(true);
    });

    it('should return true for mancubus', () => {
      expect(isMonster(ThingType.Mancubus)).toBe(true);
    });

    it('should return true for archvile', () => {
      expect(isMonster(ThingType.Archvile)).toBe(true);
    });

    it('should return true for cyberdemon', () => {
      expect(isMonster(ThingType.Cyberdemon)).toBe(true);
    });

    it('should return true for spider mastermind', () => {
      expect(isMonster(ThingType.SpiderMastermind)).toBe(true);
    });

    it('should return false for player start', () => {
      expect(isMonster(ThingType.Player1Start)).toBe(false);
    });

    it('should return false for weapons', () => {
      expect(isMonster(ThingType.Shotgun)).toBe(false);
      expect(isMonster(ThingType.Chaingun)).toBe(false);
      expect(isMonster(ThingType.RocketLauncher)).toBe(false);
    });

    it('should return false for ammo', () => {
      expect(isMonster(ThingType.Clip)).toBe(false);
      expect(isMonster(ThingType.Shell)).toBe(false);
    });

    it('should return false for health items', () => {
      expect(isMonster(ThingType.Stimpack)).toBe(false);
      expect(isMonster(ThingType.Medikit)).toBe(false);
    });

    it('should return false for armor', () => {
      expect(isMonster(ThingType.GreenArmor)).toBe(false);
      expect(isMonster(ThingType.BlueArmor)).toBe(false);
    });

    it('should return false for keys', () => {
      expect(isMonster(ThingType.BlueKeycard)).toBe(false);
      expect(isMonster(ThingType.RedKeycard)).toBe(false);
    });
  });

  describe('isPickup', () => {
    it('should return true for weapons', () => {
      expect(isPickup(ThingType.Shotgun)).toBe(true);
      expect(isPickup(ThingType.Chaingun)).toBe(true);
      expect(isPickup(ThingType.RocketLauncher)).toBe(true);
      expect(isPickup(ThingType.PlasmaGun)).toBe(true);
      expect(isPickup(ThingType.BFG9000)).toBe(true);
      expect(isPickup(ThingType.Chainsaw)).toBe(true);
    });

    it('should return true for ammo', () => {
      expect(isPickup(ThingType.Clip)).toBe(true);
      expect(isPickup(ThingType.Shell)).toBe(true);
      expect(isPickup(ThingType.RocketAmmo)).toBe(true);
      expect(isPickup(ThingType.CellCharge)).toBe(true);
      expect(isPickup(ThingType.AmmoBox)).toBe(true);
      expect(isPickup(ThingType.ShellBox)).toBe(true);
      expect(isPickup(ThingType.RocketBox)).toBe(true);
      expect(isPickup(ThingType.CellPack)).toBe(true);
    });

    it('should return true for health items', () => {
      expect(isPickup(ThingType.Stimpack)).toBe(true);
      expect(isPickup(ThingType.Medikit)).toBe(true);
    });

    it('should return true for armor', () => {
      expect(isPickup(ThingType.ArmorBonus)).toBe(true);
      expect(isPickup(ThingType.GreenArmor)).toBe(true);
      expect(isPickup(ThingType.BlueArmor)).toBe(true);
    });

    it('should return true for keycards', () => {
      expect(isPickup(ThingType.BlueKeycard)).toBe(true);
      expect(isPickup(ThingType.YellowKeycard)).toBe(true);
      expect(isPickup(ThingType.RedKeycard)).toBe(true);
    });

    it('should return true for skull keys', () => {
      expect(isPickup(ThingType.BlueSkullKey)).toBe(true);
      expect(isPickup(ThingType.YellowSkullKey)).toBe(true);
      expect(isPickup(ThingType.RedSkullKey)).toBe(true);
    });

    it('should return false for player starts', () => {
      expect(isPickup(ThingType.Player1Start)).toBe(false);
      expect(isPickup(ThingType.Player2Start)).toBe(false);
      expect(isPickup(ThingType.DeathmatchStart)).toBe(false);
    });

    it('should return false for monsters', () => {
      expect(isPickup(ThingType.FormerHuman)).toBe(false);
      expect(isPickup(ThingType.Imp)).toBe(false);
      expect(isPickup(ThingType.Demon)).toBe(false);
      expect(isPickup(ThingType.Cacodemon)).toBe(false);
    });

    it('should return false for decorations', () => {
      expect(isPickup(ThingType.TechColumn)).toBe(false);
      expect(isPickup(ThingType.TallGreenColumn)).toBe(false);
    });
  });

  describe('ThingDef properties', () => {
    it('should have consistent properties for all weapon pickups', () => {
      const weaponTypes = [
        ThingType.Shotgun,
        ThingType.Chaingun,
      ];

      for (const type of weaponTypes) {
        const def = getThingDef(type);
        expect(def).not.toBeNull();
        if (def) {
          expect(def.solid).toBe(false);
          expect(def.shootable).toBe(false);
          expect(def.floating).toBe(false);
          expect(def.speed).toBe(0);
        }
      }
    });

    it('should have consistent properties for all monsters', () => {
      const monsterTypes = [
        ThingType.FormerHuman,
        ThingType.FormerSergeant,
        ThingType.Imp,
        ThingType.Demon,
      ];

      for (const type of monsterTypes) {
        const def = getThingDef(type);
        expect(def).not.toBeNull();
        if (def) {
          expect(def.solid).toBe(true);
          expect(def.shootable).toBe(true);
          expect(def.health).toBeGreaterThan(0);
          expect(def.radius).toBeGreaterThan(0);
          expect(def.height).toBeGreaterThan(0);
        }
      }
    });

    it('should have floating=true only for flying monsters', () => {
      const cacodemon = getThingDef(ThingType.Cacodemon);
      expect(cacodemon?.floating).toBe(true);

      const imp = getThingDef(ThingType.Imp);
      expect(imp?.floating).toBe(false);

      const demon = getThingDef(ThingType.Demon);
      expect(demon?.floating).toBe(false);
    });
  });
});

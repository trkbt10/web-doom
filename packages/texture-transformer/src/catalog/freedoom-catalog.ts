/**
 * Freedoom Texture Catalog
 *
 * Catalog of known Freedoom/DOOM textures with metadata and prompt templates
 */

import type { CatalogEntry } from '../core/types';
import { TextureCategory } from '../core/types';

/**
 * Freedoom texture catalog
 * Based on common DOOM/Freedoom texture naming conventions
 */
export const FREEDOOM_CATALOG: CatalogEntry[] = [
  // Player sprites
  {
    name: 'PLAY',
    category: TextureCategory.SPRITE,
    description: 'Player character sprite',
    promptTemplate: 'A space marine character sprite in retro FPS style, viewed from {angle}',
  },

  // Monster sprites
  {
    name: 'TROO',
    category: TextureCategory.SPRITE,
    description: 'Imp monster sprite',
    promptTemplate: 'A demon imp creature sprite for retro FPS game, aggressive pose',
  },
  {
    name: 'POSS',
    category: TextureCategory.SPRITE,
    description: 'Possessed human/zombie sprite',
    promptTemplate: 'A possessed soldier zombie sprite, horror FPS style',
  },
  {
    name: 'SPOS',
    category: TextureCategory.SPRITE,
    description: 'Shotgun guy sprite',
    promptTemplate: 'A zombie soldier with shotgun sprite, retro FPS style',
  },
  {
    name: 'SARG',
    category: TextureCategory.SPRITE,
    description: 'Demon/Pinky sprite',
    promptTemplate: 'A demonic beast creature sprite, muscular and aggressive',
  },
  {
    name: 'BOSS',
    category: TextureCategory.SPRITE,
    description: 'Baron of Hell sprite',
    promptTemplate: 'A large horned demon boss sprite, imposing and powerful',
  },
  {
    name: 'HEAD',
    category: TextureCategory.SPRITE,
    description: 'Cacodemon sprite',
    promptTemplate: 'A floating demon head monster sprite with one eye',
  },
  {
    name: 'SKUL',
    category: TextureCategory.SPRITE,
    description: 'Lost soul sprite',
    promptTemplate: 'A flaming flying skull sprite, ghostly and menacing',
  },

  // Weapon sprites
  {
    name: 'PUNG',
    category: TextureCategory.SPRITE,
    description: 'Fist/punch sprite',
    promptTemplate: 'First-person view of armored fist for FPS game',
  },
  {
    name: 'PISG',
    category: TextureCategory.SPRITE,
    description: 'Pistol sprite',
    promptTemplate: 'First-person view of futuristic pistol weapon',
  },
  {
    name: 'SHTG',
    category: TextureCategory.SPRITE,
    description: 'Shotgun sprite',
    promptTemplate: 'First-person view of pump-action shotgun, sci-fi style',
  },
  {
    name: 'SHT2',
    category: TextureCategory.SPRITE,
    description: 'Super shotgun sprite',
    promptTemplate: 'First-person view of double-barrel shotgun, powerful weapon',
  },
  {
    name: 'CHGG',
    category: TextureCategory.SPRITE,
    description: 'Chaingun sprite',
    promptTemplate: 'First-person view of rotary chaingun, sci-fi military',
  },
  {
    name: 'MISG',
    category: TextureCategory.SPRITE,
    description: 'Rocket launcher sprite',
    promptTemplate: 'First-person view of rocket launcher, heavy weapon',
  },
  {
    name: 'PLSG',
    category: TextureCategory.SPRITE,
    description: 'Plasma rifle sprite',
    promptTemplate: 'First-person view of futuristic plasma energy weapon',
  },
  {
    name: 'BFGG',
    category: TextureCategory.SPRITE,
    description: 'BFG9000 sprite',
    promptTemplate: 'First-person view of massive sci-fi energy weapon, the ultimate gun',
  },
  {
    name: 'CSAW',
    category: TextureCategory.SPRITE,
    description: 'Chainsaw sprite',
    promptTemplate: 'First-person view of industrial chainsaw weapon',
  },

  // Projectiles
  {
    name: 'BAL1',
    category: TextureCategory.SPRITE,
    description: 'Imp fireball projectile',
    promptTemplate: 'A glowing fireball projectile sprite, demonic energy',
  },
  {
    name: 'BAL2',
    category: TextureCategory.SPRITE,
    description: 'Cacodemon fireball',
    promptTemplate: 'A larger red fireball projectile sprite',
  },
  {
    name: 'MISL',
    category: TextureCategory.SPRITE,
    description: 'Rocket projectile',
    promptTemplate: 'A flying rocket missile sprite with smoke trail',
  },
  {
    name: 'PLSS',
    category: TextureCategory.SPRITE,
    description: 'Plasma projectile',
    promptTemplate: 'A blue plasma energy bolt sprite',
  },
  {
    name: 'BFS1',
    category: TextureCategory.SPRITE,
    description: 'BFG projectile',
    promptTemplate: 'A large green energy ball sprite, powerful BFG shot',
  },

  // Pickups - Health
  {
    name: 'STIM',
    category: TextureCategory.SPRITE,
    description: 'Stimpack health item',
    promptTemplate: 'A small medical pack sprite, sci-fi health pickup',
  },
  {
    name: 'MEDI',
    category: TextureCategory.SPRITE,
    description: 'Medikit health item',
    promptTemplate: 'A larger medical kit sprite with red cross',
  },
  {
    name: 'SOUL',
    category: TextureCategory.SPRITE,
    description: 'Soulsphere powerup',
    promptTemplate: 'A glowing blue sphere sprite, mystical health powerup',
  },

  // Pickups - Armor
  {
    name: 'ARM1',
    category: TextureCategory.SPRITE,
    description: 'Armor bonus pickup',
    promptTemplate: 'A small armor helmet sprite, green security armor',
  },
  {
    name: 'ARM2',
    category: TextureCategory.SPRITE,
    description: 'Armor pickup',
    promptTemplate: 'A full armor vest sprite, blue combat armor',
  },

  // Pickups - Keys
  {
    name: 'BKEY',
    category: TextureCategory.SPRITE,
    description: 'Blue keycard',
    promptTemplate: 'A blue electronic keycard sprite, futuristic access card',
  },
  {
    name: 'YKEY',
    category: TextureCategory.SPRITE,
    description: 'Yellow keycard',
    promptTemplate: 'A yellow electronic keycard sprite, futuristic access card',
  },
  {
    name: 'RKEY',
    category: TextureCategory.SPRITE,
    description: 'Red keycard',
    promptTemplate: 'A red electronic keycard sprite, futuristic access card',
  },
  {
    name: 'BSKU',
    category: TextureCategory.SPRITE,
    description: 'Blue skull key',
    promptTemplate: 'A blue glowing skull key sprite, demonic artifact',
  },
  {
    name: 'YSKU',
    category: TextureCategory.SPRITE,
    description: 'Yellow skull key',
    promptTemplate: 'A yellow glowing skull key sprite, demonic artifact',
  },
  {
    name: 'RSKU',
    category: TextureCategory.SPRITE,
    description: 'Red skull key',
    promptTemplate: 'A red glowing skull key sprite, demonic artifact',
  },

  // Pickups - Ammo
  {
    name: 'CLIP',
    category: TextureCategory.SPRITE,
    description: 'Ammo clip',
    promptTemplate: 'A small ammunition magazine sprite, bullets',
  },
  {
    name: 'AMMO',
    category: TextureCategory.SPRITE,
    description: 'Box of ammo',
    promptTemplate: 'A large box of bullets sprite, ammunition crate',
  },
  {
    name: 'SHEL',
    category: TextureCategory.SPRITE,
    description: 'Shotgun shells',
    promptTemplate: 'A box of shotgun shells sprite',
  },
  {
    name: 'SBOX',
    category: TextureCategory.SPRITE,
    description: 'Box of shells',
    promptTemplate: 'A large crate of shotgun shells sprite',
  },
  {
    name: 'ROCK',
    category: TextureCategory.SPRITE,
    description: 'Rocket',
    promptTemplate: 'A single rocket missile sprite',
  },
  {
    name: 'BROK',
    category: TextureCategory.SPRITE,
    description: 'Box of rockets',
    promptTemplate: 'A crate of rockets sprite, explosive ammunition',
  },
  {
    name: 'CELL',
    category: TextureCategory.SPRITE,
    description: 'Energy cell',
    promptTemplate: 'A small energy cell sprite, glowing battery pack',
  },
  {
    name: 'CELP',
    category: TextureCategory.SPRITE,
    description: 'Energy cell pack',
    promptTemplate: 'A large energy cell pack sprite, battery crate',
  },

  // Pickups - Powerups
  {
    name: 'PINV',
    category: TextureCategory.SPRITE,
    description: 'Invulnerability sphere',
    promptTemplate: 'A glowing green sphere sprite, invincibility powerup',
  },
  {
    name: 'PSTR',
    category: TextureCategory.SPRITE,
    description: 'Berserk pack',
    promptTemplate: 'A red glowing health pack sprite, rage powerup',
  },
  {
    name: 'PINS',
    category: TextureCategory.SPRITE,
    description: 'Partial invisibility',
    promptTemplate: 'A translucent sphere sprite, stealth powerup',
  },
  {
    name: 'MEGA',
    category: TextureCategory.SPRITE,
    description: 'Megasphere',
    promptTemplate: 'A large glowing sphere sprite, ultimate powerup',
  },

  // Decorations
  {
    name: 'CAND',
    category: TextureCategory.SPRITE,
    description: 'Candle decoration',
    promptTemplate: 'A lit candle sprite, gothic horror ambiance',
  },
  {
    name: 'CBRA',
    category: TextureCategory.SPRITE,
    description: 'Candelabra decoration',
    promptTemplate: 'A tall candelabra sprite with multiple candles',
  },
  {
    name: 'COL1',
    category: TextureCategory.SPRITE,
    description: 'Column decoration',
    promptTemplate: 'A stone pillar column sprite, architectural element',
  },
  {
    name: 'TRE1',
    category: TextureCategory.SPRITE,
    description: 'Tree decoration',
    promptTemplate: 'A dead twisted tree sprite, hellish landscape',
  },
];

/**
 * Get catalog entry by texture name
 */
export function getCatalogEntry(textureName: string): CatalogEntry | undefined {
  const normalizedName = textureName.toUpperCase();

  // Try exact match first
  let entry = FREEDOOM_CATALOG.find(e => normalizedName.startsWith(e.name));

  return entry;
}

/**
 * Get catalog entries by category
 */
export function getCatalogByCategory(category: TextureCategory): CatalogEntry[] {
  return FREEDOOM_CATALOG.filter(e => e.category === category);
}

/**
 * Build enhanced prompt using catalog entry
 */
export function buildCatalogPrompt(
  textureName: string,
  style: string = 'retro pixel art style'
): string | undefined {
  const entry = getCatalogEntry(textureName);

  if (!entry || !entry.promptTemplate) {
    return undefined;
  }

  return `${entry.promptTemplate}, ${style}. Maintain recognizability and game functionality.`;
}

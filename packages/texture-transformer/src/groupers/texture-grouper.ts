/**
 * Texture Grouper
 *
 * Group textures and build prompts for AI transformation
 */

import type { ExtractedTexture, TextureGroup, TextureCategory } from '../core/types';
import { TextureCategory as Category } from '../core/types';

/**
 * Get description for texture category
 */
export function getCategoryDescription(category: TextureCategory): string {
  switch (category) {
    case Category.SPRITE:
      return 'game sprites (characters, monsters, items, weapons)';
    case Category.WALL:
      return 'wall textures (brick, stone, metal surfaces)';
    case Category.FLAT:
      return 'floor and ceiling textures (flat surfaces)';
    case Category.PATCH:
      return 'texture patches (decorative elements)';
    case Category.HUD:
      return 'HUD elements (status bar, health, ammo displays)';
    case Category.MENU:
      return 'menu graphics (titles, buttons, text)';
    default:
      return 'miscellaneous graphics';
  }
}

/**
 * Build AI prompt for texture transformation
 */
export function buildTransformPrompt(
  texture: ExtractedTexture,
  style: string = 'maintaining DOOM aesthetic'
): string {
  const categoryDesc = getCategoryDescription(texture.category);

  let basePrompt = '';

  switch (texture.category) {
    case Category.SPRITE:
      basePrompt = `Transform this DOOM sprite texture (${texture.name}) ${style}. ` +
        `This is a sprite for ${categoryDesc}. ` +
        `Maintain the pixel art style, preserve transparency, and keep recognizable shapes. ` +
        `Size: ${texture.width}x${texture.height} pixels.`;
      break;

    case Category.WALL:
      basePrompt = `Transform this DOOM wall texture (${texture.name}) ${style}. ` +
        `This is a ${categoryDesc}. ` +
        `Maintain tileable patterns, keep the texture seamless, preserve the mood and atmosphere. ` +
        `Size: ${texture.width}x${texture.height} pixels.`;
      break;

    case Category.FLAT:
      basePrompt = `Transform this DOOM flat texture (${texture.name}) ${style}. ` +
        `This is used for ${categoryDesc}. ` +
        `Ensure the texture tiles seamlessly in all directions. ` +
        `Size: ${texture.width}x${texture.height} pixels.`;
      break;

    case Category.HUD:
      basePrompt = `Transform this DOOM HUD element (${texture.name}) ${style}. ` +
        `This is part of ${categoryDesc}. ` +
        `Maintain readability, preserve functional elements, keep clear visibility. ` +
        `Size: ${texture.width}x${texture.height} pixels.`;
      break;

    case Category.MENU:
      basePrompt = `Transform this DOOM menu graphic (${texture.name}) ${style}. ` +
        `This is used for ${categoryDesc}. ` +
        `Maintain text readability, preserve iconic DOOM branding elements. ` +
        `Size: ${texture.width}x${texture.height} pixels.`;
      break;

    default:
      basePrompt = `Transform this DOOM texture (${texture.name}) ${style}. ` +
        `Preserve the general structure and recognizability. ` +
        `Size: ${texture.width}x${texture.height} pixels.`;
  }

  return basePrompt;
}

/**
 * Group textures by category
 */
export function groupTexturesByCategory(textures: ExtractedTexture[]): TextureGroup[] {
  const groups = new Map<TextureCategory, ExtractedTexture[]>();

  // Group textures
  for (const texture of textures) {
    const existing = groups.get(texture.category) || [];
    existing.push(texture);
    groups.set(texture.category, existing);
  }

  // Create texture groups with prompts
  const result: TextureGroup[] = [];

  for (const [category, categoryTextures] of Array.from(groups.entries())) {
    const categoryDesc = getCategoryDescription(category);
    const groupPrompt = `Transform a batch of DOOM ${categoryDesc} while maintaining consistency and the retro gaming aesthetic.`;

    result.push({
      category,
      name: `${category.toUpperCase()} textures`,
      textures: categoryTextures,
      prompt: groupPrompt,
    });
  }

  return result;
}

/**
 * Group textures by name prefix (useful for sprite sequences)
 */
export function groupTexturesByPrefix(textures: ExtractedTexture[], prefixLength: number = 4): Map<string, ExtractedTexture[]> {
  const groups = new Map<string, ExtractedTexture[]>();

  for (const texture of textures) {
    const prefix = texture.name.substring(0, prefixLength);
    const existing = groups.get(prefix) || [];
    existing.push(texture);
    groups.set(prefix, existing);
  }

  return groups;
}

/**
 * Build batch prompt for a group of related textures
 */
export function buildBatchPrompt(
  textures: ExtractedTexture[],
  style: string = 'with enhanced visual quality'
): string {
  if (textures.length === 0) {
    return '';
  }

  const firstTexture = textures[0];
  const category = firstTexture.category;
  const categoryDesc = getCategoryDescription(category);

  return `Transform a set of ${textures.length} related DOOM textures (${categoryDesc}) ${style}. ` +
    `Maintain visual consistency across all textures in this set. ` +
    `Preserve the retro gaming aesthetic and recognizable characteristics. ` +
    `Texture names: ${textures.map(t => t.name).join(', ')}`;
}

/**
 * Create semantic grouping based on texture names and patterns
 */
export function createSemanticGroups(textures: ExtractedTexture[]): Map<string, TextureGroup> {
  const groups = new Map<string, TextureGroup>();

  // Define semantic groups based on common DOOM texture naming
  const semanticPatterns: Record<string, { pattern: RegExp; description: string; category: TextureCategory }> = {
    'player-sprites': {
      pattern: /^PLAY/i,
      description: 'Player character sprites',
      category: Category.SPRITE,
    },
    'imp-sprites': {
      pattern: /^TROO/i,
      description: 'Imp monster sprites',
      category: Category.SPRITE,
    },
    'shotgun': {
      pattern: /^SHT[GF]/i,
      description: 'Shotgun weapon sprites',
      category: Category.SPRITE,
    },
    'projectiles': {
      pattern: /^(BAL[0-9]|MISL|BFS1)/i,
      description: 'Projectile sprites (fireballs, missiles)',
      category: Category.SPRITE,
    },
    'pickups': {
      pattern: /^(STIM|MEDI|ARM[12]|BON[12])/i,
      description: 'Health and armor pickups',
      category: Category.SPRITE,
    },
    'keys': {
      pattern: /^[BRY](KEY|SKU)/i,
      description: 'Key and skull key sprites',
      category: Category.SPRITE,
    },
    'weapons': {
      pattern: /^(PUNG|PISG|CHGG|MISG|SAWG|PLSG|BFGG)/i,
      description: 'Weapon pickup sprites',
      category: Category.SPRITE,
    },
    'ammo': {
      pattern: /^(CLIP|AMMO|ROCK|BROK|CELL|CELP|SHEL|SBOX)/i,
      description: 'Ammunition pickups',
      category: Category.SPRITE,
    },
    'decorations': {
      pattern: /^(COL[0-9]|TRE[0-9]|CAND|CBRA)/i,
      description: 'Decorative objects',
      category: Category.SPRITE,
    },
  };

  // Group textures by semantic patterns
  for (const [groupName, { pattern, description, category }] of Object.entries(semanticPatterns)) {
    const matchingTextures = textures.filter(t => pattern.test(t.name));

    if (matchingTextures.length > 0) {
      const groupPrompt = `Transform DOOM ${description.toLowerCase()} while maintaining their iconic appearance and game functionality.`;

      groups.set(groupName, {
        category,
        name: description,
        textures: matchingTextures,
        prompt: groupPrompt,
      });
    }
  }

  // Add remaining ungrouped textures
  const groupedNames = new Set<string>();
  for (const group of Array.from(groups.values())) {
    for (const texture of group.textures) {
      groupedNames.add(texture.name);
    }
  }

  const ungroupedTextures = textures.filter(t => !groupedNames.has(t.name));
  if (ungroupedTextures.length > 0) {
    const categoryGroups = groupTexturesByCategory(ungroupedTextures);
    for (const categoryGroup of categoryGroups) {
      groups.set(`other-${categoryGroup.category}`, categoryGroup);
    }
  }

  return groups;
}

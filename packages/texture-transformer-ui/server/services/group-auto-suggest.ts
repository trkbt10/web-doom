/**
 * Auto-suggest texture groups based on naming patterns
 */

import { listGroups } from './texture-group-manager';

export interface GroupSuggestion {
  name: string;
  description: string;
  textureNames: string[];
  pattern: string;
}

interface PatternGroup {
  prefix: string;
  textures: string[];
}

/**
 * Analyze texture names and suggest groups based on common patterns
 */
export async function suggestGroups(
  projectId: string,
  allTextureNames: string[]
): Promise<GroupSuggestion[]> {
  // Get existing groups to avoid duplicates
  const existingGroups = await listGroups(projectId);
  const usedTextures = new Set<string>();

  // Collect all textures already in groups
  for (const group of existingGroups) {
    for (const textureName of group.textureNames) {
      usedTextures.add(textureName);
    }
  }

  // Filter out textures already in groups
  const availableTextures = allTextureNames.filter(name => !usedTextures.has(name));

  if (availableTextures.length === 0) {
    return [];
  }

  // Extract patterns and group textures
  const patternGroups = extractPatterns(availableTextures);

  // Convert to suggestions
  const suggestions: GroupSuggestion[] = [];

  for (const group of patternGroups) {
    // Only suggest groups with 3 or more textures
    if (group.textures.length < 3) {
      continue;
    }

    const name = generateGroupName(group.prefix);
    const description = `Auto-detected group for ${group.prefix} textures (${group.textures.length} textures)`;

    suggestions.push({
      name,
      description,
      textureNames: group.textures,
      pattern: group.prefix,
    });
  }

  // Sort by texture count (descending)
  suggestions.sort((a, b) => b.textureNames.length - a.textureNames.length);

  return suggestions;
}

/**
 * Extract common patterns from texture names
 */
function extractPatterns(textureNames: string[]): PatternGroup[] {
  const patterns = new Map<string, string[]>();

  for (const name of textureNames) {
    // Extract prefix (remove trailing numbers, underscores, hyphens)
    const prefix = extractPrefix(name);

    if (!prefix) {
      continue;
    }

    if (!patterns.has(prefix)) {
      patterns.set(prefix, []);
    }

    patterns.get(prefix)!.push(name);
  }

  return Array.from(patterns.entries()).map(([prefix, textures]) => ({
    prefix,
    textures: textures.sort(),
  }));
}

/**
 * Extract common prefix from texture name
 * Examples:
 *   WALL01 -> WALL
 *   DOOR_A -> DOOR
 *   ENEMY-1 -> ENEMY
 *   SW1COMP -> SW1COMP (no suffix)
 *   TLITE6_5 -> TLITE
 */
function extractPrefix(name: string): string {
  // Remove common suffixes: numbers, letters after separators
  let prefix = name
    // Remove trailing numbers
    .replace(/\d+$/, '')
    // Remove trailing single letters after separators
    .replace(/[_-][A-Z]$/i, '')
    // Remove trailing separators
    .replace(/[_-]+$/, '');

  // If prefix is too short (less than 2 chars), use the original name
  if (prefix.length < 2) {
    // Try to extract meaningful prefix from middle
    const match = name.match(/^([A-Z]{2,})/i);
    if (match) {
      prefix = match[1];
    } else {
      prefix = name;
    }
  }

  return prefix;
}

/**
 * Generate a human-readable group name from prefix
 */
function generateGroupName(prefix: string): string {
  // Convert common DOOM texture prefixes to readable names
  const knownPrefixes: Record<string, string> = {
    // Walls
    WALL: 'Wall Textures',
    STONE: 'Stone Walls',
    BRICK: 'Brick Walls',
    WOOD: 'Wood Walls',
    METAL: 'Metal Walls',
    ROCK: 'Rock Walls',

    // Doors & Switches
    DOOR: 'Door Textures',
    SW: 'Switch Textures',

    // Tech
    COMP: 'Computer Textures',
    TECH: 'Tech Textures',
    LITE: 'Light Textures',
    TLITE: 'Tech Light Textures',

    // Floors & Ceilings
    FLAT: 'Flat Textures',
    FLOOR: 'Floor Textures',
    CEIL: 'Ceiling Textures',

    // Liquids
    SLIME: 'Slime Textures',
    BLOOD: 'Blood Textures',
    NUKAGE: 'Nukage Textures',
    LAVA: 'Lava Textures',
    WATER: 'Water Textures',

    // Enemies & Sprites
    ENEMY: 'Enemy Sprites',
    BOSS: 'Boss Sprites',
    TROO: 'Imp Sprites',
    SARG: 'Demon Sprites',
    POSS: 'Zombie Sprites',

    // Items
    ITEM: 'Item Sprites',
    AMMO: 'Ammo Sprites',
    WEAP: 'Weapon Sprites',

    // Sky
    SKY: 'Sky Textures',

    // Misc
    EXIT: 'Exit Signs',
    SIGN: 'Sign Textures',
  };

  // Check if we have a known prefix
  const upperPrefix = prefix.toUpperCase();
  for (const [key, value] of Object.entries(knownPrefixes)) {
    if (upperPrefix.startsWith(key) || upperPrefix === key) {
      return value;
    }
  }

  // Generate generic name
  const cleanPrefix = prefix
    .replace(/[_-]/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());

  return `${cleanPrefix} Group`;
}

/**
 * Check if texture belongs to any pattern
 */
export function findTexturePattern(
  textureName: string,
  suggestions: GroupSuggestion[]
): GroupSuggestion | null {
  for (const suggestion of suggestions) {
    if (suggestion.textureNames.includes(textureName)) {
      return suggestion;
    }
  }
  return null;
}

/**
 * Controller theme system
 * Provides pre-defined themes for easy styling without manual configuration
 */

export interface ControllerTheme {
  /** Unique theme identifier */
  id: string;
  /** Display name */
  name: string;
  /** Theme description */
  description: string;
  /** Style prompt for AI transformation */
  stylePrompt: string;
  /** Transformation strength (0-1) for backends that support it */
  strength?: number;
  /** Preview colors for UI */
  previewColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  /** Category for grouping */
  category?: 'sci-fi' | 'retro' | 'industrial' | 'fantasy' | 'minimal';
}

/**
 * Pre-defined controller themes (reduced to 3 for faster generation)
 */
export const CONTROLLER_THEMES: Record<string, ControllerTheme> = {
  doom: {
    id: 'doom',
    name: 'DOOM Classic',
    description: 'Classic DOOM game aesthetic with demonic and hellish themes',
    stylePrompt: 'DOOM game style with demonic skulls, hellfire, dark metal textures, blood red and dark green colors',
    strength: 0.85,
    category: 'sci-fi',
    previewColors: {
      primary: '#8B0000',
      secondary: '#1a1a1a',
      accent: '#00ff00',
    },
  },

  retro: {
    id: 'retro',
    name: 'Retro Arcade',
    description: '80s arcade aesthetic with pixel art and CRT effects',
    stylePrompt: 'retro arcade style with 80s aesthetic, pixelated details, CRT scanlines, vintage gaming look',
    strength: 0.75,
    category: 'retro',
    previewColors: {
      primary: '#ff6b9d',
      secondary: '#c56cf0',
      accent: '#ffa502',
    },
  },

  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'Futuristic cyberpunk style with neon lights and holographic effects',
    stylePrompt: 'cyberpunk neon style with holographic buttons and futuristic design, glowing edges, high-tech aesthetic',
    strength: 0.8,
    category: 'sci-fi',
    previewColors: {
      primary: '#00ffff',
      secondary: '#ff00ff',
      accent: '#ffff00',
    },
  },
};

/**
 * Get theme by ID
 */
export function getTheme(themeId: string): ControllerTheme | undefined {
  return CONTROLLER_THEMES[themeId];
}

/**
 * Get all themes
 */
export function getAllThemes(): ControllerTheme[] {
  return Object.values(CONTROLLER_THEMES);
}

/**
 * Get themes by category
 */
export function getThemesByCategory(category: ControllerTheme['category']): ControllerTheme[] {
  return getAllThemes().filter((theme) => theme.category === category);
}

/**
 * Get default theme
 */
export function getDefaultTheme(): ControllerTheme {
  return CONTROLLER_THEMES.cyberpunk;
}

/**
 * Theme categories for UI grouping
 */
export const THEME_CATEGORIES = [
  { id: 'sci-fi', name: 'Sci-Fi', icon: '🚀' },
  { id: 'retro', name: 'Retro', icon: '👾' },
  { id: 'industrial', name: 'Industrial', icon: '⚙️' },
  { id: 'fantasy', name: 'Fantasy', icon: '✨' },
  { id: 'minimal', name: 'Minimal', icon: '◻️' },
] as const;

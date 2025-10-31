export interface Project {
  id: string;
  name: string;
  wadFile: string;
  createdAt: string;
  updatedAt: string;
  textureCount: number;
  transformedCount: number;
  description?: string;
  autoSuggestExecuted?: boolean;
  commonPrompt?: string;
}

export interface TextureMetadata {
  name: string;
  category: string;
  originalBase64?: string;
  transformedBase64?: string;
  confirmed: boolean;
  transformHistory: TransformRecord[];
}

export interface TransformRecord {
  timestamp: string;
  prompt: string;
  strength: number;
  steps: number;
  guidanceScale: number;
  seed?: number;
  resultBase64: string;
}

export interface TextureLayout {
  textureName: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextureGroup {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  textureNames: string[];
  spriteSheetBase64?: string;
  transformedSpriteSheetBase64?: string;
  layout: TextureLayout[];
  spriteSheetWidth?: number;
  spriteSheetHeight?: number;
  createdAt: string;
  updatedAt: string;
  transformHistory: GroupTransformRecord[];
}

export interface GroupTransformRecord {
  timestamp: string;
  prompt: string;
  transformer: 'gemini'; // Always Gemini for stability
  strength: number;
  steps: number;
  guidanceScale: number;
  negativePrompt?: string;
  resultBase64: string;
}

export interface GroupSuggestion {
  name: string;
  description: string;
  textureNames: string[];
  pattern: string;
}

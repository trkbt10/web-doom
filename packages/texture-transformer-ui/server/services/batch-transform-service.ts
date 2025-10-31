import {
  transformTexture,
  type BatchTransformRequest,
  type BatchTransformProgress,
  type TransformResponse,
} from './transform-service';
import { listTextures } from './project-manager';

export interface BatchTransformResult {
  success: boolean;
  total: number;
  completed: number;
  failed: number;
  results: TransformResponse[];
  error?: string;
}

/**
 * Transform multiple textures in batch
 */
export async function batchTransformTextures(
  request: BatchTransformRequest,
  onProgress?: (progress: BatchTransformProgress) => void
): Promise<BatchTransformResult> {
  const results: TransformResponse[] = [];
  let completed = 0;
  let failed = 0;

  const total = request.textureNames.length;

  for (const textureName of request.textureNames) {
    if (onProgress) {
      onProgress({
        total,
        completed,
        failed,
        current: textureName,
      });
    }

    const result = await transformTexture({
      projectId: request.projectId,
      textureName,
      prompt: request.prompt,
      transformer: request.transformer,
      strength: request.strength,
      steps: request.steps,
      guidanceScale: request.guidanceScale,
      seed: request.seed,
      negativePrompt: request.negativePrompt,
    });

    results.push(result);

    if (result.success) {
      completed++;
    } else {
      failed++;
    }
  }

  if (onProgress) {
    onProgress({
      total,
      completed,
      failed,
    });
  }

  return {
    success: failed === 0,
    total,
    completed,
    failed,
    results,
  };
}

/**
 * Transform all pending textures in a project
 */
export async function batchTransformPending(
  projectId: string,
  prompt: string,
  transformer: 'gemini' = 'gemini', // Always use Gemini for stability
  options?: {
    strength?: number;
    steps?: number;
    guidanceScale?: number;
    seed?: number;
    negativePrompt?: string;
  },
  onProgress?: (progress: BatchTransformProgress) => void
): Promise<BatchTransformResult> {
  // Get all textures
  const textures = await listTextures(projectId);

  // Filter to only pending (not yet transformed)
  const pendingTextures = textures
    .filter((t) => !t.transformedBase64)
    .map((t) => t.name);

  if (pendingTextures.length === 0) {
    return {
      success: true,
      total: 0,
      completed: 0,
      failed: 0,
      results: [],
    };
  }

  return batchTransformTextures(
    {
      projectId,
      textureNames: pendingTextures,
      prompt,
      transformer,
      ...options,
    },
    onProgress
  );
}

/**
 * Transform all textures by category
 */
export async function batchTransformByCategory(
  projectId: string,
  category: string,
  prompt: string,
  transformer: 'gemini' = 'gemini', // Always use Gemini for stability
  options?: {
    strength?: number;
    steps?: number;
    guidanceScale?: number;
    seed?: number;
    negativePrompt?: string;
  },
  onProgress?: (progress: BatchTransformProgress) => void
): Promise<BatchTransformResult> {
  // Get all textures
  const textures = await listTextures(projectId);

  // Filter by category
  const categoryTextures = textures
    .filter((t) => t.category.toLowerCase() === category.toLowerCase())
    .map((t) => t.name);

  if (categoryTextures.length === 0) {
    return {
      success: true,
      total: 0,
      completed: 0,
      failed: 0,
      results: [],
    };
  }

  return batchTransformTextures(
    {
      projectId,
      textureNames: categoryTextures,
      prompt,
      transformer,
      ...options,
    },
    onProgress
  );
}

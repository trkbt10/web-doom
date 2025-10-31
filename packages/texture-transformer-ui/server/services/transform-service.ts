import {
  createImageTransformer,
  type TransformationResult,
  type TextureCategory,
  type ExtractedTexture,
  type UnifiedTransformerClient,
} from '@web-doom/texture-transformer';
import {
  getTextureMetadata,
  saveTextureMetadata,
  saveTransformedTexture,
  updateProject,
  getProject,
  type TransformRecord,
} from './project-manager';

export interface TransformRequest {
  projectId: string;
  textureName: string;
  prompt: string;
  transformer?: 'gemini'; // Gemini only for stability
  strength?: number;
  steps?: number;
  guidanceScale?: number;
  seed?: number;
  negativePrompt?: string;
}

export interface BatchTransformRequest {
  projectId: string;
  textureNames: string[];
  prompt: string;
  transformer?: 'gemini'; // Gemini only for stability
  strength?: number;
  steps?: number;
  guidanceScale?: number;
  seed?: number;
  negativePrompt?: string;
}

export interface BatchTransformProgress {
  total: number;
  completed: number;
  failed: number;
  current?: string;
}

export interface TransformResponse {
  success: boolean;
  textureName: string;
  transformedBase64?: string;
  error?: string;
}

/**
 * Get transformer client - always uses Gemini for stability
 */
function getTransformerClient(
  _transformer: 'gemini' = 'gemini'
): UnifiedTransformerClient {
  // Always use Gemini to avoid SSL certificate issues with Nanobanana
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured. Set GEMINI_API_KEY environment variable.');
  }

  return createImageTransformer({
    backend: 'gemini',
    apiKey,
  });
}

/**
 * Transform a single texture using AI (Gemini only)
 */
export async function transformTexture(
  request: TransformRequest
): Promise<TransformResponse> {
  try {
    // Always use Gemini
    const transformer = 'gemini';

    // Get texture metadata
    const metadata = await getTextureMetadata(request.projectId, request.textureName);
    if (!metadata) {
      throw new Error(`Texture not found: ${request.textureName}`);
    }

    if (!metadata.originalBase64) {
      throw new Error(`Original texture data not found: ${request.textureName}`);
    }

    // Create transformer client (always Gemini)
    const client = getTransformerClient(transformer);

    // Prepare transform options for Gemini
    const options: any = {
      style: request.prompt,
    };

    // Transform texture
    const textureInput: ExtractedTexture = {
      name: request.textureName,
      category: metadata.category as TextureCategory,
      imageData: metadata.originalBase64 || '',
      width: 0, // Will be extracted from image
      height: 0,
    };

    const result: TransformationResult = await client.transform(textureInput, options);

    if (result.status !== 'success' || !result.transformed) {
      throw new Error(result.error || 'Transformation failed');
    }

    // Save transformed image
    console.log(`💾 Saving transformed texture: ${request.textureName}`);
    await saveTransformedTexture(
      request.projectId,
      request.textureName,
      result.transformed
    );
    console.log(`✅ Saved transformed texture to: data/${request.projectId}/transformed/${request.textureName}.png`);

    // Update metadata with transformation history
    const transformRecord: TransformRecord = {
      timestamp: new Date().toISOString(),
      prompt: request.prompt,
      strength: request.strength ?? 0.75,
      steps: request.steps ?? 30,
      guidanceScale: request.guidanceScale ?? 7.5,
      seed: request.seed,
      resultBase64: result.transformed,
    };

    metadata.transformedBase64 = result.transformed;
    metadata.transformHistory.push(transformRecord);

    await saveTextureMetadata(request.projectId, request.textureName, metadata);

    // Update project transformed count if this is first transformation
    if (!metadata.transformHistory || metadata.transformHistory.length === 1) {
      const project = await getProject(request.projectId);
      if (project) {
        await updateProject(request.projectId, {
          transformedCount: project.transformedCount + 1,
        });
      }
    }

    return {
      success: true,
      textureName: request.textureName,
      transformedBase64: result.transformed,
    };
  } catch (error) {
    console.error('Transform error:', error);
    return {
      success: false,
      textureName: request.textureName,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Confirm a transformation (mark as final)
 */
export async function confirmTransformation(
  projectId: string,
  textureName: string
): Promise<void> {
  const metadata = await getTextureMetadata(projectId, textureName);
  if (!metadata) {
    throw new Error(`Texture not found: ${textureName}`);
  }

  metadata.confirmed = true;
  await saveTextureMetadata(projectId, textureName, metadata);
}

/**
 * Revert to a previous transformation
 */
export async function revertToTransform(
  projectId: string,
  textureName: string,
  historyIndex: number
): Promise<void> {
  const metadata = await getTextureMetadata(projectId, textureName);
  if (!metadata) {
    throw new Error(`Texture not found: ${textureName}`);
  }

  if (historyIndex < 0 || historyIndex >= metadata.transformHistory.length) {
    throw new Error(`Invalid history index: ${historyIndex}`);
  }

  const selectedTransform = metadata.transformHistory[historyIndex];
  metadata.transformedBase64 = selectedTransform.resultBase64;

  console.log(`🔄 Reverting texture ${textureName} to history index ${historyIndex}`);
  await saveTransformedTexture(projectId, textureName, selectedTransform.resultBase64);
  await saveTextureMetadata(projectId, textureName, metadata);
  console.log(`✅ Reverted successfully`);
}

/**
 * Reset texture to original
 */
export async function resetTexture(
  projectId: string,
  textureName: string
): Promise<void> {
  const metadata = await getTextureMetadata(projectId, textureName);
  if (!metadata) {
    throw new Error(`Texture not found: ${textureName}`);
  }

  metadata.transformedBase64 = undefined;
  metadata.confirmed = false;
  metadata.transformHistory = [];

  await saveTextureMetadata(projectId, textureName, metadata);
}

/**
 * Transform a raw image (base64) without project/texture context
 * Used for sprite sheet transformations (Gemini only)
 */
export async function transformImage(options: {
  imageBase64: string;
  prompt: string;
  transformer?: 'gemini';
  strength?: number;
  steps?: number;
  guidanceScale?: number;
  negativePrompt?: string;
}): Promise<string> {
  // Always use Gemini
  const transformer = 'gemini';

  // Create transformer client (always Gemini)
  const client = getTransformerClient(transformer);

  // Prepare transform options for Gemini
  const transformOptions: any = {
    style: options.prompt,
  };

  // Transform image
  const textureInput: ExtractedTexture = {
    name: 'sprite-sheet',
    category: 'flat' as TextureCategory,
    imageData: options.imageBase64,
    width: 0,
    height: 0,
  };

  const result: TransformationResult = await client.transform(textureInput, transformOptions);

  if (result.status !== 'success' || !result.transformed) {
    throw new Error(result.error || 'Transformation failed');
  }

  return result.transformed;
}

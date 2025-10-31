import { Hono } from 'hono';
import {
  listTextures,
  getTextureMetadata,
} from '../services/project-manager';
import {
  extractAndSaveTextures,
} from '../services/wad-service';
import {
  transformTexture,
  confirmTransformation,
  revertToTransform,
  resetTexture,
} from '../services/transform-service';

const app = new Hono();

/**
 * GET /api/textures/:projectId
 * List all textures in a project
 */
app.get('/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const textures = await listTextures(projectId);
    return c.json({ success: true, textures });
  } catch (error) {
    console.error('List textures error:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * GET /api/textures/:projectId/:textureName
 * Get specific texture metadata
 */
app.get('/:projectId/:textureName', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const textureName = c.req.param('textureName');

    const texture = await getTextureMetadata(projectId, textureName);
    if (!texture) {
      return c.json({ success: false, error: 'Texture not found' }, 404);
    }

    return c.json({ success: true, texture });
  } catch (error) {
    console.error('Get texture error:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * POST /api/textures/:projectId/extract
 * Extract textures from WAD file
 */
app.post('/:projectId/extract', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const { wadPath } = await c.req.json();

    if (!wadPath) {
      return c.json({ success: false, error: 'Missing wadPath' }, 400);
    }

    const result = await extractAndSaveTextures(projectId, wadPath);
    return c.json({
      success: true,
      groups: result.groups,
      total: result.total,
    });
  } catch (error) {
    console.error('Extract textures error:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * POST /api/textures/:projectId/:textureName/transform
 * Transform a texture using Gemini
 */
app.post('/:projectId/:textureName/transform', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const textureName = c.req.param('textureName');
    const body = await c.req.json();

    const result = await transformTexture({
      projectId,
      textureName,
      prompt: body.prompt,
      strength: body.strength,
      steps: body.steps,
      guidanceScale: body.guidanceScale,
      seed: body.seed,
      negativePrompt: body.negativePrompt,
    });

    return c.json(result);
  } catch (error) {
    console.error('Transform texture error:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * POST /api/textures/:projectId/:textureName/confirm
 * Confirm a transformation
 */
app.post('/:projectId/:textureName/confirm', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const textureName = c.req.param('textureName');

    await confirmTransformation(projectId, textureName);
    return c.json({ success: true });
  } catch (error) {
    console.error('Confirm transformation error:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * POST /api/textures/:projectId/:textureName/revert
 * Revert to a previous transformation
 */
app.post('/:projectId/:textureName/revert', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const textureName = c.req.param('textureName');
    const { historyIndex } = await c.req.json();

    if (typeof historyIndex !== 'number') {
      return c.json({ success: false, error: 'Missing historyIndex' }, 400);
    }

    await revertToTransform(projectId, textureName, historyIndex);
    return c.json({ success: true });
  } catch (error) {
    console.error('Revert transformation error:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

/**
 * POST /api/textures/:projectId/:textureName/reset
 * Reset texture to original
 */
app.post('/:projectId/:textureName/reset', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const textureName = c.req.param('textureName');

    await resetTexture(projectId, textureName);
    return c.json({ success: true });
  } catch (error) {
    console.error('Reset texture error:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default app;

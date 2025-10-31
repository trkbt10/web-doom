import { Hono } from 'hono';
import { join } from 'path';
import { recompileProjectWAD } from '../services/wad-service';
import {
  exportProject,
  importProject,
  exportProjectJSON,
} from '../services/project-export-service';
import {
  batchTransformTextures,
  batchTransformPending,
  batchTransformByCategory,
} from '../services/batch-transform-service';

const app = new Hono();

/**
 * POST /api/export/:projectId/wad
 * Export transformed WAD file
 */
app.post('/:projectId/wad', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const outputPath = join(
      process.cwd(),
      'exports',
      `${projectId}-transformed.wad`
    );

    const result = await recompileProjectWAD(projectId, outputPath);

    if (result.success) {
      return c.json({
        success: true,
        filePath: outputPath,
        replacedCount: result.replacedCount,
      });
    } else {
      return c.json(
        {
          success: false,
          error: result.error || 'WAD recompilation failed',
        },
        500
      );
    }
  } catch (error) {
    console.error('Export WAD error:', error);
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
 * POST /api/export/:projectId/project
 * Export entire project as archive
 */
app.post('/:projectId/project', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const result = await exportProject(projectId);

    if (result.success) {
      return c.json({
        success: true,
        filePath: result.filePath,
      });
    } else {
      return c.json(
        {
          success: false,
          error: result.error || 'Project export failed',
        },
        500
      );
    }
  } catch (error) {
    console.error('Export project error:', error);
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
 * POST /api/export/:projectId/json
 * Export project metadata as JSON
 */
app.post('/:projectId/json', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const result = await exportProjectJSON(projectId);

    if (result.success && result.data) {
      return c.json({
        success: true,
        data: result.data,
      });
    } else {
      return c.json(
        {
          success: false,
          error: result.error || 'JSON export failed',
        },
        500
      );
    }
  } catch (error) {
    console.error('Export JSON error:', error);
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
 * POST /api/export/import
 * Import project from archive
 */
app.post('/import', async (c) => {
  try {
    const { archivePath, newName } = await c.req.json();

    if (!archivePath) {
      return c.json({ success: false, error: 'Missing archivePath' }, 400);
    }

    const result = await importProject(archivePath, newName);

    if (result.success) {
      return c.json({
        success: true,
        project: result.project,
      });
    } else {
      return c.json(
        {
          success: false,
          error: result.error || 'Project import failed',
        },
        500
      );
    }
  } catch (error) {
    console.error('Import project error:', error);
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
 * POST /api/export/batch/:projectId
 * Batch transform textures
 */
app.post('/batch/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const body = await c.req.json();

    const { textureNames, prompt, transformer, strength, steps, guidanceScale, seed, negativePrompt } = body;

    if (!prompt) {
      return c.json({ success: false, error: 'Missing prompt' }, 400);
    }

    const result = await batchTransformTextures({
      projectId,
      textureNames: textureNames || [],
      prompt,
      transformer: transformer || 'gemini', // Always use Gemini for stability
      strength,
      steps,
      guidanceScale,
      seed,
      negativePrompt,
    });

    return c.json(result);
  } catch (error) {
    console.error('Batch transform error:', error);
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
 * POST /api/export/batch/:projectId/pending
 * Batch transform all pending textures
 */
app.post('/batch/:projectId/pending', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const body = await c.req.json();

    const { prompt, transformer, strength, steps, guidanceScale, seed, negativePrompt } = body;

    if (!prompt) {
      return c.json({ success: false, error: 'Missing prompt' }, 400);
    }

    const result = await batchTransformPending(
      projectId,
      prompt,
      transformer || 'gemini', // Always use Gemini for stability
      { strength, steps, guidanceScale, seed, negativePrompt }
    );

    return c.json(result);
  } catch (error) {
    console.error('Batch transform pending error:', error);
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
 * POST /api/export/batch/:projectId/category/:category
 * Batch transform textures by category
 */
app.post('/batch/:projectId/category/:category', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const category = c.req.param('category');
    const body = await c.req.json();

    const { prompt, transformer, strength, steps, guidanceScale, seed, negativePrompt } = body;

    if (!prompt) {
      return c.json({ success: false, error: 'Missing prompt' }, 400);
    }

    const result = await batchTransformByCategory(
      projectId,
      category,
      prompt,
      transformer || 'gemini', // Always use Gemini for stability
      { strength, steps, guidanceScale, seed, negativePrompt }
    );

    return c.json(result);
  } catch (error) {
    console.error('Batch transform category error:', error);
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

/**
 * Texture Groups API Routes
 */

import { Hono } from 'hono';
import {
  listGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  generateSpriteSheet,
  extractTexturesFromSpriteSheet,
  addGroupTransformRecord,
  type GroupTransformRecord,
} from '../services/texture-group-manager';
import { transformImage } from '../services/transform-service';
import { suggestGroups } from '../services/group-auto-suggest';
import { getProject, updateProject } from '../services/project-manager';

const app = new Hono();

/**
 * GET /api/groups/:projectId
 * List all groups for a project
 */
app.get('/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const groups = await listGroups(projectId);

    return c.json({
      success: true,
      groups,
    });
  } catch (error) {
    console.error('Failed to list groups:', error);
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
 * GET /api/groups/:projectId/:groupId
 * Get a specific group
 */
app.get('/:projectId/:groupId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const groupId = c.req.param('groupId');

    const group = await getGroup(projectId, groupId);

    if (!group) {
      return c.json(
        {
          success: false,
          error: 'Group not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      group,
    });
  } catch (error) {
    console.error('Failed to get group:', error);
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
 * POST /api/groups/:projectId
 * Create a new texture group
 */
app.post('/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const body = await c.req.json();

    const { name, textureNames, description } = body;

    if (!name || !textureNames || !Array.isArray(textureNames)) {
      return c.json(
        {
          success: false,
          error: 'Name and textureNames are required',
        },
        400
      );
    }

    const group = await createGroup(projectId, name, textureNames, description);

    return c.json({
      success: true,
      group,
    });
  } catch (error) {
    console.error('Failed to create group:', error);
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
 * PUT /api/groups/:projectId/:groupId
 * Update a texture group
 */
app.put('/:projectId/:groupId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const groupId = c.req.param('groupId');
    const body = await c.req.json();

    const group = await updateGroup(projectId, groupId, body);

    return c.json({
      success: true,
      group,
    });
  } catch (error) {
    console.error('Failed to update group:', error);
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
 * DELETE /api/groups/:projectId/:groupId
 * Delete a texture group
 */
app.delete('/:projectId/:groupId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const groupId = c.req.param('groupId');

    await deleteGroup(projectId, groupId);

    return c.json({
      success: true,
    });
  } catch (error) {
    console.error('Failed to delete group:', error);
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
 * POST /api/groups/:projectId/:groupId/generate-sprite
 * Generate sprite sheet for a group
 */
app.post('/:projectId/:groupId/generate-sprite', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const groupId = c.req.param('groupId');

    const group = await generateSpriteSheet(projectId, groupId);

    return c.json({
      success: true,
      group,
    });
  } catch (error) {
    console.error('Failed to generate sprite sheet:', error);
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
 * POST /api/groups/:projectId/:groupId/transform
 * Transform the sprite sheet
 */
app.post('/:projectId/:groupId/transform', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const groupId = c.req.param('groupId');
    const body = await c.req.json();

    const {
      prompt,
      transformer = 'gemini', // Always use Gemini for stability
      strength = 0.75,
      steps = 30,
      guidanceScale = 7.5,
      negativePrompt,
    } = body;

    if (!prompt) {
      return c.json(
        {
          success: false,
          error: 'Prompt is required',
        },
        400
      );
    }

    const group = await getGroup(projectId, groupId);

    if (!group) {
      return c.json(
        {
          success: false,
          error: 'Group not found',
        },
        404
      );
    }

    if (!group.spriteSheetBase64) {
      return c.json(
        {
          success: false,
          error: 'Sprite sheet not generated yet',
        },
        400
      );
    }

    // Transform the sprite sheet
    const transformedBase64 = await transformImage({
      imageBase64: group.spriteSheetBase64,
      prompt,
      transformer,
      strength,
      steps,
      guidanceScale,
      negativePrompt,
    });

    // Add transform record
    const record: GroupTransformRecord = {
      timestamp: new Date().toISOString(),
      prompt,
      transformer,
      strength,
      steps,
      guidanceScale,
      negativePrompt,
      resultBase64: transformedBase64,
    };

    const updatedGroup = await addGroupTransformRecord(projectId, groupId, record);

    return c.json({
      success: true,
      group: updatedGroup,
    });
  } catch (error) {
    console.error('Failed to transform sprite sheet:', error);
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
 * POST /api/groups/:projectId/:groupId/extract
 * Extract individual textures from transformed sprite sheet
 * Returns the extracted textures for immediate preview
 */
app.post('/:projectId/:groupId/extract', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const groupId = c.req.param('groupId');

    const extractedTextures = await extractTexturesFromSpriteSheet(projectId, groupId);

    return c.json({
      success: true,
      textures: extractedTextures,
    });
  } catch (error) {
    console.error('Failed to extract textures:', error);
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
 * POST /api/groups/:projectId/auto-suggest
 * Auto-suggest texture groups based on naming patterns
 */
app.post('/:projectId/auto-suggest', async (c) => {
  try {
    const projectId = c.req.param('projectId');

    // Check if already executed
    const project = await getProject(projectId);
    if (!project) {
      return c.json(
        {
          success: false,
          error: 'Project not found',
        },
        404
      );
    }

    if (project.autoSuggestExecuted) {
      return c.json(
        {
          success: false,
          error: 'Auto-suggest has already been executed for this project',
        },
        400
      );
    }

    // Get all textures
    const body = await c.req.json();
    const { textureNames } = body;

    if (!textureNames || !Array.isArray(textureNames)) {
      return c.json(
        {
          success: false,
          error: 'textureNames array is required',
        },
        400
      );
    }

    // Generate suggestions
    const suggestions = await suggestGroups(projectId, textureNames);

    return c.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error('Failed to auto-suggest groups:', error);
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
 * POST /api/groups/:projectId/batch-create
 * Batch create groups from suggestions
 */
app.post('/:projectId/batch-create', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const body = await c.req.json();

    const { suggestions } = body;

    if (!suggestions || !Array.isArray(suggestions)) {
      return c.json(
        {
          success: false,
          error: 'suggestions array is required',
        },
        400
      );
    }

    // Create all groups
    const createdGroups = [];
    for (const suggestion of suggestions) {
      const group = await createGroup(
        projectId,
        suggestion.name,
        suggestion.textureNames,
        suggestion.description
      );
      createdGroups.push(group);
    }

    // Mark auto-suggest as executed
    const project = await getProject(projectId);
    if (project) {
      await updateProject(projectId, {
        autoSuggestExecuted: true,
      });
    }

    return c.json({
      success: true,
      groups: createdGroups,
    });
  } catch (error) {
    console.error('Failed to batch create groups:', error);
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

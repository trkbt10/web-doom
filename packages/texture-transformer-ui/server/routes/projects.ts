import { Hono } from 'hono';
import { readFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
} from '../services/project-manager';
import { getCompilationStats } from '../services/wad-compiler';
import { recompileProjectWAD } from '../services/wad-service';

const app = new Hono();

/**
 * GET /api/projects
 * List all projects
 */
app.get('/', async (c) => {
  try {
    const projects = await listProjects();
    return c.json({ success: true, projects });
  } catch (error) {
    console.error('List projects error:', error);
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
 * POST /api/projects
 * Create a new project (with file upload)
 */
app.post('/', async (c) => {
  try {
    const body = await c.req.formData();
    const name = body.get('name') as string;
    const description = body.get('description') as string | null;
    const wadFile = body.get('wadFile') as File | null;

    if (!name || !wadFile) {
      return c.json(
        { success: false, error: 'Missing required fields: name, wadFile' },
        400
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await wadFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const project = await createProject(name, buffer, wadFile.name, description || undefined);
    return c.json({ success: true, project });
  } catch (error) {
    console.error('Create project error:', error);
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
 * GET /api/projects/:id
 * Get project details
 */
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const project = await getProject(id);

    if (!project) {
      return c.json({ success: false, error: 'Project not found' }, 404);
    }

    return c.json({ success: true, project });
  } catch (error) {
    console.error('Get project error:', error);
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
 * PATCH /api/projects/:id
 * Update project metadata
 */
app.patch('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();

    const project = await updateProject(id, updates);
    return c.json({ success: true, project });
  } catch (error) {
    console.error('Update project error:', error);
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
 * DELETE /api/projects/:id
 * Delete a project
 */
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await deleteProject(id);
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
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
 * POST /api/projects/:id/compile
 * Compile WAD file from project textures
 * Uses transformed textures if available, otherwise uses originals
 */
app.post('/:id/compile', async (c) => {
  try {
    const id = c.req.param('id');

    // Get compilation stats
    const stats = await getCompilationStats(id);
    console.log(`\n📊 Compilation Stats:`);
    console.log(`   Total: ${stats.total}`);
    console.log(`   Transformed: ${stats.transformed}`);
    console.log(`   Original: ${stats.original}\n`);

    // Get project info for filename
    const project = await getProject(id);
    const filename = project
      ? `${project.name.toLowerCase().replace(/\s+/g, '-')}.wad`
      : 'custom.wad';

    // Create temp directory if it doesn't exist
    const tempDir = join(process.cwd(), 'temp');
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    // Create temporary output path
    const tempPath = join(tempDir, `${id}-${Date.now()}.wad`);

    // Recompile WAD using the correct implementation
    const result = await recompileProjectWAD(id, tempPath);

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: result.error || 'WAD compilation failed',
        },
        500
      );
    }

    console.log(`✅ Replaced ${result.replacedCount} textures\n`);

    // Read the compiled WAD file
    const wadBuffer = await readFile(tempPath);

    // Clean up temporary file
    try {
      await unlink(tempPath);
    } catch (e) {
      console.warn('Failed to delete temporary file:', e);
    }

    // Set headers for file download
    c.header('Content-Type', 'application/octet-stream');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    c.header('Content-Length', wadBuffer.length.toString());

    return c.body(wadBuffer as any);
  } catch (error) {
    console.error('Compile WAD error:', error);
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

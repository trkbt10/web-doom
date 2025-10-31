import { Hono } from 'hono';
import { loadWAD, getTextureCatalog } from '../services/wad-service';

const app = new Hono();

/**
 * POST /api/wads/info
 * Get WAD file information
 */
app.post('/info', async (c) => {
  try {
    const { wadPath } = await c.req.json();

    if (!wadPath) {
      return c.json({ success: false, error: 'Missing wadPath' }, 400);
    }

    const { info } = await loadWAD(wadPath);
    return c.json({ success: true, info });
  } catch (error) {
    console.error('Load WAD error:', error);
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
 * POST /api/wads/catalog
 * Get texture catalog from WAD
 */
app.post('/catalog', async (c) => {
  try {
    const { wadPath } = await c.req.json();

    if (!wadPath) {
      return c.json({ success: false, error: 'Missing wadPath' }, 400);
    }

    const catalog = await getTextureCatalog(wadPath);
    return c.json({ success: true, catalog });
  } catch (error) {
    console.error('Get catalog error:', error);
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

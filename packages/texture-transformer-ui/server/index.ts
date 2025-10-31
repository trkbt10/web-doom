import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from 'bun';

import projectsRouter from './routes/projects';
import texturesRouter from './routes/textures';
import wadsRouter from './routes/wads';
import exportRouter from './routes/export';
import groupsRouter from './routes/groups';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// API routes
app.route('/api/projects', projectsRouter);
app.route('/api/textures', texturesRouter);
app.route('/api/wads', wadsRouter);
app.route('/api/export', exportRouter);
app.route('/api/groups', groupsRouter);

// Start server
const port = Number(process.env.PORT) || 8010;

console.log(`🚀 Texture Transformer UI Server starting on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ Server running at http://localhost:${port}`);
console.log(`📡 API available at http://localhost:${port}/api`);

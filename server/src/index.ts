import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import path from 'path';
import dotenv from 'dotenv';

// 引入中间件
import { corsMiddleware } from './middleware/cors.js';
import { securityMiddleware } from './middleware/security.js';
import { authMiddleware } from './middleware/auth.js';

// 引入路由组
import auth from './routes/auth.js';
import albums from './routes/albums.js';
import photos, { handleLegacyDeletePhoto } from './routes/photos.js';
import timeline from './routes/timeline.js';
import food from './routes/food.js';
import notes from './routes/notes.js';
import todos from './routes/todos.js';
import mapCheckins from './routes/map.js';
import timeCapsules from './routes/timeCapsules.js';
import config from './routes/config.js';
import stats from './routes/stats.js';
import upload from './routes/upload.js';
import images from './routes/images.js';

import { storage } from './lib/storage.js';

dotenv.config();

const app = new Hono();

// 1. 全局中间件
app.use('*', corsMiddleware);
app.use('*', securityMiddleware);
app.use('*', authMiddleware);

// 2. 注册路由组
app.route('/api/auth', auth);
app.route('/api/albums', albums);
app.route('/api/albums/:id/photos', photos);
app.route('/api/timeline', timeline);
app.route('/api/food', food);
app.route('/api/notes', notes);
app.route('/api/todos', todos);
app.route('/api/map', mapCheckins);
app.route('/api/time-capsules', timeCapsules);
app.route('/api/config', config);
app.route('/api/stats', stats);
app.route('/api/upload', upload);
app.route('/api/images', images);

// 3. 兼容旧版特定 POST 端点
app.post('/api/delete/photo', handleLegacyDeletePhoto);

// 4. 开发模式下托管本地 /uploads 静态资源（生产中由 Nginx 托管）
const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

app.get('/uploads/*', async (c) => {
  const fileRelativePath = c.req.path.replace('/uploads/', '');
  const decodedPath = decodeURIComponent(fileRelativePath);
  
  const data = await storage.get(decodedPath);
  if (!data) {
    return c.text('Image not found', 404);
  }

  const ext = path.extname(decodedPath).toLowerCase();
  const contentType = MIME_MAP[ext] || 'application/octet-stream';

  return new Response(data, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
});

// 5. 启动 Node 服务
const port = parseInt(process.env.PORT || '3001', 10);
console.log(`BBKK Hono server is running on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

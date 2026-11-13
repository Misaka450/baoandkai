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
import photos from './routes/photos.js';
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
import vault from './routes/vault.js';

import { storage } from './lib/storage.js';
import { cleanupExpiredSessions } from './lib/session.js';
import { pool } from './lib/db.js';
import { errorResponse } from './utils/response.js';

dotenv.config();

const app = new Hono();

// 全局异常兜底：拦截畸形 JSON 请求体引起的 SyntaxError 返回 400，避免直接抛出 500
app.onError((err, _c) => {
  if (err instanceof SyntaxError) {
    return errorResponse('请求体 JSON 格式无效', 400);
  }
  console.error('Unhandled server error:', err);
  return errorResponse('服务器内部错误', 500);
});

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
app.route('/api/vault', vault);

// 3. 开发模式下托管本地 /uploads 静态资源（生产中由 Nginx 托管）
const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

app.get('/uploads/*', async (c) => {
  const fileRelativePath = c.req.path.replace('/uploads/', '');
  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(fileRelativePath);
  } catch {
    return c.text('Bad Request', 400);
  }
  
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

// 6. 过期 Session 定时清理
// 此前过期会话会一直堆积在数据库中无人清理；
// 现在启动时清一次，之后每 24 小时自动清理一次
async function cleanExpiredSessions(): Promise<void> {
  try {
    const count = await cleanupExpiredSessions();
    if (count > 0) {
      console.log(`已清理 ${count} 条过期 Session`);
    }
  } catch (err) {
    // 清理失败不影响主服务，仅记录日志
    console.error('清理过期 Session 失败:', err);
  }
}

cleanExpiredSessions();
setInterval(cleanExpiredSessions, 24 * 60 * 60 * 1000).unref(); // unref：不阻止进程正常退出

const server = serve({
  fetch: app.fetch,
  port,
});

// 7. 优雅停机处理（SIGTERM / SIGINT）
let isShuttingDown = false;
async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`收到 ${signal} 信号，开始优雅停机...`);

  server.close(async () => {
    try {
      await pool.end();
      console.log('HTTP 服务与数据库连接池已安全关闭');
      process.exit(0);
    } catch (err) {
      console.error('关闭数据库连接池出错:', err);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error('优雅停机等待超时，强制退出进程');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => {
  void gracefulShutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void gracefulShutdown('SIGINT');
});

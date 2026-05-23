import { Hono } from 'hono';
import path from 'path';
import { errorResponse } from '../utils/response.js';
import { storage } from '../lib/storage.js';

const images = new Hono();

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

/**
 * GET /api/images/*
 * 图片代理接口，用于获取本地存储的图片并返回（向前兼容）
 */
images.get('/*', async (c) => {
  try {
    const url = new URL(c.req.url);
    const key = url.pathname.split('/api/images/')[1];

    if (!key) {
      return errorResponse('未指定图片 Key', 400);
    }

    const decodedKey = decodeURIComponent(key);
    const data = await storage.get(decodedKey);

    if (!data) {
      return errorResponse(`图片不存在: ${decodedKey}`, 404);
    }

    // 根据后缀判断 Content-Type
    const ext = path.extname(decodedKey).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';

    // 返回图片，设置缓存头（浏览器缓存1年）
    return new Response(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Cache': 'MISS',
      },
    });
  } catch (error: any) {
    console.error('获取代理图片失败:', error);
    return errorResponse(error.message, 500);
  }
});

export default images;

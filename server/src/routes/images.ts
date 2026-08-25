import { Hono } from 'hono';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
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

// 预定义允许的缩略图尺寸白名单，防止恶意参数滥用计算资源
const ALLOWED_WIDTHS = [100, 200, 300, 400, 600, 800, 1200, 1600, 2000];

function getClosestAllowedWidth(requestedWidth: number): number {
  if (requestedWidth <= 0) return 600;
  return ALLOWED_WIDTHS.reduce((prev, curr) =>
    Math.abs(curr - requestedWidth) < Math.abs(prev - requestedWidth) ? curr : prev
  );
}

/**
 * GET /api/images/*
 * 图片动态裁剪与优化接口
 * 查询参数:
 *  - w / width: 宽度 (如 400, 600)
 *  - h / height: 高度
 *  - q / quality: 质量 (1-100, 默认 80)
 *  - format / f: 格式 (webp | jpeg | png | auto, 默认 webp)
 */
images.get('/*', async (c) => {
  try {
    const url = new URL(c.req.url);
    const key = url.pathname.split('/api/images/')[1];

    if (!key) {
      return errorResponse('未指定图片 Key', 400);
    }

    const decodedKey = decodeURIComponent(key);
    const rawData = await storage.get(decodedKey);

    if (!rawData) {
      return errorResponse(`图片不存在: ${decodedKey}`, 404);
    }

    const ext = path.extname(decodedKey).toLowerCase();

    // 如果是 gif 动图或未带缩放参数，直接返回原图
    const widthParam = c.req.query('w') || c.req.query('width');
    const heightParam = c.req.query('h') || c.req.query('height');
    const qualityParam = c.req.query('q') || c.req.query('quality');
    const formatParam = c.req.query('format') || c.req.query('f');

    if (ext === '.gif' && !widthParam && !heightParam) {
      return new Response(rawData, {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // 解析尺寸与压缩参数
    const reqWidth = widthParam ? parseInt(widthParam, 10) : undefined;
    const reqHeight = heightParam ? parseInt(heightParam, 10) : undefined;
    const quality = qualityParam ? Math.min(Math.max(parseInt(qualityParam, 10), 10), 100) : 80;

    // 默认转换为 webp 格式以获得最大压缩率与加载速度
    const targetFormat = (formatParam === 'jpeg' || formatParam === 'jpg')
      ? 'jpeg'
      : (formatParam === 'png' ? 'png' : 'webp');

    // 检查是否有本地缩略图磁盘缓存 (.cache/xxx_w600_q80.webp)
    const uploadDir = storage.getUploadDir();
    const cacheKey = `${decodedKey}_w${reqWidth || 'auto'}_h${reqHeight || 'auto'}_q${quality}.${targetFormat}`
      .replace(/[\/\\]/g, '_');
    const cacheDir = path.join(uploadDir, '.cache');
    const cacheFilePath = path.join(cacheDir, cacheKey);

    try {
      const cachedData = await fs.readFile(cacheFilePath);
      return new Response(cachedData, {
        headers: {
          'Content-Type': targetFormat === 'webp' ? 'image/webp' : (MIME_MAP[`.${targetFormat}`] || 'image/jpeg'),
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Cache': 'HIT',
        },
      });
    } catch {
      // 缓存不存在，继续实时生成并写入缓存
    }

    let pipeline = sharp(rawData).rotate(); // 自动按照 EXIF 旋转方向纠正

    if (reqWidth || reqHeight) {
      const targetWidth = reqWidth ? getClosestAllowedWidth(reqWidth) : undefined;
      pipeline = pipeline.resize({
        width: targetWidth,
        height: reqHeight,
        fit: 'cover',
        withoutEnlargement: true,
      });
    }

    if (targetFormat === 'webp') {
      pipeline = pipeline.webp({ quality, effort: 4 });
    } else if (targetFormat === 'jpeg') {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    } else if (targetFormat === 'png') {
      pipeline = pipeline.png({ quality });
    }

    const processedBuffer = await pipeline.toBuffer();

    // 异步写入磁盘缓存，避免阻塞当前请求返回
    (async () => {
      try {
        await fs.mkdir(cacheDir, { recursive: true });
        await fs.writeFile(cacheFilePath, processedBuffer);
      } catch (err) {
        console.error('Failed to write image cache:', err);
      }
    })();

    const contentType = targetFormat === 'webp' ? 'image/webp' : (MIME_MAP[`.${targetFormat}`] || 'image/jpeg');

    return new Response(processedBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Cache': 'MISS',
      },
    });
  } catch (error: any) {
    console.error('处理图片失败:', error);
    return errorResponse(error.message, 500);
  }
});

export default images;

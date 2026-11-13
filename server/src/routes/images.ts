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

// 预定义允许的缩略图尺寸与压缩质量白名单，防止恶意参数绕过缓存引发磁盘/CPU 放大 DoS
const ALLOWED_WIDTHS = [50, 100, 200, 300, 400, 600, 800, 1200, 1600, 2000];
const ALLOWED_QUALITIES = [30, 60, 75, 80, 85];

function getClosestAllowedWidth(requestedWidth: number): number {
  if (!Number.isFinite(requestedWidth) || requestedWidth <= 0) return 600;
  return ALLOWED_WIDTHS.reduce((prev, curr) =>
    Math.abs(curr - requestedWidth) < Math.abs(prev - requestedWidth) ? curr : prev
  );
}

function getClosestAllowedQuality(requestedQuality: number): number {
  if (!Number.isFinite(requestedQuality) || requestedQuality <= 0) return 80;
  const clamped = Math.min(Math.max(requestedQuality, 10), 100);
  return ALLOWED_QUALITIES.reduce((prev, curr) =>
    Math.abs(curr - clamped) < Math.abs(prev - clamped) ? curr : prev
  );
}

// 限制同时运行的 sharp 实例数量（最多 4 个），防止高并发大图解码撑爆内存与 CPU
const MAX_CONCURRENT_SHARP = 4;
const MAX_SHARP_QUEUE = 64;
let activeSharpTasks = 0;
const sharpWaitQueue: Array<() => void> = [];

function acquireSharpSlot(): Promise<boolean> {
  if (activeSharpTasks < MAX_CONCURRENT_SHARP) {
    activeSharpTasks++;
    return Promise.resolve(true);
  }
  if (sharpWaitQueue.length >= MAX_SHARP_QUEUE) {
    return Promise.resolve(false);
  }
  return new Promise<boolean>((resolve) => {
    sharpWaitQueue.push(() => {
      activeSharpTasks++;
      resolve(true);
    });
  });
}

function releaseSharpSlot(): void {
  activeSharpTasks = Math.max(0, activeSharpTasks - 1);
  const next = sharpWaitQueue.shift();
  if (next) {
    next();
  }
}

/**
 * GET /api/images/*
 * 图片动态裁剪与优化接口
 * 查询参数:
 *  - w / width: 宽度 (如 400, 600)
 *  - h / height: 高度
 *  - q / quality: 质量 (离散档位 30/60/75/80/85, 默认 80)
 *  - format / f: 格式 (webp | jpeg | png | auto, 默认 webp)
 */
images.get('/*', async (c) => {
  try {
    const url = new URL(c.req.url);
    const key = url.pathname.split('/api/images/')[1];

    if (!key) {
      return errorResponse('未指定图片 Key', 400);
    }

    let decodedKey: string;
    try {
      decodedKey = decodeURIComponent(key);
    } catch {
      return errorResponse('非法的图片路径编码', 400);
    }

    if (decodedKey.includes('..') || decodedKey.startsWith('.')) {
      return errorResponse('非法的图片路径', 400);
    }

    const ext = path.extname(decodedKey).toLowerCase();

    // 解析尺寸与压缩参数
    const widthParam = c.req.query('w') || c.req.query('width');
    const heightParam = c.req.query('h') || c.req.query('height');
    const qualityParam = c.req.query('q') || c.req.query('quality');
    const formatParam = c.req.query('format') || c.req.query('f');

    const reqWidth = widthParam ? parseInt(widthParam, 10) : undefined;
    const reqHeight = heightParam ? parseInt(heightParam, 10) : undefined;
    const reqQuality = qualityParam ? parseInt(qualityParam, 10) : undefined;

    // 严格校验 Number.isFinite，并在拼接 cacheKey 前收敛 width 与 quality 到离散档位
    const validWidth = reqWidth !== undefined && Number.isFinite(reqWidth) ? reqWidth : undefined;
    const validHeight = reqHeight !== undefined && Number.isFinite(reqHeight) ? reqHeight : undefined;
    const targetWidth = validWidth !== undefined ? getClosestAllowedWidth(validWidth) : undefined;
    const safeHeight = validHeight !== undefined ? Math.min(Math.max(validHeight, 10), 4000) : undefined;
    const quality = reqQuality !== undefined && Number.isFinite(reqQuality)
      ? getClosestAllowedQuality(reqQuality)
      : 80;

    // 默认转换为 webp 格式以获得最大压缩率与加载速度
    const targetFormat = (formatParam === 'jpeg' || formatParam === 'jpg')
      ? 'jpeg'
      : (formatParam === 'png' ? 'png' : 'webp');

    // 1. 优先检查本地缩略图磁盘缓存 (.cache/xxx_w600_hauto_q80.webp)
    // 关键性能优化：使用收敛后的 targetWidth/safeHeight/quality 生成 cacheKey，防止遍历参数绕过缓存
    const uploadDir = storage.getUploadDir();
    const cacheKey = `${decodedKey}_w${targetWidth || 'auto'}_h${safeHeight || 'auto'}_q${quality}.${targetFormat}`
      .replace(/[/\\]/g, '_');
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
      // 缓存未命中，继续读取原图生成
    }

    // 2. 缓存未命中，读取原始图片数据
    const rawData = await storage.get(decodedKey);
    if (!rawData) {
      return errorResponse(`图片不存在: ${decodedKey}`, 404);
    }

    // 如果是 gif 动图且未指定有效尺寸参数，直接返回原图
    if (ext === '.gif' && !targetWidth && !safeHeight) {
      return new Response(rawData, {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    const acquired = await acquireSharpSlot();
    if (!acquired) {
      return errorResponse('图片处理服务繁忙，请稍后重试', 503);
    }

    let processedBuffer: Buffer;
    try {
      let pipeline = sharp(rawData).rotate(); // 自动按照 EXIF 旋转方向纠正

      if (targetWidth || safeHeight) {
        pipeline = pipeline.resize({
          width: targetWidth,
          height: safeHeight,
          fit: 'cover',
          withoutEnlargement: true,
        });
      }

      if (targetFormat === 'webp') {
        pipeline = pipeline.webp({ quality, effort: 4 });
      } else if (targetFormat === 'jpeg') {
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      } else if (targetFormat === 'png') {
        pipeline = pipeline.png();
      }

      processedBuffer = await pipeline.toBuffer();
    } finally {
      releaseSharpSlot();
    }

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error('处理图片失败:', message);
    return errorResponse(message, 500);
  }
});

export default images;

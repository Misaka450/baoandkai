import { Hono } from 'hono';
import { jsonResponse, errorResponse } from '../utils/response.js';
import { storage } from '../lib/storage.js';
import { validateImageMagic } from '../utils/validation.js';
import { parsePhotoExif, ExifResult } from '../utils/exif.js';
import { extractStorageKey } from '../utils/url.js';

const upload = new Hono();

// 允许的上传文件夹白名单，防止路径遍历攻击
const ALLOWED_FOLDERS = ['images', 'albums', 'avatars', 'food', 'map', 'timeline', 'todos'];

/**
 * POST /api/upload
 * 上传文件（需要认证，由全局 authMiddleware 保护）
 */
upload.post('/', async (c) => {
  try {
    const formData = await c.req.parseBody();
    const folder = (formData.folder as string) || 'images';

    // 验证文件夹参数是否在白名单中，防止路径遍历
    if (!ALLOWED_FOLDERS.includes(folder)) {
      return errorResponse(`不允许的上传目录: ${folder}`, 400);
    }

    // 适配多文件上传或单文件上传
    let files: File[] = [];
    if (Array.isArray(formData.file)) {
      files = formData.file as File[];
    } else if (formData.file instanceof File) {
      files = [formData.file as File];
    }

    if (files.length === 0) {
      return errorResponse('没有上传文件', 400);
    }

    const MAX_FILES_PER_REQUEST = 20;
    if (files.length > MAX_FILES_PER_REQUEST) {
      return errorResponse(`单次最多只能上传 ${MAX_FILES_PER_REQUEST} 个文件`, 400);
    }

    const maxFileSize = 20 * 1024 * 1024; // 20MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const MIME_TO_EXT: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };

    // 第一阶段：先完成所有文件的大小、MIME 类型与 Magic Bytes 校验，任一不通过则整体拒绝，避免产生半截脏文件
    const validatedFiles: Array<{ buffer: Buffer; safeExtension: string }> = [];
    for (const file of files) {
      // 验证 MIME 类型
      if (!allowedTypes.includes(file.type)) {
        return errorResponse(`不支持的文件类型: ${file.type}`, 400);
      }

      // 验证文件大小
      if (file.size > maxFileSize) {
        return errorResponse(`文件太大: ${file.name} (${file.size} bytes)`, 400);
      }

      // 读取文件内容
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 验证文件魔数（Magic Number），防止将恶意文件伪装成图片上传
      if (!validateImageMagic(new Uint8Array(buffer), file.type)) {
        return errorResponse(`文件类型验证失败: ${file.name}，文件内容与声明类型不匹配`, 400);
      }

      const rawExt = file.name.split('.').pop()?.toLowerCase() || '';
      const safeExtension = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(rawExt)
        ? rawExt
        : (MIME_TO_EXT[file.type] || 'jpg');

      validatedFiles.push({ buffer, safeExtension });
    }

    // 第二阶段：全部文件校验通过后，再统一解析 EXIF 并落盘
    const uploadedUrls: string[] = [];
    let lastExifMeta: ExifResult | null = null;

    for (const { buffer, safeExtension } of validatedFiles) {
      // 智能解析 EXIF（拍摄时间与经纬度城市）
      const exif = await parsePhotoExif(buffer);
      if (exif && (exif.date || exif.location)) {
        lastExifMeta = exif;
      } else if (!lastExifMeta && exif) {
        lastExifMeta = exif;
      }

      const filename = `${folder}/${Date.now()}_${crypto.randomUUID().substring(0, 6)}.${safeExtension}`;
      await storage.put(filename, buffer);

      // 返回以 /uploads/ 为前缀的绝对路径
      const url = `/uploads/${filename}`;
      uploadedUrls.push(url);
    }

    return jsonResponse({
      url: uploadedUrls[0], // 单个上传时的 URL（前端期望这个字段）
      urls: uploadedUrls, // 批量上传时的 URL 数组
      count: uploadedUrls.length,
      exif: lastExifMeta || null, // 包含 date, dateTime, latitude, longitude, province, city, location
    });
  } catch (error: any) {
    console.error('上传文件失败:', error);
    return errorResponse(error.message, 500);
  }
});

/**
 * POST /api/upload/delete
 * 删除存储的文件（需要认证，由全局 authMiddleware 保护）
 */
upload.post('/delete', async (c) => {
  try {
    const { key } = (await c.req.json()) as { key: string };

    if (!key) {
      return errorResponse('未指定文件 Key', 400);
    }

    const resolvedPath = extractStorageKey(key);
    if (!resolvedPath || resolvedPath.includes('..')) {
      return errorResponse('非法的文件路径', 400);
    }

    await storage.delete(resolvedPath);

    return jsonResponse({
      success: true,
      message: '图片已从存储中彻底删除',
      deleted: key,
    });
  } catch (error: any) {
    console.error('删除本地文件失败:', error);
    return errorResponse(error.message, 500);
  }
});

export default upload;

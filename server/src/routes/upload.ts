import { Hono } from 'hono';
import { jsonResponse, errorResponse } from '../utils/response.js';
import { storage } from '../lib/storage.js';

const upload = new Hono();

/**
 * POST /api/upload
 * 上传文件
 */
upload.post('/', async (c) => {
  try {
    const formData = await c.req.parseBody();
    const folder = (formData.folder as string) || 'images';

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

    // 验证文件大小及类型
    const maxFileSize = 20 * 1024 * 1024; // 20MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return errorResponse(`不支持的文件类型: ${file.type}`, 400);
      }

      if (file.size > maxFileSize) {
        return errorResponse(`文件太大: ${file.name} (${file.size} bytes)`, 400);
      }
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
      // 写入到 folder/{timestamp}_{random}.extension
      const filename = `${folder}/${Date.now()}_${crypto.randomUUID().substring(0, 6)}.${extension}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await storage.put(filename, buffer);

      // 返回以 /uploads/ 为前缀的绝对路径
      const url = `/uploads/${filename}`;
      uploadedUrls.push(url);
    }

    return jsonResponse({
      url: uploadedUrls[0], // 单个上传时的 URL（前端期望这个字段）
      urls: uploadedUrls, // 批量上传时的 URL 数组
      count: uploadedUrls.length,
    });
  } catch (error: any) {
    console.error('上传文件失败:', error);
    return errorResponse(error.message, 500);
  }
});

/**
 * POST /api/upload/delete
 * 删除存储的文件
 */
upload.post('/delete', async (c) => {
  try {
    const { key } = (await c.req.json()) as { key: string };

    if (!key) {
      return errorResponse('未指定文件 Key', 400);
    }

    // 执行本地存储删除
    // key 可能是 '/uploads/xxx' 或 'xxx'，我们将其统一清理
    let targetKey = key;
    if (key.startsWith('/uploads/')) {
      targetKey = key.replace('/uploads/', '');
    } else if (key.includes('/api/images/')) {
      targetKey = key.split('/api/images/')[1] || '';
    }

    await storage.delete(decodeURIComponent(targetKey));

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

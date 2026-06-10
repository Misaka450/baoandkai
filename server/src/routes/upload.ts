import { Hono } from 'hono';
import { jsonResponse, errorResponse } from '../utils/response.js';
import { storage } from '../lib/storage.js';
import { validateImageMagic } from '../utils/validation.js';

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

    // 验证 + 存储合并在一个循环中，避免重复读取文件
    const maxFileSize = 20 * 1024 * 1024; // 20MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const uploadedUrls: string[] = [];

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

      // 存储文件
      const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const filename = `${folder}/${Date.now()}_${crypto.randomUUID().substring(0, 6)}.${extension}`;
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

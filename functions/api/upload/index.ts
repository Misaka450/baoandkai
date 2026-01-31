import { jsonResponse, errorResponse } from '../../utils/response';

export interface Env {
  IMAGES: R2Bucket;
}

// Cloudflare Pages Functions 上传处理
export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const formData = await request.formData();
    const files = formData.getAll('file') as File[];
    const folder = (formData.get('folder') as string) || 'images';

    if (!files || files.length === 0) {
      return errorResponse('没有上传文件', 400);
    }

    // 验证每个文件
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
      const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;

      await env.IMAGES.put(filename, file.stream(), {
        httpMetadata: {
          contentType: file.type,
          cacheControl: 'public, max-age=31536000',
        },
      });

      // 使用本地 API 代理路径，替代 R2 公网地址以增强安全性
      const url = `/api/images/${filename}`;
      uploadedUrls.push(url);
    }

    return jsonResponse({
      urls: uploadedUrls,
      count: uploadedUrls.length
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
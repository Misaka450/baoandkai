import { jsonResponse, errorResponse } from '../../utils/response';

// Cloudflare Pages Functions 上传处理
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const formData = await request.formData();
    const files = formData.getAll('file');
    const folder = formData.get('folder') || 'images';

    if (!files || files.length === 0) {
      return errorResponse('没有上传文件', 400);
    }

    // 验证每个文件
    // 上传接口配置
    const maxFileSize = 20 * 1024 * 1024; // 20MB 支持更大的相机照片
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return errorResponse(`不支持的文件类型: ${file.type}`, 400);
      }

      if (file.size > maxFileSize) {
        return errorResponse(`文件太大: ${file.name} (${file.size} bytes)`, 400);
      }
    }

    const uploadedUrls = [];

    for (const file of files) {
      const extension = file.name.split('.').pop().toLowerCase();
      const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;

      // 修复：使用正确的R2存储桶绑定名称
      await env.IMAGES.put(filename, file.stream(), {
        httpMetadata: {
          contentType: file.type,
          cacheControl: 'public, max-age=31536000',
        },
      });

      const url = `https://pub-f3abc7adae724902b344281ec73f700c.r2.dev/${filename}`;
      uploadedUrls.push(url);
    }

    return jsonResponse({
      urls: uploadedUrls,
      count: uploadedUrls.length
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
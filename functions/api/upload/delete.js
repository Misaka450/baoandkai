import { jsonResponse, errorResponse } from '../../utils/response';

// Cloudflare Pages Functions 删除图片处理
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { url } = await request.json();

    if (!url) {
      return errorResponse('缺少图片URL', 400);
    }

    // 从URL中提取文件名
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    const folder = urlParts[urlParts.length - 2];
    const key = `${folder}/${filename}`;

    // 修复：使用正确的R2存储桶绑定名称
    await env.IMAGES.delete(key);

    return jsonResponse({
      success: true,
      message: '图片已删除',
      deleted: key
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
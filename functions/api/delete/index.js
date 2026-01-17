import { jsonResponse, errorResponse } from '../../utils/response';

// Cloudflare Pages Functions - R2图片删除API
export async function onRequestDelete(context) {
  const { request, env } = context;

  try {
    const { filename } = await request.json();

    if (!filename) {
      return errorResponse('缺少文件名', 400);
    }

    // 从R2存储桶中删除文件
    // 修复：使用正确的R2存储桶绑定名称
    const bucket = env.IMAGES;

    if (!bucket) {
      console.error('R2存储桶未配置，可用绑定:', Object.keys(env));
      return errorResponse('存储服务未配置', 500);
    }

    // 删除文件
    await bucket.delete(filename);

    return jsonResponse({ success: true, message: '文件删除成功' });
  } catch (error) {
    console.error('R2文件删除失败:', error);
    return errorResponse(error.message, 500);
  }
}
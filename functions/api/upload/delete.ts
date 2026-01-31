import { jsonResponse, errorResponse } from '../../utils/response';

export interface Env {
  IMAGES: R2Bucket;
}

// Cloudflare Pages Functions - 删除 R2 文件
export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const { key } = (await request.json()) as { key: string };

    if (!key) {
      return errorResponse('未指定文件 Key', 400);
    }

    // 执行 R2 删除
    await env.IMAGES.delete(key);

    return jsonResponse({
      success: true,
      message: '图片已从存储中彻底删除',
      deleted: key
    });

  } catch (error: any) {
    console.error('删除 R2 文件失败:', error);
    return errorResponse(error.message, 500);
  }
}
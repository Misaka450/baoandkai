import { jsonResponse, errorResponse } from '../../utils/response';

export interface Env {
    DB: D1Database;
    IMAGES?: R2Bucket;
}

// 删除单张照片的 API
export async function onRequestPost(context: { request: Request; env: Env }) {
    const { request, env } = context;

    try {
        const { photoId, url } = (await request.json()) as { photoId: number; url: string };

        if (!photoId) {
            return errorResponse('未指定照片 ID', 400);
        }

        // 1. 从 R2 删除文件 (如果是内部链接)
        if (env.IMAGES && url && url.includes('/api/images/')) {
            const key = url.split('/api/images/')[1];
            if (key) {
                try {
                    await env.IMAGES.delete(decodeURIComponent(key));
                } catch (e) {
                    console.error('R2 删除失败:', e);
                }
            }
        }

        // 2. 从数据库删除
        await env.DB.prepare('DELETE FROM photos WHERE id = ?').bind(photoId).run();

        return jsonResponse({ success: true, message: '照片已彻底删除' });
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}

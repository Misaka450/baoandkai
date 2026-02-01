import { jsonResponse, errorResponse } from '../../../../utils/response';

export interface Env {
    DB: D1Database;
    IMAGES: R2Bucket;
}

/**
 * 删除单张相册照片
 * DELETE /api/albums/[id]/photos/[photoId]
 */
export async function onRequestDelete(context: { env: Env; request: Request }) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const parts = url.pathname.split('/').filter(Boolean);
        // parts = ['api', 'albums', '11', 'photos', '120']
        const albumId = parseInt(parts[2] || '');
        const photoId = parseInt(parts[4] || '');

        if (isNaN(albumId) || isNaN(photoId)) {
            return errorResponse('无效的相册ID或照片ID', 400);
        }

        // 1. 获取照片信息
        const photo = await env.DB.prepare(
            `SELECT * FROM photos WHERE id = ? AND album_id = ?`
        ).bind(photoId, albumId).first<{ id: number; url: string }>();

        if (!photo) {
            return errorResponse('照片不存在', 404);
        }

        // 2. 从 R2 删除文件
        if (env.IMAGES && photo.url) {
            const key = photo.url.replace('/api/images/', '');
            try {
                await env.IMAGES.delete(key);
            } catch (e) {
                console.error('删除 R2 文件失败:', e);
                // 继续删除数据库记录
            }
        }

        // 3. 从数据库删除记录
        await env.DB.prepare(`DELETE FROM photos WHERE id = ?`).bind(photoId).run();

        return jsonResponse({ success: true, message: '照片已删除' });
    } catch (error: any) {
        console.error('删除照片失败:', error);
        return errorResponse(error.message, 500);
    }
}

/**
 * 更新照片信息 (如标题)
 * PUT /api/albums/[id]/photos/[photoId]
 */
export async function onRequestPut(context: { env: Env; request: Request }) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const parts = url.pathname.split('/').filter(Boolean);
        const albumId = parseInt(parts[2] || '');
        const photoId = parseInt(parts[4] || '');

        if (isNaN(albumId) || isNaN(photoId)) {
            return errorResponse('无效的相册ID或照片ID', 400);
        }

        const data = await request.json() as { caption?: string; sort_order?: number };

        // 构建更新语句
        const updates: string[] = [];
        const params: any[] = [];

        if (data.caption !== undefined) {
            updates.push('caption = ?');
            params.push(data.caption);
        }

        if (data.sort_order !== undefined) {
            updates.push('sort_order = ?');
            params.push(data.sort_order);
        }

        if (updates.length === 0) {
            return errorResponse('没有提供要更新的字段', 400);
        }

        params.push(photoId); // condition param
        params.push(albumId); // condition param

        const query = `UPDATE photos SET ${updates.join(', ')} WHERE id = ? AND album_id = ?`;

        const result = await env.DB.prepare(query).bind(...params).run();

        if (result.meta.changes === 0) {
            return errorResponse('照片不存在或未更新', 404);
        }

        return jsonResponse({ success: true, message: '照片更新成功' });

    } catch (error: any) {
        console.error('更新照片失败:', error);
        return errorResponse(error.message, 500);
    }
}

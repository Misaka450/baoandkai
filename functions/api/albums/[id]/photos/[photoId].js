import { jsonResponse, errorResponse } from '../../../../utils/response';

// DELETE /api/albums/:id/photos/:photoId - 删除照片
export async function onRequestDelete(context) {
    const { params, env } = context;
    const { id: albumId, photoId } = params;

    try {
        // 1. 获取照片信息以获取文件名（如果需要从R2删除）
        const photo = await env.DB.prepare(`
      SELECT * FROM photos WHERE id = ? AND album_id = ?
    `).bind(photoId, albumId).first();

        if (!photo) {
            return errorResponse('照片不存在', 404);
        }

        // 2. 从 R2 删除文件 (可选，根据需求是否保留历史文件)
        // 从 URL 提取 key: /api/images/filename.jpg -> filename.jpg
        if (env.IMAGES && photo.url && photo.url.startsWith('/api/images/')) {
            const key = photo.url.split('/api/images/')[1];
            if (key) {
                await env.IMAGES.delete(key);
            }
        }

        // 3. 从数据库删除
        await env.DB.prepare(`
      DELETE FROM photos WHERE id = ?
    `).bind(photoId).run();

        return jsonResponse({ success: true });
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}

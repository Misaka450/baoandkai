import { jsonResponse, errorResponse } from '../../../../utils/response';

/**
 * 删除单张照片
 * 包含数据库记录删除与 R2 物理文件清理
 */
export async function onRequestDelete(context) {
    const { params, env } = context;
    const albumId = parseInt(params.id);
    const photoId = parseInt(params.photoId);

    if (isNaN(albumId) || isNaN(photoId)) {
        return errorResponse('无效的ID参数', 400);
    }

    try {
        // 1. 获取照片详情以确认归属并获取 URL 用于清理 R2
        const photo = await env.DB.prepare(`
            SELECT * FROM photos WHERE id = ? AND album_id = ?
        `).bind(photoId, albumId).first();

        if (!photo) {
            return errorResponse('照片不存在或不属于此相册', 404);
        }

        // 2. 如果存在内部存储的物理文件，启动 R2 清理
        if (env.IMAGES && photo.url && photo.url.startsWith('/api/images/')) {
            const key = photo.url.split('/api/images/')[1];
            if (key) {
                try {
                    // 解码以匹配 R2 (支持中文路径)
                    await env.IMAGES.delete(decodeURIComponent(key));
                } catch (e) {
                    console.error('物理文件删除失败:', key, e);
                    // 即使物理删除失败，也建议继续执行 DB 删除，避免 UI 阻塞
                }
            }
        }

        // 3. 执行数据库删除
        await env.DB.prepare(`DELETE FROM photos WHERE id = ?`).bind(photoId).run();

        return jsonResponse({ success: true, message: '照片已从库和存储中移除' });
    } catch (error) {
        console.error('删除照片过程中出错:', error);
        return errorResponse(error.message, 500);
    }
}

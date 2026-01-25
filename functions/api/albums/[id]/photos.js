import { jsonResponse, errorResponse } from '../../../utils/response';

// GET /api/albums/:id/photos - 获取相册照片列表
export async function onRequestGet(context) {
    const { params, env } = context;
    const albumId = params.id;

    try {
        const photos = await env.DB.prepare(`
      SELECT * FROM photos WHERE album_id = ? ORDER BY sort_order ASC, created_at ASC
    `).bind(albumId).all();

        return jsonResponse({
            data: photos.results
        });
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}

// POST /api/albums/:id/photos - 上传照片到相册
export async function onRequestPost(context) {
    const { params, request, env } = context;
    const albumId = params.id;

    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
            return errorResponse('未找到文件', 400);
        }

        // 1. 上传文件到 R2
        if (!env.IMAGES) {
            return errorResponse('存储服务(R2)未配置', 500);
        }

        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split('.').pop();
        const fileName = `albums/${timestamp}-${random}.${ext}`;

        await env.IMAGES.put(fileName, file.stream(), {
            httpMetadata: {
                contentType: file.type,
                cacheControl: 'public, max-age=31536000',
            },
        });

        const url = `/api/images/${fileName}`;

        // 2. 插入数据库记录
        const result = await env.DB.prepare(`
      INSERT INTO photos (album_id, url, caption, sort_order, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(albumId, url, file.name, 0).run();

        const newPhoto = await env.DB.prepare(`
      SELECT * FROM photos WHERE id = ?
    `).bind(result.meta.last_row_id).first();

        return jsonResponse(newPhoto, 201);

    } catch (error) {
        console.error('上传失败:', error);
        return errorResponse(error.message, 500);
    }
}

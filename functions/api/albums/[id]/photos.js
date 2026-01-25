import { jsonResponse, errorResponse } from '../../../utils/response';

// GET /api/albums/:id/photos - 获取相册照片列表
export async function onRequestGet(context) {
    const { params, env } = context;
    // 这里的 id 可能是 string，而数据库 id 是 INTEGER
    const albumId = parseInt(params.id);

    if (isNaN(albumId)) {
        return errorResponse('无效的相册ID', 400);
    }

    try {
        const photos = await env.DB.prepare(`
      SELECT * FROM photos WHERE album_id = ? ORDER BY sort_order ASC, created_at ASC
    `).bind(albumId).all();

        return jsonResponse({
            data: photos.results || []
        });
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}

const finalAlbumId = parseInt(albumId);
if (isNaN(finalAlbumId)) {
    return errorResponse('无效的相册ID', 400);
}

try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
        return errorResponse('未找到文件', 400);
    }

    // 1. 获取相册信息以确定存储文件夹名
    const album = await env.DB.prepare(`SELECT name FROM albums WHERE id = ?`).bind(finalAlbumId).first();
    if (!album) {
        return errorResponse('相册不存在', 404);
    }
    const folderName = album.name || 'default';

    // 2. 上传文件到 R2
    if (!env.IMAGES) {
        return errorResponse('存储服务(R2)未配置', 500);
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split('.').pop();
    // 按照用户要求修改路径: our/albums/相册名/文件名
    const fileName = `our/albums/${folderName}/${timestamp}-${random}.${ext}`;

    await env.IMAGES.put(fileName, file.stream(), {
        httpMetadata: {
            contentType: file.type,
            cacheControl: 'public, max-age=31536000',
        },
    });

    const url = `/api/images/${fileName}`;

    // 3. 插入数据库记录
    const result = await env.DB.prepare(`
      INSERT INTO photos (album_id, url, caption, sort_order, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(finalAlbumId, url, file.name, 0).run();

    const newPhoto = await env.DB.prepare(`
      SELECT * FROM photos WHERE id = ?
    `).bind(result.meta.last_row_id).first();

    return jsonResponse(newPhoto, 201);

} catch (error) {
    console.error('上传失败:', error);
    return errorResponse(error.message, 500);
}
}

import { jsonResponse, errorResponse } from '../../utils/response';

// Cloudflare Pages Functions - 相册列表API
export async function onRequestGet(context) {
    const { env } = context;

    try {
        // 获取所有相册
        const albums = await env.DB.prepare(`
      SELECT * FROM albums ORDER BY id DESC
    `).all();

        // 为每个相册获取第一张照片作为封面
        const albumsWithPhotos = await Promise.all(albums.results.map(async (album) => {
            const photos = await env.DB.prepare(`
        SELECT * FROM photos WHERE album_id = ? ORDER BY id DESC LIMIT 1
      `).bind(album.id).all();
            return { ...album, photos: photos.results };
        }));

        return jsonResponse({
            data: albumsWithPhotos,
            count: albumsWithPhotos.length
        });
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}

// POST /api/albums - 创建新相册
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const { name, description } = body;

        if (!name) {
            return errorResponse('相册名称不能为空', 400);
        }

        const result = await env.DB.prepare(`
      INSERT INTO albums (name, description) 
      VALUES (?, ?)
    `).bind(name, description || '').run();

        const newAlbum = await env.DB.prepare(`
      SELECT * FROM albums WHERE id = ?
    `).bind(result.meta.last_row_id).first();

        return jsonResponse(newAlbum, 201);
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}

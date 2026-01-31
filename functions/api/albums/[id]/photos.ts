import { jsonResponse, errorResponse } from '../../../utils/response';
import { transformImageUrl } from '../../../utils/url';

export interface Env {
    DB: D1Database;
}

interface Photo {
    id: number;
    album_id: number;
    url: string;
    caption: string;
    sort_order: number;
}

/**
 * 获取特定相册的所有照片
 * GET /api/albums/[id]/photos
 */
export async function onRequestGet(context: { env: Env; request: Request }) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        // 路径格式: /api/albums/1/photos
        const parts = url.pathname.split('/').filter(Boolean);
        // parts = ['api', 'albums', '1', 'photos']
        const idIndex = parts.indexOf('albums') + 1;
        const albumId = parseInt(parts[idIndex] || '');

        if (isNaN(albumId)) {
            return errorResponse('无效的相册ID', 400);
        }

        const photos = await env.DB.prepare(`
            SELECT * FROM photos WHERE album_id = ? ORDER BY sort_order ASC, id ASC
        `).bind(albumId).all<Photo>();

        const formattedPhotos = (photos.results || []).map(p => ({
            ...p,
            url: transformImageUrl(p.url)
        }));

        return jsonResponse({
            data: formattedPhotos,
            count: formattedPhotos.length
        });
    } catch (error: any) {
        console.error('获取相册照片失败:', error);
        return errorResponse(error.message, 500);
    }
}

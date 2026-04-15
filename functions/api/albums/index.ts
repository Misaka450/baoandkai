import { jsonResponse, errorResponse } from '../../utils/response';
import { transformImageUrl } from '../../utils/url';

export interface Env {
    DB: D1Database;
}

interface Album {
    id: number;
    name: string;
    description: string;
    cover_url?: string;
}

interface Photo {
    id: number;
    album_id: number;
    url: string;
    sort_order: number;
}

// 使用子查询一次性获取相册列表+封面+照片数，避免N+1查询
export async function onRequestGet(context: { env: Env }) {
    const { env } = context;

    try {
        // 一次查询获取所有相册及其封面和照片数（使用子查询替代N+1查询）
        const albums = await env.DB.prepare(`
            SELECT 
                a.*,
                (SELECT url FROM photos WHERE album_id = a.id ORDER BY sort_order ASC, id ASC LIMIT 1) AS cover_url,
                (SELECT COUNT(*) FROM photos WHERE album_id = a.id) AS photo_count
            FROM albums a
            ORDER BY a.id DESC
        `).all<Album & { cover_url: string | null; photo_count: number }>();

        const albumsWithPhotos = albums.results.map(album => ({
            ...album,
            cover_url: transformImageUrl(album.cover_url || album.cover_image),
            photos: album.cover_url ? [{
                id: 0,
                album_id: album.id,
                url: transformImageUrl(album.cover_url),
                sort_order: 0
            }] : []
        }));

        return jsonResponse({
            data: albumsWithPhotos,
            count: albums.results.length
        });
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}

// POST /api/albums - 创建新相册
export async function onRequestPost(context: { request: Request; env: Env }) {
    const { request, env } = context;

    try {
        const body: any = await request.json();
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
        `).bind(result.meta.last_row_id).first<Album>();

        return jsonResponse(newAlbum, 201);
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}

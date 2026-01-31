import { jsonResponse, errorResponse } from '../../../utils/response';
import { transformImageUrl } from '../../../utils/url';

export interface Env {
    DB: D1Database;
    IMAGES: R2Bucket;
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

/**
 * 向相册上传并添加照片 (修复 405 Method Not Allowed)
 */
export async function onRequestPost(context: { request: Request; env: Env; data: any }) {
    const { request, env } = context;

    try {
        const url = new URL(request.url);
        const parts = url.pathname.split('/').filter(Boolean);
        const idIndex = parts.indexOf('albums') + 1;
        const albumId = parseInt(parts[idIndex] || '');

        if (isNaN(albumId)) {
            return errorResponse('无效的相册ID', 400);
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return errorResponse('未找到上传文件', 400);
        }

        // 1. 上传到 R2
        if (!env.IMAGES) {
            return errorResponse('R2 存储未配置', 500);
        }

        const album = await env.DB.prepare(`SELECT name FROM albums WHERE id = ?`).bind(albumId).first<{ name: string }>();
        const albumName = album?.name || 'default';
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(7);
        const extension = file.name.split('.').pop() || 'jpg';
        const key = `albums/${albumName}/${timestamp}-${randomStr}.${extension}`;

        await env.IMAGES.put(key, file.stream(), {
            httpMetadata: { contentType: file.type },
        });

        const baseUrl = (env as any).IMAGE_BASE_URL || 'https://img.980823.xyz';
        const proxiedUrl = `${baseUrl}/${key}`;

        // 2. 写入数据库
        const result = await env.DB.prepare(`
            INSERT INTO photos (album_id, url, caption, sort_order, created_at) 
            VALUES (?, ?, ?, (SELECT IFNULL(MAX(sort_order), 0) + 1 FROM photos WHERE album_id = ?), datetime('now'))
        `).bind(albumId, proxiedUrl, file.name, albumId).run();

        const newPhoto = await env.DB.prepare(`SELECT * FROM photos WHERE id = ?`).bind(result.meta.last_row_id).first<Photo>();

        return jsonResponse(newPhoto, 201);
    } catch (error: any) {
        console.error('上传照片失败:', error);
        return errorResponse(error.message, 500);
    }
}

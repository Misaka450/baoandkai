import { jsonResponse, errorResponse } from '../../utils/response';
import { transformImageUrl } from '../../utils/url';

export interface Env {
    DB: D1Database;
    IMAGES?: R2Bucket;
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
    caption?: string;
    sort_order?: number;
}

/**
 * 获取单个相册详情及其包含的所有照片
 */
export async function onRequestGet(context: { env: Env; request: Request }) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').filter(Boolean).pop();
        const albumId = parseInt(id || '');

        if (isNaN(albumId)) {
            return errorResponse('无效的ID', 400);
        }

        const album = await env.DB.prepare(`SELECT * FROM albums WHERE id = ?`).bind(albumId).first<Album>();

        if (!album) {
            return errorResponse('相册不存在', 404);
        }

        const photos = await env.DB.prepare(`
      SELECT * FROM photos WHERE album_id = ? ORDER BY sort_order ASC
    `).bind(albumId).all<Photo>();

        return jsonResponse({
            ...album,
            cover_url: transformImageUrl(album.cover_url),
            photos: (photos.results || []).map(p => ({
                ...p,
                url: transformImageUrl(p.url)
            }))
        });
    } catch (error: any) {
        console.error('获取相册详情失败:', error);
        return errorResponse(error.message, 500);
    }
}

/**
 * 更新相册基本信息及照片列表
 */
export async function onRequestPut(context: { request: Request; env: Env }) {
    const { request, env } = context;

    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').filter(Boolean).pop();
        const albumId = parseInt(id || '');

        if (isNaN(albumId)) {
            return errorResponse('无效的ID', 400);
        }

        const body: any = await request.json();
        const { name, description, photos, cover_url } = body;

        // 1. 获取当前数据
        const currentAlbum = await env.DB.prepare(`SELECT * FROM albums WHERE id = ?`).bind(albumId).first<Album>();
        if (!currentAlbum) {
            return errorResponse('相册不存在', 404);
        }

        const finalName = name !== undefined ? name.trim() : currentAlbum.name;
        const finalDescription = description !== undefined ? description.trim() : currentAlbum.description;
        const finalCoverUrl = cover_url !== undefined ? cover_url : currentAlbum.cover_url;

        if (!finalName) {
            return errorResponse('相册名称不能为空', 400);
        }

        const statements: D1PreparedStatement[] = [];

        // 添加更新相册基本信息的 SQL
        statements.push(
            env.DB.prepare(`
        UPDATE albums SET name = ?, description = ?, cover_url = ?, updated_at = datetime('now') 
        WHERE id = ?
      `).bind(finalName, finalDescription, finalCoverUrl, albumId)
        );

        // 2. 如果传入了照片列表
        if (photos && Array.isArray(photos)) {
            statements.push(env.DB.prepare('DELETE FROM photos WHERE album_id = ?').bind(albumId));

            if (photos.length > 0) {
                photos.forEach((photo, index) => {
                    statements.push(
                        env.DB.prepare(`
              INSERT INTO photos (album_id, url, caption, sort_order, created_at) 
              VALUES (?, ?, ?, ?, datetime('now'))
            `).bind(
                            albumId,
                            photo.url || photo,
                            photo.caption || '',
                            photo.sort_order !== undefined ? photo.sort_order : index
                        )
                    );
                });
            }
        }

        await env.DB.batch(statements);

        const updatedAlbum = await env.DB.prepare(`SELECT * FROM albums WHERE id = ?`).bind(albumId).first<Album>();
        const albumPhotos = await env.DB.prepare(`SELECT * FROM photos WHERE album_id = ? ORDER BY sort_order ASC`).bind(albumId).all<Photo>();

        return jsonResponse({
            ...updatedAlbum,
            photos: albumPhotos.results || []
        });
    } catch (error: any) {
        console.error('更新相册失败:', error);
        return errorResponse(error.message, 500);
    }
}

/**
 * 删除相册及其关联的所有照片
 */
export async function onRequestDelete(context: { env: Env; request: Request }) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').filter(Boolean).pop();
        const albumId = parseInt(id || '');

        if (isNaN(albumId)) {
            return errorResponse('无效的ID', 400);
        }

        const photos = await env.DB.prepare(`SELECT url FROM photos WHERE album_id = ?`).bind(albumId).all<Photo>();

        if (env.IMAGES && photos.results?.length > 0) {
            const fileCleanupPromises = photos.results
                .map(p => {
                    if (p.url && p.url.startsWith('/api/images/')) {
                        const key = p.url.split('/api/images/')[1];
                        try {
                            return env.IMAGES!.delete(decodeURIComponent(key || ''));
                        } catch (e) {
                            console.error('解析照片 Key 失败:', key, e);
                        }
                    }
                    return null;
                })
                .filter((p): p is Promise<void> => p !== null);

            Promise.all(fileCleanupPromises).catch(e => console.error('R2 文件物理删除过程中出错:', e));
        }

        await env.DB.batch([
            env.DB.prepare('DELETE FROM photos WHERE album_id = ?').bind(albumId),
            env.DB.prepare('DELETE FROM albums WHERE id = ?').bind(albumId)
        ]);

        return jsonResponse({ success: true, message: '相册及照片资源已彻底删除' });
    } catch (error: any) {
        console.error('删除相册失败:', error);
        return errorResponse(error.message, 500);
    }
}

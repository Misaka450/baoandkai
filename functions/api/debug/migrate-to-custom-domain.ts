import { jsonResponse, errorResponse } from '../../utils/response';

export interface Env {
    DB: D1Database;
    IMAGE_BASE_URL?: string;
}

/**
 * 迁移数据库中的图片 URL 到自定义域名
 * GET /api/debug/migrate-to-custom-domain?key=YOUR_SECRET_KEY
 */
export async function onRequestGet(context: { env: Env; request: Request }) {
    const { env, request } = context;
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    // 简单的安全检查
    if (key !== 'antigravity_migrate_2026') {
        return errorResponse('Unauthorized', 401);
    }

    const imageBaseUrl = env.IMAGE_BASE_URL || 'https://img.980823.xyz';
    const oldPrefix = '/api/images/';
    const results: any = {
        photos: 0,
        timeline: 0,
        notes: 0,
        food: 0
    } as any;

    try {
        // 1. 迁移 photos 表
        const photos = await env.DB.prepare(`SELECT id, url FROM photos WHERE url LIKE ?`).bind(`${oldPrefix}%`).all();
        for (const row of photos.results as any[]) {
            const newUrl = row.url.replace(oldPrefix, `${imageBaseUrl}/`);
            await env.DB.prepare(`UPDATE photos SET url = ? WHERE id = ?`).bind(newUrl, row.id).run();
            results.photos++;
        }

        // 2. 迁移 timeline_events 表 (images 是逗号分隔的字符串)
        const events = await env.DB.prepare(`SELECT id, images FROM timeline_events WHERE images LIKE ?`).bind(`%${oldPrefix}%`).all();
        for (const row of events.results as any[]) {
            if (row.images) {
                const newImages = row.images.split(',').map((img: string) => img.replace(oldPrefix, `${imageBaseUrl}/`)).join(',');
                await env.DB.prepare(`UPDATE timeline_events SET images = ? WHERE id = ?`).bind(newImages, row.id).run();
                results.timeline++;
            }
        }

        // 3. 迁移 food_checkins 表 (images 是逗号分隔的字符串)
        const foods = await env.DB.prepare(`SELECT id, images FROM food_checkins WHERE images LIKE ?`).bind(`%${oldPrefix}%`).all();
        for (const row of foods.results as any[]) {
            if (row.images) {
                const newImages = row.images.split(',').map((img: string) => img.replace(oldPrefix, `${imageBaseUrl}/`)).join(',');
                await env.DB.prepare(`UPDATE food_checkins SET images = ? WHERE id = ?`).bind(newImages, row.id).run();
                results.food++;
            }
        }

        // 4. 迁移 albums 表 (cover_url)
        const albums = await env.DB.prepare(`SELECT id, cover_url FROM albums WHERE cover_url LIKE ?`).bind(`%${oldPrefix}%`).all();
        for (const row of albums.results as any[]) {
            if (row.cover_url) {
                const newUrl = row.cover_url.replace(oldPrefix, `${imageBaseUrl}/`);
                await env.DB.prepare(`UPDATE albums SET cover_url = ? WHERE id = ?`).bind(newUrl, row.id).run();
                results.albums = (results.albums || 0) + 1;
            }
        }

        return jsonResponse({
            success: true,
            message: '迁移完成',
            imageBaseUrl,
            results
        });
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}

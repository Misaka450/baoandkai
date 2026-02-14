import { jsonResponse, errorResponse } from '../../utils/response';

export interface Env {
    DB: D1Database;
}

interface MapCheckin {
    id: number;
    title: string;
    description: string;
    province: string;
    city: string;
    date: string;
    images: string;
    created_at: string;
    updated_at: string;
}

// PUT /api/map/:id — 更新打卡记录
export async function onRequestPut(context: { request: Request; env: Env }) {
    const { request, env } = context;

    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').filter(Boolean).pop();
        const checkinId = parseInt(id || '');

        if (isNaN(checkinId)) {
            return errorResponse('无效的ID', 400);
        }

        const body: any = await request.json();
        const { title, description, province, city, date, images } = body;

        const current = await env.DB.prepare('SELECT * FROM map_checkins WHERE id = ?')
            .bind(checkinId).first<MapCheckin>();

        if (!current) {
            return errorResponse('记录不存在', 404);
        }

        await env.DB.prepare(`
      UPDATE map_checkins SET
        title = ?,
        description = ?,
        province = ?,
        city = ?,
        date = ?,
        images = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
            title !== undefined ? title : current.title,
            description !== undefined ? description : current.description,
            province !== undefined ? province : current.province,
            city !== undefined ? city : current.city,
            date !== undefined ? date : current.date,
            images !== undefined ? (Array.isArray(images) ? images.join(',') : images) : current.images,
            checkinId
        ).run();

        const updated = await env.DB.prepare('SELECT * FROM map_checkins WHERE id = ?')
            .bind(checkinId).first<MapCheckin>();

        return jsonResponse({
            ...updated,
            images: updated?.images ? updated.images.split(',').filter(Boolean) : []
        });
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}

// DELETE /api/map/:id — 删除打卡记录
export async function onRequestDelete(context: { env: Env; request: Request }) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').filter(Boolean).pop();
        const checkinId = parseInt(id || '');

        if (isNaN(checkinId)) {
            return errorResponse('无效的ID', 400);
        }

        const result = await env.DB.prepare('DELETE FROM map_checkins WHERE id = ?')
            .bind(checkinId).run();

        if (result.meta.changes === 0) {
            return errorResponse('记录不存在', 404);
        }

        return jsonResponse({ success: true, message: '记录已删除' });
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}

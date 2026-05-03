import { jsonResponse } from '../../utils/response';
import { transformImageArray, serializeImages } from '../../utils/url';
import { extractIdFromUrl, findOrThrow, validateAndSanitize, handleCrudError } from '../../utils/crud';

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
        const checkinId = extractIdFromUrl(url);

        const current = await findOrThrow<MapCheckin>(env.DB, 'map_checkins', checkinId);

        const body = await request.json() as Record<string, unknown>;
        const { title, description, province, city, date, images } = body;

        // 仅验证用户实际传入的字段
        const fieldsToValidate: Array<{ name: string; label: string; maxLength?: number }> = [];
        if (title !== undefined) fieldsToValidate.push({ name: 'title', label: '标题', maxLength: 100 });
        if (date !== undefined) fieldsToValidate.push({ name: 'date', label: '日期' });

        const sanitized = validateAndSanitize(
            { title, description, province, city },
            fieldsToValidate,
            ['images']
        );

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
            title !== undefined ? sanitized.title : current.title,
            description !== undefined ? sanitized.description : current.description,
            province !== undefined ? sanitized.province : current.province,
            city !== undefined ? sanitized.city : current.city,
            date !== undefined ? date : current.date,
            images !== undefined ? serializeImages(images) : current.images,
            checkinId
        ).run();

        const updated = await env.DB.prepare('SELECT * FROM map_checkins WHERE id = ?')
            .bind(checkinId).first<MapCheckin>();

        return jsonResponse({
            ...updated,
            images: transformImageArray(updated?.images)
        });
    } catch (error: unknown) {
        return handleCrudError(error);
    }
}

// DELETE /api/map/:id — 删除打卡记录
export async function onRequestDelete(context: { env: Env; request: Request }) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const checkinId = extractIdFromUrl(url);

        const result = await env.DB.prepare('DELETE FROM map_checkins WHERE id = ?')
            .bind(checkinId).run();

        if (result.meta.changes === 0) {
            return jsonResponse({ success: false, message: '记录不存在' }, 404);
        }

        return jsonResponse({ success: true, message: '记录已删除' });
    } catch (error: unknown) {
        return handleCrudError(error);
    }
}

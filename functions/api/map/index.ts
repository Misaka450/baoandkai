import { jsonResponse, errorResponse } from '../../utils/response';
import { transformImageArray } from '../../utils/url';

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

// GET /api/map — 获取所有打卡记录
export async function onRequestGet(context: { env: Env; request: Request }) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const province = url.searchParams.get('province') || '';

        let query = 'SELECT * FROM map_checkins';
        const params: string[] = [];

        if (province) {
            query += ' WHERE province = ?';
            params.push(province);
        }

        query += ' ORDER BY date DESC, created_at DESC';

        const stmt = params.length > 0
            ? env.DB.prepare(query).bind(...params)
            : env.DB.prepare(query);

        const result = await stmt.all<MapCheckin>();

        const checkinsWithImages = result.results.map(checkin => ({
            ...checkin,
            images: transformImageArray(checkin.images)
        }));

        return jsonResponse({ data: checkinsWithImages });
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}

// POST /api/map — 新建打卡记录
export async function onRequestPost(context: { request: Request; env: Env }) {
    const { request, env } = context;

    try {
        const body: any = await request.json();
        const { title, description, province, city, date, images = [] } = body;

        if (!title) {
            return errorResponse('标题不能为空', 400);
        }
        if (!province) {
            return errorResponse('省份不能为空', 400);
        }
        if (!date) {
            return errorResponse('日期不能为空', 400);
        }

        const result = await env.DB.prepare(`
      INSERT INTO map_checkins (title, description, province, city, date, images, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
            title,
            description || '',
            province,
            city || '',
            date,
            Array.isArray(images) ? images.join(',') : images
        ).run();

        const newId = result.meta.last_row_id;
        const newCheckin = await env.DB.prepare('SELECT * FROM map_checkins WHERE id = ?')
            .bind(newId).first<MapCheckin>();

        if (!newCheckin) {
            return errorResponse('创建失败', 500);
        }

        return jsonResponse({
            ...newCheckin,
            images: newCheckin.images ? newCheckin.images.split(',').filter(Boolean) : []
        });
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}

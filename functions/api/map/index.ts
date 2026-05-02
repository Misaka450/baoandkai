import { jsonResponse, errorResponse } from '../../utils/response';
import { transformImageArray, serializeImages } from '../../utils/url';
import { validate, validateRequired, validateLength, validateDate, hasXSS, sanitizeObject } from '../../utils/validation';
import { parsePagination, buildPaginatedResponse } from '../../utils/pagination';

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

// GET /api/map — 获取打卡记录（支持分页和省份筛选）
export async function onRequestGet(context: { env: Env; request: Request }) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const province = url.searchParams.get('province') || '';
        const pagination = parsePagination(url);

        let countQuery = 'SELECT COUNT(*) as total FROM map_checkins';
        let dataQuery = 'SELECT * FROM map_checkins';
        const params: string[] = [];

        if (province) {
            const whereClause = ' WHERE province = ?';
            countQuery += whereClause;
            dataQuery += whereClause;
            params.push(province);
        }

        dataQuery += ' ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?';

        const countResult = await env.DB.prepare(countQuery).bind(...params).first<{ total: number }>();
        const total = countResult?.total || 0;

        const result = await env.DB.prepare(dataQuery).bind(...params, pagination.pageSize, pagination.offset).all<MapCheckin>();

        const checkinsWithImages = result.results.map(checkin => ({
            ...checkin,
            images: transformImageArray(checkin.images)
        }));

        return jsonResponse(buildPaginatedResponse(checkinsWithImages, total, pagination));
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

        // 输入验证
        const validationError = validate([
            validateRequired(title, '标题'),
            validateLength(title, '标题', 1, 100),
            validateRequired(province, '省份'),
            validateRequired(date, '日期'),
            validateDate(date, '日期'),
        ])
        if (validationError) return errorResponse(validationError, 400)

        // XSS检测
        if (hasXSS(title) || (description && hasXSS(description))) {
            return errorResponse('输入内容包含不安全字符', 400)
        }

        // 消毒输入数据
        const sanitized = sanitizeObject({ title, description, province, city }, ['images'])

        // 统一使用 JSON 数组格式存储图片，保持数据一致性
        const imagesJson = serializeImages(images)

        const result = await env.DB.prepare(`
      INSERT INTO map_checkins (title, description, province, city, date, images, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
            sanitized.title,
            sanitized.description || '',
            sanitized.province,
            sanitized.city || '',
            date,
            imagesJson
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

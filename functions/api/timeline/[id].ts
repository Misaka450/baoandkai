import { jsonResponse, errorResponse } from '../../utils/response';
import { transformImageArray, serializeImages } from '../../utils/url';
import { validate, validateRequired, validateLength, validateDate, hasXSS, sanitizeObject } from '../../utils/validation';

export interface Env {
    DB: D1Database;
}

interface TimelineEvent {
    id: number;
    title: string;
    description?: string;
    date: string;
    location?: string;
    category?: string;
    images?: string;
}

/**
 * 获取单个时间轴事件
 */
export async function onRequestGet(context: { env: Env; request: Request }) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').filter(Boolean).pop();
        const eventId = parseInt(id || '');

        if (isNaN(eventId)) {
            return errorResponse('无效的ID', 400);
        }

        const event = await env.DB.prepare(`SELECT * FROM timeline_events WHERE id = ?`).bind(eventId).first<TimelineEvent>();

        if (!event) {
            return errorResponse('事件不存在', 404);
        }

        return jsonResponse({
            ...event,
            images: transformImageArray(event.images)
        });
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}

/**
 * 更新时间轴事件
 */
export async function onRequestPut(context: { request: Request; env: Env }) {
    const { request, env } = context;

    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').filter(Boolean).pop();
        const eventId = parseInt(id || '');

        if (isNaN(eventId)) {
            return errorResponse('无效的ID', 400);
        }

        const body: any = await request.json();
        const { title, description, date, location, category, images } = body;

        const currentEvent = await env.DB.prepare(`SELECT * FROM timeline_events WHERE id = ?`).bind(eventId).first<TimelineEvent>();
        if (!currentEvent) {
            return errorResponse('事件不存在', 404);
        }

        // 输入验证（仅验证用户实际传入的字段）
        const rules: (string | null)[] = []
        if (title !== undefined) {
            rules.push(validateRequired(title, '标题'))
            rules.push(validateLength(title, '标题', 1, 100))
        }
        if (date !== undefined) {
            rules.push(validateRequired(date, '日期'))
            rules.push(validateDate(date, '日期'))
        }
        const validationError = validate(rules)
        if (validationError) return errorResponse(validationError, 400)

        if ((title && hasXSS(title)) || (description && hasXSS(description))) {
            return errorResponse('输入内容包含不安全字符', 400)
        }

        const sanitized = sanitizeObject({ title, description, location, category }, ['images'])

        await env.DB.prepare(`
      UPDATE timeline_events SET 
        title = ?, 
        description = ?, 
        date = ?, 
        location = ?, 
        category = ?, 
        images = ?, 
        updated_at = datetime('now') 
      WHERE id = ?
    `).bind(
            title !== undefined ? sanitized.title : currentEvent.title,
            description !== undefined ? sanitized.description : currentEvent.description,
            date !== undefined ? date : currentEvent.date,
            location !== undefined ? sanitized.location : currentEvent.location,
            category !== undefined ? sanitized.category : currentEvent.category,
            images !== undefined ? serializeImages(images) : currentEvent.images,
            eventId
        ).run();

        const updatedEvent = await env.DB.prepare(`SELECT * FROM timeline_events WHERE id = ?`).bind(eventId).first<TimelineEvent>();

        return jsonResponse({
            ...updatedEvent,
            images: transformImageArray(updatedEvent?.images)
        });
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}

/**
 * 删除时间轴事件
 */
export async function onRequestDelete(context: { env: Env; request: Request }) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').filter(Boolean).pop();
        const eventId = parseInt(id || '');

        if (isNaN(eventId)) {
            return errorResponse('无效的ID', 400);
        }

        await env.DB.prepare('DELETE FROM timeline_events WHERE id = ?').bind(eventId).run();

        return jsonResponse({ success: true, message: '事件已删除' });
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}

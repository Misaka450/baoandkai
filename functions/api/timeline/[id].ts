import { jsonResponse, errorResponse } from '../../utils/response';

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
            images: event.images ? event.images.split(',') : []
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
            title !== undefined ? title : currentEvent.title,
            description !== undefined ? description : currentEvent.description,
            date !== undefined ? date : currentEvent.date,
            location !== undefined ? location : currentEvent.location,
            category !== undefined ? category : currentEvent.category,
            images !== undefined ? (Array.isArray(images) ? images.join(',') : images) : currentEvent.images,
            eventId
        ).run();

        const updatedEvent = await env.DB.prepare(`SELECT * FROM timeline_events WHERE id = ?`).bind(eventId).first<TimelineEvent>();

        return jsonResponse({
            ...updatedEvent,
            images: updatedEvent?.images ? updatedEvent.images.split(',') : []
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

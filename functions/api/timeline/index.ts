import { jsonResponse, errorResponse } from '../../utils/response';
import { transformImageArray } from '../../utils/url';

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
  created_at: string;
}

// Cloudflare Pages Functions - 时间轴API
export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;

  try {
    // 获取分页参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    // 获取总数
    const countResult = await env.DB.prepare(`
      SELECT COUNT(*) as total FROM timeline_events
    `).first<{ total: number }>();
    const total = countResult?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // 获取分页数据
    const events = await env.DB.prepare(`
      SELECT * FROM timeline_events 
      ORDER BY date DESC, created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all<TimelineEvent>();

    const eventsWithImages = events.results.map(event => ({
      ...event,
      images: transformImageArray(event.images)
    }));

    return jsonResponse({
      data: eventsWithImages,
      totalPages,
      totalCount: total,
      currentPage: page
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const body: any = await request.json();
    const { title, description, date, location, category, images = [] } = body;

    if (!title) {
      return errorResponse('标题不能为空', 400);
    }
    if (!date) {
      return errorResponse('日期不能为空', 400);
    }

    const result = await env.DB.prepare(`
        INSERT INTO timeline_events (title, description, date, location, category, images, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
      title,
      description || '',
      date,
      location || '',
      category || '日常',
      Array.isArray(images) ? images.join(',') : images
    ).run();

    const eventId = result.meta.last_row_id;
    const newEvent = await env.DB.prepare(`
        SELECT * FROM timeline_events WHERE id = ?
      `).bind(eventId).first<TimelineEvent>();

    if (!newEvent) {
      return errorResponse('创建失败', 500);
    }

    return jsonResponse({
      ...newEvent,
      images: newEvent.images ? newEvent.images.split(',') : []
    });
  } catch (error: any) {
    console.error('时间轴创建失败:', error);
    return errorResponse('数据库错误: ' + error.message, 500);
  }
}
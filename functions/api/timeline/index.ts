import { jsonResponse, errorResponse } from '../../utils/response';
import { transformImageArray, serializeImages } from '../../utils/url';
import { validate, validateRequired, validateLength, validateDate, hasXSS, sanitizeObject } from '../../utils/validation';
import { buildPaginatedResponse, parsePagination } from '../../utils/pagination';

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

interface CreateTimelineBody {
  title: string;
  description?: string;
  date: string;
  location?: string;
  category?: string;
  images?: string[];
}

// Cloudflare Pages Functions - 时间轴API
export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;

  try {
    const url = new URL(request.url);
    const pagination = parsePagination(url, 10);
    const category = (url.searchParams.get('category') || '').trim();

    const whereClause = category ? ' WHERE category = ?' : '';
    const countStmt = category
      ? env.DB.prepare(`SELECT COUNT(*) as total FROM timeline_events${whereClause}`).bind(category)
      : env.DB.prepare(`SELECT COUNT(*) as total FROM timeline_events`);

    const countResult = await countStmt.first<{ total: number }>();
    const total = countResult?.total || 0;

    const eventsStmt = category
      ? env.DB.prepare(`
          SELECT * FROM timeline_events
          WHERE category = ?
          ORDER BY date DESC, created_at DESC
          LIMIT ? OFFSET ?
        `).bind(category, pagination.pageSize, pagination.offset)
        : env.DB.prepare(`
            SELECT * FROM timeline_events
            ORDER BY date DESC, created_at DESC
            LIMIT ? OFFSET ?
          `).bind(pagination.pageSize, pagination.offset);
    const events = await eventsStmt.all<TimelineEvent>();

    const eventsWithImages = events.results.map(event => ({
      ...event,
      images: transformImageArray(event.images)
    }));

    return jsonResponse(buildPaginatedResponse(eventsWithImages, total, pagination));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    return errorResponse(message, 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const body = await request.json() as CreateTimelineBody;
    const { title, description, date, location, category, images = [] } = body;

    const validationError = validate([
      validateRequired(title, '标题'),
      validateLength(title, '标题', 1, 100),
      validateRequired(date, '日期'),
      validateDate(date, '日期'),
    ])
    if (validationError) return errorResponse(validationError, 400)

    if (hasXSS(title) || (description && hasXSS(description))) {
      return errorResponse('输入内容包含不安全字符', 400)
    }

    const sanitized = sanitizeObject({ title, description, location, category }, ['images'])

    const result = await env.DB.prepare(`
        INSERT INTO timeline_events (title, description, date, location, category, images, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
      sanitized.title,
      sanitized.description || '',
      date,
      sanitized.location || '',
      sanitized.category || '日常',
      serializeImages(images)
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
      images: transformImageArray(newEvent.images)
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error('时间轴创建失败:', message);
    return errorResponse('数据库错误', 500);
  }
}

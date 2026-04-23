import { jsonResponse, errorResponse } from '../../utils/response';
import { transformImageArray } from '../../utils/url';
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
    const category = (url.searchParams.get('category') || '').trim();

    const whereClause = category ? ' WHERE category = ?' : '';
    const countStmt = category
      ? env.DB.prepare(`SELECT COUNT(*) as total FROM timeline_events${whereClause}`).bind(category)
      : env.DB.prepare(`SELECT COUNT(*) as total FROM timeline_events`);

    // 获取总数
    const countResult = await countStmt.first<{ total: number }>();
    const total = countResult?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // 获取分页数据
    const eventsStmt = category
      ? env.DB.prepare(`
          SELECT * FROM timeline_events
          WHERE category = ?
          ORDER BY date DESC, created_at DESC
          LIMIT ? OFFSET ?
        `).bind(category, limit, offset)
      : env.DB.prepare(`
          SELECT * FROM timeline_events
          ORDER BY date DESC, created_at DESC
          LIMIT ? OFFSET ?
        `).bind(limit, offset);
    const events = await eventsStmt.all<TimelineEvent>();

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

    // 输入验证
    const validationError = validate([
      validateRequired(title, '标题'),
      validateLength(title, '标题', 1, 100),
      validateRequired(date, '日期'),
      validateDate(date, '日期'),
    ])
    if (validationError) return errorResponse(validationError, 400)

    // XSS检测
    if (hasXSS(title) || (description && hasXSS(description))) {
      return errorResponse('输入内容包含不安全字符', 400)
    }

    // 消毒输入数据
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
      // 统一使用 JSON 数组格式存储图片
      JSON.stringify(Array.isArray(images) ? images : (typeof images === 'string' && images ? images.split(',').filter(Boolean) : []))
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
  } catch (error: any) {
    console.error('时间轴创建失败:', error);
    return errorResponse('数据库错误: ' + error.message, 500);
  }
}

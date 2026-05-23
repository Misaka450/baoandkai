import { Hono } from 'hono';
import { jsonResponse, errorResponse } from '../utils/response.js';
import { transformImageArray, serializeImages } from '../utils/url.js';
import { validate, validateRequired, validateLength, validateDate, hasXSS, sanitizeObject } from '../utils/validation.js';
import { buildPaginatedResponse, parsePagination } from '../utils/pagination.js';
import { pool } from '../lib/db.js';

const timeline = new Hono();

interface TimelineEvent {
  id: number;
  title: string;
  description?: string;
  date: string;
  location?: string;
  category?: string;
  images?: string;
  created_at: string;
  updated_at?: string;
}

interface CreateTimelineBody {
  title: string;
  description?: string;
  date: string;
  location?: string;
  category?: string;
  images?: string[];
}

/**
 * GET /api/timeline
 * 获取时间轴列表（支持分页和分类过滤）
 */
timeline.get('/', async (c) => {
  try {
    const url = new URL(c.req.url);
    const pagination = parsePagination(url, 10);
    const category = (c.req.query('category') || '').trim();

    let total = 0;
    let eventsList: TimelineEvent[] = [];

    if (category) {
      // 过滤分类计数
      const { rows: countRows } = await pool.query(
        'SELECT COUNT(*) as total FROM timeline_events WHERE category = $1',
        [category]
      );
      total = parseInt(countRows[0]?.total || '0', 10);

      // 获取分类列表
      const { rows } = await pool.query(
        `SELECT * FROM timeline_events
         WHERE category = $1
         ORDER BY date DESC, created_at DESC
         LIMIT $2 OFFSET $3`,
        [category, pagination.pageSize, pagination.offset]
      );
      eventsList = rows as TimelineEvent[];
    } else {
      // 全量计数
      const { rows: countRows } = await pool.query('SELECT COUNT(*) as total FROM timeline_events');
      total = parseInt(countRows[0]?.total || '0', 10);

      // 全量获取列表
      const { rows } = await pool.query(
        `SELECT * FROM timeline_events
         ORDER BY date DESC, created_at DESC
         LIMIT $1 OFFSET $2`,
        [pagination.pageSize, pagination.offset]
      );
      eventsList = rows as TimelineEvent[];
    }

    const eventsWithImages = eventsList.map((event) => ({
      ...event,
      images: transformImageArray(event.images),
    }));

    return jsonResponse(buildPaginatedResponse(eventsWithImages, total, pagination));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error('获取时间轴失败:', message);
    return errorResponse(message, 500);
  }
});

/**
 * POST /api/timeline
 * 新增时间轴事件
 */
timeline.post('/', async (c) => {
  try {
    const body = (await c.req.json()) as CreateTimelineBody;
    const { title, description, date, location, category, images = [] } = body;

    const validationError = validate([
      validateRequired(title, '标题'),
      validateLength(title, '标题', 1, 100),
      validateRequired(date, '日期'),
      validateDate(date, '日期'),
    ]);
    if (validationError) return errorResponse(validationError, 400);

    if (hasXSS(title) || (description && hasXSS(description))) {
      return errorResponse('输入内容包含不安全字符', 400);
    }

    const sanitized = sanitizeObject({ title, description, location, category }, ['images']);

    // 插入并返回新创建的事件
    const { rows } = await pool.query(
      `INSERT INTO timeline_events (title, description, date, location, category, images, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
       RETURNING *`,
      [
        sanitized.title,
        sanitized.description || '',
        date,
        sanitized.location || '',
        sanitized.category || '日常',
        serializeImages(images),
      ]
    );
    const newEvent = rows[0] as TimelineEvent;

    if (!newEvent) {
      return errorResponse('创建失败', 500);
    }

    return jsonResponse({
      ...newEvent,
      images: transformImageArray(newEvent.images),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error('时间轴创建失败:', message);
    return errorResponse('数据库错误', 500);
  }
});

/**
 * GET /api/timeline/:id
 * 获取单个时间轴事件
 */
timeline.get('/:id', async (c) => {
  try {
    const eventId = parseInt(c.req.param('id') || '');
    if (isNaN(eventId)) {
      return errorResponse('无效的ID', 400);
    }

    const { rows } = await pool.query('SELECT * FROM timeline_events WHERE id = $1', [eventId]);
    const event = rows[0] as TimelineEvent;

    if (!event) {
      return errorResponse('事件不存在', 404);
    }

    return jsonResponse({
      ...event,
      images: transformImageArray(event.images),
    });
  } catch (error: any) {
    console.error('获取时间轴详情失败:', error);
    return errorResponse(error.message, 500);
  }
});

/**
 * PUT /api/timeline/:id
 * 更新时间轴事件
 */
timeline.put('/:id', async (c) => {
  try {
    const eventId = parseInt(c.req.param('id') || '');
    if (isNaN(eventId)) {
      return errorResponse('无效的ID', 400);
    }

    const body: any = await c.req.json();
    const { title, description, date, location, category, images } = body;

    // 检查事件是否存在
    const { rows: checkRows } = await pool.query('SELECT * FROM timeline_events WHERE id = $1', [eventId]);
    const currentEvent = checkRows[0] as TimelineEvent;
    if (!currentEvent) {
      return errorResponse('事件不存在', 404);
    }

    // 验证规则（仅验证传入的字段）
    const rules: (string | null)[] = [];
    if (title !== undefined) {
      rules.push(validateRequired(title, '标题'));
      rules.push(validateLength(title, '标题', 1, 100));
    }
    if (date !== undefined) {
      rules.push(validateRequired(date, '日期'));
      rules.push(validateDate(date, '日期'));
    }
    const validationError = validate(rules);
    if (validationError) return errorResponse(validationError, 400);

    if ((title && hasXSS(title)) || (description && hasXSS(description))) {
      return errorResponse('输入内容包含不安全字符', 400);
    }

    const sanitized = sanitizeObject({ title, description, location, category }, ['images']);

    // 更新记录
    await pool.query(
      `UPDATE timeline_events SET 
         title = $1, 
         description = $2, 
         date = $3, 
         location = $4, 
         category = $5, 
         images = $6, 
         updated_at = NOW() 
       WHERE id = $7`,
      [
        title !== undefined ? sanitized.title : currentEvent.title,
        description !== undefined ? sanitized.description : currentEvent.description,
        date !== undefined ? date : currentEvent.date,
        location !== undefined ? sanitized.location : currentEvent.location,
        category !== undefined ? sanitized.category : currentEvent.category,
        images !== undefined ? serializeImages(images) : currentEvent.images,
        eventId,
      ]
    );

    // 获取更新后的结果
    const { rows: updatedRows } = await pool.query('SELECT * FROM timeline_events WHERE id = $1', [eventId]);
    const updatedEvent = updatedRows[0] as TimelineEvent;

    return jsonResponse({
      ...updatedEvent,
      images: transformImageArray(updatedEvent?.images),
    });
  } catch (error: any) {
    console.error('更新时间轴失败:', error);
    return errorResponse(error.message, 500);
  }
});

/**
 * DELETE /api/timeline/:id
 * 删除时间轴事件
 */
timeline.delete('/:id', async (c) => {
  try {
    const eventId = parseInt(c.req.param('id') || '');
    if (isNaN(eventId)) {
      return errorResponse('无效的ID', 400);
    }

    const { rowCount } = await pool.query('DELETE FROM timeline_events WHERE id = $1', [eventId]);
    if (rowCount === 0) {
      return errorResponse('事件不存在', 404);
    }

    return jsonResponse({ success: true, message: '事件已删除' });
  } catch (error: any) {
    console.error('删除时间轴失败:', error);
    return errorResponse(error.message, 500);
  }
});

export default timeline;

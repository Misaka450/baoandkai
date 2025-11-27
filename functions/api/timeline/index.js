import { jsonResponse, errorResponse } from '../../utils/response';

// Cloudflare Pages Functions - 时间轴API
export async function onRequestGet(context) {
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
    `).first();
    const total = countResult?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // 获取分页数据
    const events = await env.DB.prepare(`
      SELECT * FROM timeline_events 
      ORDER BY date DESC, created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    const eventsWithImages = events.results.map(event => ({
      ...event,
      images: event.images ? event.images.split(',') : []
    }));

    return jsonResponse({
      data: eventsWithImages,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    console.log('收到时间轴创建请求');

    const body = await request.json();
    console.log('请求数据:', body);

    const { title, description, date, location, category, images = [] } = body;

    if (!title || !date) {
      console.log('验证失败: 标题或日期为空');
      return errorResponse('标题和日期不能为空', 400);
    }

    console.log('正在插入数据到数据库...');

    const result = await env.DB.prepare(`
        INSERT INTO timeline_events (title, description, date, location, category, images, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
      title, description, date, location || '', category || '日常',
      images.join(',')
    ).run();

    const eventId = result.meta.last_row_id;
    const newEvent = await env.DB.prepare(`
        SELECT * FROM timeline_events WHERE id = ?
      `).bind(eventId).first();

    console.log('查询新记录成功:', newEvent);

    return jsonResponse({
      ...newEvent,
      images: newEvent.images ? newEvent.images.split(',') : []
    });
  } catch (error) {
    console.error('时间轴创建失败:', error);
    return errorResponse('数据库错误: ' + error.message, 500);
  }
}
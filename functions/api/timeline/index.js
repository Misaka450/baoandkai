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

    return new Response(JSON.stringify({
      data: eventsWithImages,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
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
      return new Response(JSON.stringify({ error: '标题和日期不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
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

    return new Response(JSON.stringify({
      ...newEvent,
      images: newEvent.images ? newEvent.images.split(',') : []
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('时间轴创建失败:', error);
    return new Response(JSON.stringify({
      error: '数据库错误: ' + error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 移除PUT和DELETE方法，由[id].js处理单个事件的操作

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
// Cloudflare Pages Functions - 相册列表API
export async function onRequestGet(context) {
  const { env } = context;

  try {
    const url = new URL(context.request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;

    // 获取总数
    const countResult = await env.DB.prepare(`
      SELECT COUNT(*) as total FROM albums
    `).first();
    const total = countResult.total;
    const totalPages = Math.ceil(total / limit);

    // 获取分页数据
    // 同时获取每个相册的第一张照片作为封面
    const albums = await env.DB.prepare(`
      SELECT a.*, 
        (SELECT url FROM photos WHERE album_id = a.id ORDER BY sort_order ASC LIMIT 1) as cover_url,
        (SELECT COUNT(*) FROM photos WHERE album_id = a.id) as photo_count
      FROM albums a
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    // 处理结果，构建符合前端预期的结构
    const results = albums.results.map(album => ({
      id: album.id,
      name: album.name,
      description: album.description,
      created_at: album.created_at,
      photos: album.cover_url ? [{ url: album.cover_url }] : [] // 模拟 photos 数组用于封面显示
    }));

    return new Response(JSON.stringify({
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('获取相册列表失败:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return new Response(JSON.stringify({ error: '相册名称不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await env.DB.prepare(`
      INSERT INTO albums (name, description, created_at, updated_at) 
      VALUES (?, ?, datetime('now'), datetime('now'))
    `).bind(name.trim(), description?.trim() || '').run();

    const newAlbum = await env.DB.prepare(`
      SELECT * FROM albums WHERE id = ?
    `).bind(result.meta.last_row_id).first();

    return new Response(JSON.stringify(newAlbum), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('创建相册失败:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
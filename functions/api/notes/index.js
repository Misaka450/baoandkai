import { jsonResponse, errorResponse } from '../../utils/response';

// Cloudflare Pages Functions - 碎碎念API
export async function onRequestGet(context) {
  const { env, request } = context;

  try {
    // 获取分页参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    // 获取总数
    const countResult = await env.DB.prepare(`
      SELECT COUNT(*) as total FROM notes
    `).first();
    const total = countResult?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // 获取分页数据
    const notes = await env.DB.prepare(`
      SELECT * FROM notes 
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    return jsonResponse({
      data: notes.results || [],
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
  const { request, env, data } = context;
  const user = data.user; // Injected by middleware

  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return errorResponse('请求格式错误: 无效的JSON格式', 400);
    }

    const { content, color } = body || {};

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return errorResponse('内容不能为空', 400);
    }

    const result = await env.DB.prepare(`
      INSERT INTO notes (content, color, user_id, created_at, updated_at) 
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      content.trim(),
      color || 'bg-yellow-100 border-yellow-200',
      user ? user.id : 1 // Fallback to 1 if user is missing (shouldn't happen with middleware)
    ).run();

    const newNote = await env.DB.prepare(`
      SELECT * FROM notes WHERE id = ?
    `).bind(result.meta.last_row_id).first();

    return jsonResponse(newNote, 201);
  } catch (error) {
    console.error('添加碎碎念API错误:', error);
    return errorResponse('服务器内部错误: ' + error.message, 500);
  }
}
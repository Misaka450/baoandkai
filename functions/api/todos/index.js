import { jsonResponse, errorResponse } from '../../utils/response';

// Cloudflare Pages Functions - 待办事项API
// GET /api/todos - 获取待办事项（支持分页）
export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const params = url.searchParams;
    const page = Math.max(1, parseInt(params.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.get('limit')) || 10));
    const offset = (page - 1) * limit;

    // 获取总数
    const countResult = await env.DB.prepare(`
      SELECT COUNT(*) as total FROM todos
    `).first();
    const total = countResult.total;

    // 获取分页数据
    const todos = await env.DB.prepare(`
      SELECT * FROM todos 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    return jsonResponse({
      data: todos.results,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCount: total,
      limit: limit
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

// POST /api/todos - 创建待办事项
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { title, description, status, priority, category, due_date, completion_notes, completion_photos } = body;

    if (!title) {
      return errorResponse('标题不能为空', 400);
    }

    const result = await env.DB.prepare(`
      INSERT INTO todos (title, description, status, priority, category, due_date, completion_notes, completion_photos, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      title,
      description || '',
      status || 'pending',
      priority || 2,
      category || 'general',
      due_date || null,
      completion_notes || null,
      completion_photos ? JSON.stringify(completion_photos) : null
    ).run();

    const todoId = result.meta.last_row_id;
    const newTodo = await env.DB.prepare(`
      SELECT * FROM todos WHERE id = ?
    `).bind(todoId).first();

    return jsonResponse(newTodo);
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
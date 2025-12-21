import { jsonResponse, errorResponse } from '../../utils/response';

// Cloudflare Pages Functions - 单个待办事项API
// PUT /api/todos/:id - 更新待办事项
/**
 * 更新单个待办事项的状态或内容
 * @param {import('@cloudflare/workers-types').EventContext} context 
 */
export async function onRequestPut(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    const body = await request.json();
    const { title, description, status, priority, category, due_date, completion_notes, completion_photos } = body;

    if (!id || isNaN(id)) {
      return errorResponse('无效的ID', 400);
    }

    if (!title || !title.trim()) {
      return errorResponse('标题不能为空', 400);
    }

    const result = await env.DB.prepare(`
      UPDATE todos 
      SET title = ?, description = ?, status = ?, priority = ?, category = ?, due_date = ?, completion_notes = ?, completion_photos = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      title.trim(),
      description || '',
      status || 'pending',
      priority || 2,
      category || 'general',
      due_date || null,
      completion_notes || null,
      completion_photos ? JSON.stringify(completion_photos) : null,
      parseInt(id)
    ).run();

    if (result.changes === 0) {
      return errorResponse('记录不存在', 404);
    }

    const updatedTodo = await env.DB.prepare(`
      SELECT * FROM todos WHERE id = ?
    `).bind(parseInt(id)).first();

    return jsonResponse({
      success: true,
      data: updatedTodo,
      message: '更新成功'
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

// DELETE /api/todos/:id - 删除待办事项
export async function onRequestDelete(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id || isNaN(id)) {
      return errorResponse('无效的ID', 400);
    }

    const result = await env.DB.prepare('DELETE FROM todos WHERE id = ?').bind(parseInt(id)).run();

    if (result.changes === 0) {
      return errorResponse('记录不存在', 404);
    }

    return jsonResponse({ success: true, message: '删除成功' });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
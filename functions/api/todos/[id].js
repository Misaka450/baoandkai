import { jsonResponse, errorResponse } from '../../utils/response';

/**
 * 更新待办事项
 */
export async function onRequestPut(context) {
  const { request, env, params } = context;

  try {
    const id = params.id;
    const todoId = parseInt(id);
    const body = await request.json();
    const { title, description, status, priority, category, due_date, completion_notes, completion_photos, images } = body;

    if (isNaN(todoId)) {
      return errorResponse('无效的ID', 400);
    }

    if (!title || !title.trim()) {
      return errorResponse('标题不能为空', 400);
    }

    const result = await env.DB.prepare(`
      UPDATE todos 
      SET title = ?, description = ?, status = ?, priority = ?, category = ?, due_date = ?, completion_notes = ?, completion_photos = ?, images = ?, updated_at = datetime('now')
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
      images ? JSON.stringify(images) : null,
      todoId
    ).run();

    if (result.changes === 0) {
      return errorResponse('任务不存在', 404);
    }

    const updatedTodo = await env.DB.prepare(`SELECT * FROM todos WHERE id = ?`).bind(todoId).first();

    return jsonResponse({
      ...updatedTodo,
      images: updatedTodo.images ? JSON.parse(updatedTodo.images) : [],
      completion_photos: updatedTodo.completion_photos ? JSON.parse(updatedTodo.completion_photos) : []
    });
  } catch (error) {
    console.error('更新待办事项失败:', error);
    return errorResponse(error.message, 500);
  }
}

/**
 * 删除待办事项（包含 R2 图片清理）
 */
export async function onRequestDelete(context) {
  const { env, params } = context;

  try {
    const id = params.id;
    const todoId = parseInt(id);

    if (isNaN(todoId)) {
      return errorResponse('无效的ID', 400);
    }

    // 1. 获取任务详情以清理可能存在的图片
    const todo = await env.DB.prepare(`SELECT images, completion_photos FROM todos WHERE id = ?`).bind(todoId).first();

    if (todo && env.IMAGES) {
      const cleanupList = [];

      // 解析图片列表
      const parseAndAdd = (field) => {
        try {
          const list = typeof field === 'string' ? JSON.parse(field) : (Array.isArray(field) ? field : []);
          list.forEach(item => {
            const url = typeof item === 'string' ? item : item.url;
            if (url && url.startsWith('/api/images/')) {
              const key = url.split('/api/images/')[1];
              cleanupList.push(decodeURIComponent(key));
            }
          });
        } catch (e) { }
      };

      parseAndAdd(todo.images);
      parseAndAdd(todo.completion_photos);

      if (cleanupList.length > 0) {
        const cleanupPromises = cleanupList.map(key => env.IMAGES.delete(key));
        Promise.all(cleanupPromises).catch(e => console.error('待办事项图片清理失败:', e));
      }
    }

    // 2. 执行数据库删除
    const result = await env.DB.prepare('DELETE FROM todos WHERE id = ?').bind(todoId).run();

    if (result.changes === 0) {
      return errorResponse('任务不存在', 404);
    }

    return jsonResponse({ success: true, message: '任务及关联资源已永久删除' });
  } catch (error) {
    console.error('删除待办事项失败:', error);
    return errorResponse(error.message, 500);
  }
}
// Cloudflare Pages Functions - 单个待办事项API（使用验证中间件）
import { withValidation, schemas } from '../../middleware/auth.js';

// PUT /api/todos/:id - 更新待办事项
export async function onRequestPut(context) {
  const { request, env } = context;
  
  // 创建带ID参数的验证模式
  const updateSchema = {
    requireAuth: true,
    params: {
      ...schemas.todo.params,
      id: { required: true, type: 'number', min: 1 }
    }
  };
  
  return withValidation(request, env, updateSchema, async (params) => {
    try {
      const { id, title, description, status, priority, category, due_date, completion_notes, completion_photos } = params;

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
        id
      ).run();

      if (result.changes === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: '待办事项不存在'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      const updatedTodo = await env.DB.prepare(`
        SELECT * FROM todos WHERE id = ?
      `).bind(id).first();

      return new Response(JSON.stringify({
        success: true,
        data: updatedTodo,
        message: '更新成功'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: '更新失败',
        message: process.env.ENVIRONMENT === 'development' ? error.message : '请稍后重试'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  });
}

// DELETE /api/todos/:id - 删除待办事项
export async function onRequestDelete(context) {
  const { request, env } = context;
  
  const deleteSchema = {
    requireAuth: true,
    params: {
      id: { required: true, type: 'number', min: 1 }
    }
  };
  
  return withValidation(request, env, deleteSchema, async (params) => {
    try {
      const { id } = params;

      const result = await env.DB.prepare('DELETE FROM todos WHERE id = ?').bind(id).run();
      
      if (result.changes === 0) {
        return new Response(JSON.stringify({
          success: false,
          error: '待办事项不存在'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: '删除成功'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: '删除失败',
        message: process.env.ENVIRONMENT === 'development' ? error.message : '请稍后重试'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
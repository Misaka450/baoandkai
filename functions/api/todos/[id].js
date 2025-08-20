// Cloudflare Pages Functions - 单个待办事项API（基于时间轴成功模式）
export async function onRequestPut(context) {
  const { request, env, params } = context;
  const id = params.id;
  
  try {
    const body = await request.json();
    
    // 验证待办事项是否存在
    const existing = await env.DB.prepare('SELECT id FROM todos WHERE id = ?').bind(id).first();
    if (!existing) {
      return new Response(JSON.stringify({ error: '待办事项不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await env.DB.prepare(`
        UPDATE todos 
        SET title = ?, description = ?, status = ?, priority = ?, category = ?, due_date = ?, completion_notes = ?, completion_photos = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(title, description || '', status || 'pending', priority || 3, category || 'general', due_date || null, completion_notes || null, completion_photos ? JSON.stringify(completion_photos) : null, id).run();
    
    const updatedTodo = await env.DB.prepare(`
      SELECT * FROM todos WHERE id = ?
    `).bind(id).first();

    return new Response(JSON.stringify(updatedTodo), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false,
      error: '服务器内部错误',
      message: process.env.ENVIRONMENT === 'development' ? error.message : '请稍后重试'
    }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  const id = params.id;
  
  try {
    // 验证待办事项是否存在
    const existing = await env.DB.prepare('SELECT id FROM todos WHERE id = ?').bind(id).first();
    if (!existing) {
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

    return new Response(JSON.stringify({ success: true, deleted: result.meta.changes }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('待办事项删除失败:', error);
    return new Response(JSON.stringify({ 
      error: '数据库错误: ' + error.message,
      stack: error.stack 
    }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
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
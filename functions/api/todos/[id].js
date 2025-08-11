// Cloudflare Pages Functions - 单个待办事项API（基于时间轴成功模式）
export async function onRequestPut(context) {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    console.log('收到待办事项更新请求，ID:', id);
    
    const body = await request.json();
    console.log('更新数据:', body);
    
    const { title, description, status, priority, category, due_date, completion_notes, completion_photos } = body;
    
    if (!title) {
      return new Response(JSON.stringify({ error: '标题不能为空' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('正在更新待办事项:', id);
    
    const result = await env.DB.prepare(`
        UPDATE todos 
        SET title = ?, description = ?, status = ?, priority = ?, category = ?, due_date = ?, completion_notes = ?, completion_photos = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(title, description || '', status || 'pending', priority || 3, category || 'general', due_date || null, completion_notes || null, completion_photos ? JSON.stringify(completion_photos) : null, id).run();
    
    const updatedTodo = await env.DB.prepare(`
      SELECT * FROM todos WHERE id = ?
    `).bind(id).first();

    console.log('更新成功:', updatedTodo);

    return new Response(JSON.stringify(updatedTodo), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('待办事项更新失败:', error);
    return new Response(JSON.stringify({ 
      error: '数据库错误: ' + error.message,
      stack: error.stack 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestDelete(context) {
  const { env } = context;
  
  try {
    const url = new URL(context.request.url);
    const id = url.pathname.split('/').pop();
    
    console.log('收到待办事项删除请求，ID:', id);
    
    // 验证ID是否为有效数字
    if (!id || isNaN(id)) {
      return new Response(JSON.stringify({ error: '无效的待办事项ID' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 先检查待办事项是否存在
    const existing = await env.DB.prepare('SELECT id FROM todos WHERE id = ?').bind(id).first();
    if (!existing) {
      return new Response(JSON.stringify({ error: '待办事项不存在' }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 执行删除
    const result = await env.DB.prepare('DELETE FROM todos WHERE id = ?').bind(id).run();
    
    console.log('删除成功，ID:', id, '影响行数:', result.meta.changes);

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
// Cloudflare Pages Functions - 单个待办事项API（无需认证，参考时间轴实现）

// PUT /api/todos/:id - 更新待办事项（无需认证，参考时间轴实现）
export async function onRequestPut(context) {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    const body = await request.json();
    const { title, description, status, priority, category, due_date, completion_notes, completion_photos } = body;
    
    if (!id || isNaN(id)) {
      return new Response(JSON.stringify({ error: '无效的ID' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!title || !title.trim()) {
      return new Response(JSON.stringify({ error: '标题不能为空' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
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
      return new Response(JSON.stringify({ error: '记录不存在' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updatedTodo = await env.DB.prepare(`
      SELECT * FROM todos WHERE id = ?
    `).bind(parseInt(id)).first();

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
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE /api/todos/:id - 删除待办事项（无需认证，参考时间轴实现）
export async function onRequestDelete(context) {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id || isNaN(id)) {
      return new Response(JSON.stringify({ error: '无效的ID' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await env.DB.prepare('DELETE FROM todos WHERE id = ?').bind(parseInt(id)).run();
    
    if (result.changes === 0) {
      return new Response(JSON.stringify({ error: '记录不存在' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ success: true, message: '删除成功' }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
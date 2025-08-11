// Cloudflare Pages Functions - 单个待办事项API（基于时间轴成功模式）
export async function onRequestPut(context) {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    console.log('收到待办事项更新请求，ID:', id);
    
    const body = await request.json();
    console.log('更新数据:', body);
    
    const { title, description, completed, priority, due_date } = body;
    
    if (!title) {
      return new Response(JSON.stringify({ error: '标题不能为空' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 映射前端字段到数据库字段
    const status = completed ? 'completed' : 'pending';
    const priorityValue = priority === 'high' ? 3 : priority === 'medium' ? 2 : 1;

    console.log('正在更新待办事项:', id);
    
    const result = await env.DB.prepare(`
        UPDATE todos 
        SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(title, description || '', status, priorityValue, due_date || null, id).run();
    
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
    
    await env.DB.prepare('DELETE FROM todos WHERE id = ?').bind(id).run();
    
    console.log('删除成功，ID:', id);

    return new Response(JSON.stringify({ success: true }), {
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
// Cloudflare Pages Functions - 待办事项API（基于时间轴成功模式）
export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    const todos = await env.DB.prepare(`
      SELECT * FROM todos ORDER BY created_at DESC
    `).all();
    
    return new Response(JSON.stringify(todos.results), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
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
    const { title, description, status, priority, category, due_date, completion_notes, completion_photos } = body;
    
    if (!title) {
      return new Response(JSON.stringify({ error: '标题不能为空' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 验证优先级，确保在1-3范围内
    const validPriority = priority && priority >= 1 && priority <= 3 ? priority : 2;

    const result = await env.DB.prepare(`
        INSERT INTO todos (title, description, status, priority, category, due_date, completion_notes, completion_photos, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        title, description || '', status || 'pending', validPriority, category || 'general', due_date || null, completion_notes || null, completion_photos ? JSON.stringify(completion_photos) : null
      ).run();
      
    const todoId = result.meta.last_row_id;
    const newTodo = await env.DB.prepare(`
      SELECT * FROM todos WHERE id = ?
    `).bind(todoId).first();

    return new Response(JSON.stringify(newTodo), {
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

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
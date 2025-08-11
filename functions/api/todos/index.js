// Cloudflare Pages Functions - 待办事项API
// 完全基于notes API的成功模式

export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    const todos = await env.DB.prepare(`
      SELECT * FROM todos 
      ORDER BY created_at DESC
    `).all();
    
    return new Response(JSON.stringify(todos.results || []), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('获取待办事项API错误:', error);
    return new Response(JSON.stringify({ 
      error: '服务器内部错误', 
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ 
        error: '请求格式错误', 
        details: '无效的JSON格式' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // 兼容前端字段名
    const {
      title,
      description = '',
      status = 'pending',
      priority = 3,
      due_date = null,
      category = 'general',
      notes = '',
      photos = []
    } = body || {};
    
    // 验证必填字段
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return new Response(JSON.stringify({ 
        error: '标题不能为空' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // 简化的数据处理
    const result = await env.DB.prepare(`
      INSERT INTO todos (
        title, description, status, priority, due_date, 
        category, completion_notes, completion_photos, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      String(title).trim(),
      String(description).trim(),
      ['pending', 'completed', 'cancelled'].includes(status) ? status : 'pending',
      Math.max(1, Math.min(5, parseInt(priority) || 3)),
      due_date || null,
      String(category).trim() || 'general',
      notes || null,
      photos && photos.length > 0 ? JSON.stringify(photos) : null
    ).run();
    
    const newTodo = await env.DB.prepare('SELECT * FROM todos WHERE id = ?')
      .bind(result.meta.last_row_id).first();
    
    return new Response(JSON.stringify(newTodo), {
      status: 201,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('创建待办事项API错误:', error);
    return new Response(JSON.stringify({ 
      error: '服务器内部错误', 
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
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
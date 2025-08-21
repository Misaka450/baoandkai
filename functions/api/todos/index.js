// Cloudflare Pages Functions - 待办事项API（无需认证，类似时间轴）

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
    
    return new Response(JSON.stringify({
      data: todos.results,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCount: total,
      limit: limit
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false,
      error: '获取数据失败',
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

// POST /api/todos - 创建待办事项（无需认证，类似时间轴）
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { title, description, status, priority, category, due_date, completion_notes, completion_photos } = body;
    
    if (!title) {
      return new Response(JSON.stringify({ 
        success: false,
        error: '标题不能为空'
      }), { 
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
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

    return new Response(JSON.stringify(newTodo), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false,
      error: '创建失败',
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
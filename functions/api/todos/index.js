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
    console.log('收到待办事项创建请求');
    
    const body = await request.json();
    console.log('请求数据:', body);
    
    const { title, description, completed, priority = 'medium', due_date } = body;
    
    if (!title) {
      console.log('验证失败: 标题为空');
      return new Response(JSON.stringify({ error: '标题不能为空' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('正在插入数据到数据库...');
    
    const result = await env.DB.prepare(`
        INSERT INTO todos (title, description, completed, priority, due_date, created_at) 
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        title, description || '', completed || false, priority, due_date || null
      ).run();
      
    const todoId = result.meta.last_row_id;
    const newTodo = await env.DB.prepare(`
      SELECT * FROM todos WHERE id = ?
    `).bind(todoId).first();

    console.log('查询新记录成功:', newTodo);

    return new Response(JSON.stringify(newTodo), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('待办事项创建失败:', error);
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
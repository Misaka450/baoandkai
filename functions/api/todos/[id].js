// Cloudflare Pages Functions - 单个待办事项API
// 完全基于notes API的成功模式

export async function onRequestPut(context) {
  const { request, env, params } = context;
  
  try {
    const id = parseInt(params.id);
    if (!id) {
      return new Response(JSON.stringify({ error: '无效的ID' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

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

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return new Response(JSON.stringify({ error: '标题不能为空' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    await env.DB.prepare(`
      UPDATE todos SET
        title = ?, description = ?, status = ?, priority = ?, due_date = ?,
        category = ?, completion_notes = ?, completion_photos = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      String(title).trim(),
      String(description).trim(),
      ['pending', 'completed', 'cancelled'].includes(status) ? status : 'pending',
      Math.max(1, Math.min(5, parseInt(priority) || 3)),
      due_date || null,
      String(category).trim() || 'general',
      notes || null,
      photos && photos.length > 0 ? JSON.stringify(photos) : null,
      id
    ).run();

    const updatedTodo = await env.DB.prepare('SELECT * FROM todos WHERE id = ?')
      .bind(id).first();

    if (!updatedTodo) {
      return new Response(JSON.stringify({ error: '待办事项不存在' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    return new Response(JSON.stringify(updatedTodo), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('更新待办事项API错误:', error);
    return new Response(JSON.stringify({ 
      error: '服务器内部错误', 
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  
  try {
    const id = parseInt(params.id);
    if (!id) {
      return new Response(JSON.stringify({ error: '无效的ID' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const exists = await env.DB.prepare('SELECT id FROM todos WHERE id = ?')
      .bind(id).first();

    if (!exists) {
      return new Response(JSON.stringify({ error: '待办事项不存在' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    await env.DB.prepare('DELETE FROM todos WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('删除待办事项API错误:', error);
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
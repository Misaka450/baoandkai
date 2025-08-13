// Cloudflare Pages Functions - 碎碎念API
export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    const notes = await env.DB.prepare(`
      SELECT * FROM notes 
      ORDER BY created_at DESC
    `).all()
    
    return new Response(JSON.stringify(notes.results || []), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function onRequestPost(context) {
  const { request, env } = context
  
  try {
    // 验证用户身份
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: '未授权访问' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }
    
    const token = authHeader.split(' ')[1]
    
    // 简化的token验证 - 兼容UUID格式
    if (!token || token.length < 10) {
      return new Response(JSON.stringify({ error: '无效的登录状态' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }
    
    // 验证token是否存在于数据库
    const user = await env.DB.prepare(`
      SELECT id FROM users 
      WHERE token = ? AND token_expires > datetime('now')
    `).bind(token).first();
    
    if (!user) {
      return new Response(JSON.stringify({ error: '无效的登录状态' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    let body;
    try {
      body = await request.json()
    } catch (e) {
      return new Response(JSON.stringify({ error: '请求格式错误', details: '无效的JSON格式' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }
    
    const { content, color } = body || {}
    
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return new Response(JSON.stringify({ error: '内容不能为空' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }
    
    const result = await env.DB.prepare(`
      INSERT INTO notes (content, color, user_id, created_at, updated_at) 
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      content.trim(), 
      color || 'bg-yellow-100 border-yellow-200', 
      1  // 使用固定的user_id=1
    ).run()
    
    const newNote = await env.DB.prepare(`
      SELECT * FROM notes WHERE id = ?
    `).bind(result.meta.last_row_id).first()
    
    return new Response(JSON.stringify(newNote), {
      status: 201,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    console.error('添加碎碎念API错误:', error)
    return new Response(JSON.stringify({ error: '服务器内部错误', details: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
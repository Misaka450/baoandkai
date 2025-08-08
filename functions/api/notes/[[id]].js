// Cloudflare Pages Functions - 碎碎念删除API
export async function onRequestDelete(context) {
  const { env, request } = context;
  
  try {
    // 验证用户身份
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: '未授权访问' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    const token = authHeader.split(' ')[1]
    const user = await verifyToken(token, env)
    if (!user) {
      return new Response(JSON.stringify({ error: '无效的登录状态' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    const url = new URL(context.request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id || isNaN(id)) {
      return new Response(JSON.stringify({ error: '无效的ID' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    const result = await env.DB.prepare('DELETE FROM notes WHERE id = ?').bind(parseInt(id)).run();
    
    if (result.changes === 0) {
      return new Response(JSON.stringify({ error: '记录不存在' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
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
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

async function verifyToken(token, env) {
  try {
    // 兼容前端的简单token验证
    if (token && token.startsWith('admin-token-')) {
      return { id: 1, username: 'admin', role: 'admin' }
    }
    
    // 同时支持数据库验证
    const user = await env.DB.prepare(`
      SELECT * FROM users WHERE token = ? AND token_expires > datetime('now')
    `).bind(token).first()
    
    return user
  } catch (error) {
    return null
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
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
    const user = await verifyAdminToken(token, env)
    if (!user) {
      return new Response(JSON.stringify({ error: '登录状态无效，请重新登录' }), { 
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
      return new Response(JSON.stringify({ error: '碎碎念不存在' }), { 
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

async function verifyAdminToken(token, env) {
  try {
    // 验证管理员token - 兼容UUID格式和自定义格式
    if (!token || token.length < 10) {
      return null;
    }
    
    // 查询数据库中的有效token
    const user = await env.DB.prepare(`
      SELECT id, username, email 
      FROM users 
      WHERE token = ? AND token_expires > datetime('now')
    `).bind(token).first()
    
    // 只要token有效就返回用户（目前只有管理员用户）
    return user || null;
  } catch (error) {
    console.error('Token验证错误:', error);
    return null;
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
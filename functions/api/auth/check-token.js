// Cloudflare Pages Functions - 检查token有效性
export async function onRequestGet(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        valid: false, 
        error: '未提供token',
        auth_header: authHeader 
      }), { 
        headers: corsHeaders 
      });
    }

    const token = authHeader.split(' ')[1];
    
    // 查询数据库验证token
    const user = await env.DB.prepare(`
      SELECT id, username, email, token_expires
      FROM users 
      WHERE token = ? AND token_expires > datetime('now')
    `).bind(token).first();

    if (user) {
      return new Response(JSON.stringify({
        valid: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          token_expires: user.token_expires
        },
        token_length: token.length
      }), { 
        headers: corsHeaders 
      });
    } else {
      // 检查token是否存在（不管是否过期）
      const existingUser = await env.DB.prepare(`
        SELECT id, username, token_expires
        FROM users 
        WHERE token = ?
      `).bind(token).first();

      return new Response(JSON.stringify({
        valid: false,
        error: 'token无效或已过期',
        token_exists: !!existingUser,
        token_expires: existingUser?.token_expires,
        token_length: token.length
      }), { 
        headers: corsHeaders 
      });
    }

  } catch (error) {
    return new Response(JSON.stringify({
      valid: false,
      error: error.message
    }), { 
      status: 500,
      headers: corsHeaders 
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
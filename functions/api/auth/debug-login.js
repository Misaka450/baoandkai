// Cloudflare Pages Functions - 登录调试API
// 用于调试登录问题，查看数据库状态
export async function onRequestGet(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  try {
    // 获取数据库中的所有用户
    const users = await env.DB.prepare(`
      SELECT id, username, password_hash, email, created_at 
      FROM users 
      ORDER BY id
    `).all();

    // 获取用户数量
    const userCount = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM users
    `).first();

    return new Response(JSON.stringify({
      success: true,
      userCount: userCount.count,
      users: users.results,
      testLogin: {
        username: 'baobao',
        expectedPassword: 'baobao123',
        note: '请确保数据库中的password_hash字段就是baobao123'
      }
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// POST方法用于测试登录
export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  try {
    const body = await request.json();
    const { username, password } = body;

    // 查询用户
    const user = await env.DB.prepare(`
      SELECT id, username, password_hash, email 
      FROM users 
      WHERE username = ?
    `).bind(username).first();

    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: '用户不存在',
        foundUser: false
      }), {
        headers: corsHeaders
      });
    }

    // 检查密码
    const passwordMatch = password === user.password_hash;

    return new Response(JSON.stringify({
      success: true,
      userFound: true,
      username: user.username,
      passwordInDb: user.password_hash,
      providedPassword: password,
      passwordMatch: passwordMatch,
      expectedPassword: 'baobao123'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
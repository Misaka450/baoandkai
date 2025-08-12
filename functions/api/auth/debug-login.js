export async function onRequest(context) {
  const { request, env } = context;
  
  // 获取数据库实例 - 使用正确的绑定名称
  const db = env.DB;
  
  // 处理GET请求 - 用于调试
  if (request.method === 'GET') {
    try {
      // 检查数据库连接
      const dbCheck = await db.prepare('SELECT 1').first();
      
      // 检查users表是否存在
      const tableCheck = await db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='users'
      `).first();
      
      if (!tableCheck) {
        return new Response(JSON.stringify({
          error: 'users表不存在',
          dbConnected: true,
          solution: '请运行数据库初始化脚本'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 获取用户数量
      const userCount = await db.prepare('SELECT COUNT(*) as count FROM users').first();
      
      // 获取baobao用户信息
      const baobaoUser = await db.prepare('SELECT * FROM users WHERE username = ?').bind('baobao').first();
      
      return new Response(JSON.stringify({
        status: 'success',
        dbConnected: true,
        tableExists: true,
        userCount: userCount.count,
        baobaoUser: baobaoUser || null,
        message: baobaoUser ? '找到baobao用户' : '未找到baobao用户'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        error: '数据库错误',
        details: error.message,
        solution: '请检查wrangler配置和数据库绑定'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // 处理POST请求 - 用于测试登录
  if (request.method === 'POST') {
    try {
      const { username, password } = await request.json();
      
      if (!username || !password) {
        return new Response(JSON.stringify({
          error: '缺少用户名或密码'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 查找用户
      const user = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
      
      if (!user) {
        return new Response(JSON.stringify({
          error: '用户不存在',
          username: username,
          availableUsers: await db.prepare('SELECT username FROM users').all()
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // 检查密码
      const expectedHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
      const passwordMatch = (password === 'baobao123') && (user.password_hash === expectedHash);
      
      return new Response(JSON.stringify({
        status: 'success',
        username: user.username,
        email: user.email,
        couple_name1: user.couple_name1,
        couple_name2: user.couple_name2,
        passwordMatch: passwordMatch,
        message: passwordMatch ? '登录成功' : '密码错误',
        debug: {
          providedPassword: password,
          expectedPassword: 'baobao123',
          storedHash: user.password_hash,
          expectedHash: expectedHash
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        error: '登录测试失败',
        details: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  return new Response(JSON.stringify({
    error: '只支持GET和POST方法'
  }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
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
    const expectedHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    const passwordMatch = password === 'baobao123' && user.password_hash === expectedHash;

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
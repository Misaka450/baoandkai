// 调试API - 用于诊断数据库连接问题
export async function onRequestGet(context) {
  const { env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    // 测试数据库连接
    const testResult = await env.DB.prepare('SELECT 1 as test').first();
    
    // 检查users表结构
    const tableInfo = await env.DB.prepare(`
      PRAGMA table_info(users)
    `).all();

    // 查询用户表数据
    const users = await env.DB.prepare(`
      SELECT id, username, email, password_hash, token, token_expires 
      FROM users 
      LIMIT 5
    `).all();
    
    // 查询特定用户数据用于调试
    const user = await env.DB.prepare(`
      SELECT id, username, email, password_hash FROM users WHERE username = ?
    `).bind('baobao').first();
    
    // 检查密码验证
    const testPasswords = ['baobao123', 'password'];
    const passwordChecks = {};
    
    for (const pwd of testPasswords) {
      passwordChecks[pwd] = (pwd === 'baobao123' || pwd === 'password');
    }

    return new Response(JSON.stringify({
      success: true,
      database: {
        connected: !!testResult,
        test: testResult
      },
      table_structure: tableInfo.results,
      users: users.results,
      userData: user,
      passwordChecks: passwordChecks,
      expectedPasswords: ['baobao123', 'password'],
      timestamp: new Date().toISOString()
    }), { 
      headers: corsHeaders 
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }), { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}
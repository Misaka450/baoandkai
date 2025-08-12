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
      SELECT id, username, email, role, token, token_expires 
      FROM users 
      LIMIT 5
    `).all();

    return new Response(JSON.stringify({
      success: true,
      database: {
        connected: !!testResult,
        test: testResult
      },
      table_structure: tableInfo.results,
      users: users.results,
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
// 简单的数据库连接测试
export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    // 测试数据库连接
    const test = await env.DB.prepare('SELECT 1 as test').first();
    
    return new Response(JSON.stringify({
      success: true,
      database_connected: !!test,
      test_result: test
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      error_type: error.constructor.name
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
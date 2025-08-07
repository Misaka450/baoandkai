// 美食表调试端点
export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    // 获取表结构
    const schema = await env.DB.prepare(`
      PRAGMA table_info(food_checkins)
    `).all();
    
    // 获取示例数据
    const sample = await env.DB.prepare(`
      SELECT * FROM food_checkins LIMIT 1
    `).first();
    
    // 获取所有数据
    const allData = await env.DB.prepare(`
      SELECT * FROM food_checkins ORDER BY date DESC LIMIT 5
    `).all();
    
    return new Response(JSON.stringify({
      schema: schema.results,
      sample: sample,
      recent: allData.results,
      table_exists: schema.results.length > 0
    }, null, 2), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
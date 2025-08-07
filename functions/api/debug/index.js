// Cloudflare Pages Functions - 调试API
export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    console.log('Debug API called');
    console.log('Available bindings:', Object.keys(env || {}));
    
    // 检查数据库连接
    if (!env.DB) {
      console.error('DB binding not found in environment');
      return new Response(JSON.stringify({
        error: 'DB binding not found',
        available_bindings: Object.keys(env || {}),
        status: 'failed'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 检查数据库连接
    const tables = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables found:', tables.results);
    
    // 检查timeline_events表结构
    const columns = await env.DB.prepare("PRAGMA table_info(timeline_events)").all();
    console.log('Timeline columns:', columns.results);
    
    // 检查timeline_events数据量
    const count = await env.DB.prepare("SELECT COUNT(*) as count FROM timeline_events").first();
    console.log('Timeline events count:', count.count);
    
    return new Response(JSON.stringify({
      status: 'success',
      tables: tables.results,
      timeline_columns: columns.results,
      timeline_count: count.count,
      bindings: Object.keys(env || {})
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      status: 'failed',
      bindings: Object.keys(env || {}),
      stack: error.stack
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
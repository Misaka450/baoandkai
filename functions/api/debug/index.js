// Cloudflare Pages Functions - 调试API - 专门检查todos问题
export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    console.log('Debug API called - Todos专项检查');
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
    
    // 检查所有表
    const tables = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    
    // 检查todos表结构
    const todosColumns = await env.DB.prepare("PRAGMA table_info(todos)").all();
    
    // 检查settings表结构
    const settingsColumns = await env.DB.prepare("PRAGMA table_info(settings)").all();
    
    // 检查数据量
    const todosCount = await env.DB.prepare("SELECT COUNT(*) as count FROM todos").first();
    const settingsCount = await env.DB.prepare("SELECT COUNT(*) as count FROM settings").first();
    
    // 检查todos表数据示例
    const todosSample = await env.DB.prepare("SELECT * FROM todos ORDER BY id DESC LIMIT 3").all();
    
    // 检查settings数据示例
    const settingsSample = await env.DB.prepare("SELECT key, LENGTH(value) as value_length FROM settings LIMIT 3").all();
    
    return new Response(JSON.stringify({
      status: 'success',
      tables: tables.results,
      todos_columns: todosColumns.results,
      settings_columns: settingsColumns.results,
      todos_count: todosCount.count,
      settings_count: settingsCount.count,
      todos_sample: todosSample.results,
      settings_sample: settingsSample.results,
      bindings: Object.keys(env || {}),
      timestamp: new Date().toISOString()
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
      stack: error.stack,
      sql_error: error.toString()
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 用于测试POST请求
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const testData = await request.json();
    
    // 检查数据库连接
    if (!env.DB) {
      return new Response(JSON.stringify({
        error: 'DB binding not found',
        bindings: Object.keys(env || {})
      }), { status: 500 });
    }
    
    // 尝试插入测试数据
    const result = await env.DB.prepare(`
      INSERT INTO todos (title, description, status, priority, due_date, category, completion_notes, completion_photos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      testData.title || '测试标题',
      testData.description || '测试描述',
      testData.status || 'pending',
      testData.priority || 3,
      testData.due_date || null,
      testData.category || 'general',
      testData.notes || null,
      testData.photos ? JSON.stringify(testData.photos) : null
    ).run();
    
    return new Response(JSON.stringify({
      success: true,
      inserted_id: result.meta?.last_row_id,
      test_data: testData
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack,
      sql_error: error.toString(),
      test_data_received: testData || null
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
// Cloudflare Pages Functions - 调试待办事项API
export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // 记录原始请求信息
    const contentType = request.headers.get('content-type') || '';
    const bodyText = await request.text();
    
    let parsedData;
    try {
      parsedData = JSON.parse(bodyText);
    } catch (parseError) {
      return new Response(JSON.stringify({
        error: 'JSON解析失败',
        details: parseError.message,
        received: bodyText,
        contentType: contentType
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 验证必需字段
    if (!parsedData.title) {
      return new Response(JSON.stringify({
        error: '标题不能为空',
        received: parsedData
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 检查数据库连接
    let dbCheck;
    try {
      dbCheck = await env.DB.prepare('SELECT 1 as test').first();
    } catch (dbError) {
      return new Response(JSON.stringify({
        error: '数据库连接失败',
        details: dbError.message,
        data: parsedData
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 检查表结构
    let tableInfo;
    try {
      tableInfo = await env.DB.prepare(`
        PRAGMA table_info(todos)
      `).all();
    } catch (tableError) {
      return new Response(JSON.stringify({
        error: '表结构检查失败',
        details: tableError.message,
        data: parsedData
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 模拟插入操作
    let completion_notes = null;
    let completion_photos = null;
    
    if (parsedData.notes !== undefined) {
      completion_notes = parsedData.notes;
    }
    
    if (parsedData.photos !== undefined && Array.isArray(parsedData.photos)) {
      completion_photos = JSON.stringify(parsedData.photos);
    }

    try {
      const result = await env.DB.prepare(`
        INSERT INTO todos (title, description, status, priority, due_date, category, completion_notes, completion_photos)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        parsedData.title,
        parsedData.description || '',
        parsedData.status || 'pending',
        parsedData.priority || 3,
        parsedData.due_date || null,
        parsedData.category || 'general',
        completion_notes,
        completion_photos
      ).run();

      const newTodo = await env.DB.prepare('SELECT * FROM todos WHERE id = ?')
        .bind(result.meta.last_row_id).first();

      return new Response(JSON.stringify({
        success: true,
        todo: newTodo,
        debug: {
          received: parsedData,
          processed: {
            title: parsedData.title,
            description: parsedData.description || '',
            status: parsedData.status || 'pending',
            priority: parsedData.priority || 3,
            due_date: parsedData.due_date || null,
            category: parsedData.category || 'general',
            completion_notes,
            completion_photos
          }
        }
      }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (insertError) {
      return new Response(JSON.stringify({
        error: '插入失败',
        details: insertError.message,
        sql: 'INSERT INTO todos (title, description, status, priority, due_date, category, completion_notes, completion_photos) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        values: [
          parsedData.title,
          parsedData.description || '',
          parsedData.status || 'pending',
          parsedData.priority || 3,
          parsedData.due_date || null,
          parsedData.category || 'general',
          completion_notes,
          completion_photos
        ]
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    return new Response(JSON.stringify({
      error: '未知错误',
      details: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
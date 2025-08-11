// Cloudflare Pages Functions - 测试端点
export async function onRequestPost(context) {
  const { request, env } = context;
  
  // 添加详细的CORS头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  try {
    // 获取原始请求体
    const bodyText = await request.text();
    
    let data;
    try {
      data = JSON.parse(bodyText);
    } catch (e) {
      return new Response(JSON.stringify({
        error: 'JSON解析失败',
        details: e.message,
        received_body: bodyText
      }), { status: 400, headers: corsHeaders });
    }

    // 验证必填字段
    if (!data.title) {
      return new Response(JSON.stringify({
        error: '标题不能为空',
        received_data: data
      }), { status: 400, headers: corsHeaders });
    }

    // 验证数据类型
    const validation = {
      title: typeof data.title,
      description: typeof data.description,
      status: typeof data.status,
      priority: typeof data.priority,
      due_date: typeof data.due_date,
      category: typeof data.category,
      notes: typeof data.notes,
      photos: Array.isArray(data.photos) ? 'array' : typeof data.photos
    };

    // 检查数据库连接
    try {
      await env.DB.prepare('SELECT 1').first();
    } catch (dbError) {
      return new Response(JSON.stringify({
        error: '数据库连接失败',
        db_error: dbError.message,
        validation,
        received_data: data
      }), { status: 500, headers: corsHeaders });
    }

    // 检查表是否存在
    try {
      await env.DB.prepare('SELECT COUNT(*) as count FROM todos').first();
    } catch (tableError) {
      return new Response(JSON.stringify({
        error: 'todos表访问失败',
        table_error: tableError.message,
        validation,
        received_data: data
      }), { status: 500, headers: corsHeaders });
    }

    // 准备插入数据
    const insertData = {
      title: String(data.title || '').trim(),
      description: String(data.description || '').trim(),
      status: ['pending', 'completed', 'cancelled'].includes(data.status) ? data.status : 'pending',
      priority: Math.max(1, Math.min(5, parseInt(data.priority) || 3)),
      due_date: (data.due_date && data.due_date !== '') ? data.due_date : null,
      category: String(data.category || 'general').trim(),
      completion_notes: (data.notes && data.notes !== '') ? String(data.notes).trim() : null,
      completion_photos: (data.photos && Array.isArray(data.photos) && data.photos.length > 0) 
        ? JSON.stringify(data.photos.filter(p => typeof p === 'string' && p.trim())) 
        : null
    };

    // 执行插入
    const result = await env.DB.prepare(`
      INSERT INTO todos (
        title, description, status, priority, due_date, 
        category, completion_notes, completion_photos
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      insertData.title,
      insertData.description,
      insertData.status,
      insertData.priority,
      insertData.due_date,
      insertData.category,
      insertData.completion_notes,
      insertData.completion_photos
    ).run();

    // 获取新创建的记录
    const newTodo = await env.DB.prepare('SELECT * FROM todos WHERE id = ?')
      .bind(result.meta.last_row_id).first();

    return new Response(JSON.stringify({
      success: true,
      todo: newTodo,
      debug: {
        received: data,
        processed: insertData,
        validation
      }
    }), { status: 201, headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify({
      error: '服务器内部错误',
      details: error.message,
      stack: error.stack,
      received_body: bodyText || '无法获取请求体'
    }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestGet(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  try {
    const { env } = context;
    const result = await env.DB.prepare('SELECT * FROM todos LIMIT 10').all();
    return new Response(JSON.stringify(result.results), { headers: corsHeaders });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
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
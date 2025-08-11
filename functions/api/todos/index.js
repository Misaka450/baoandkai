// Cloudflare Pages Functions - 待办事项API
export async function onRequestGet(context) {
  const { env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const { results } = await env.DB.prepare(`
      SELECT * FROM todos 
      ORDER BY 
        CASE status 
          WHEN 'pending' THEN 1 
          WHEN 'completed' THEN 2 
          WHEN 'cancelled' THEN 3 
          ELSE 4 
        END,
        priority DESC,
        created_at DESC
    `).all();
    
    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const data = await request.json();
    
    if (!data.title) {
      return new Response(JSON.stringify({ error: '标题不能为空' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 处理完成数据
    let completion_notes = null;
    let completion_photos = null;
    
    if (data.notes) {
      completion_notes = data.notes;
    }
    
    if (data.photos && Array.isArray(data.photos)) {
      completion_photos = JSON.stringify(data.photos);
    }

    const result = await env.DB.prepare(`
      INSERT INTO todos (title, description, status, priority, due_date, category, completion_notes, completion_photos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.title,
      data.description || '',
      data.status || 'pending',
      data.priority || 3,
      data.due_date || null,
      data.category || 'general',
      completion_notes,
      completion_photos
    ).run();

    const newTodo = await env.DB.prepare('SELECT * FROM todos WHERE id = ?')
      .bind(result.meta.last_row_id).first();

    return new Response(JSON.stringify(newTodo), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
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
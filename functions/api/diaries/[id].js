// Cloudflare Pages Functions - 日记单个资源API
export async function onRequestPut(context) {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    const body = await request.json();
    const { title, content, date, mood, weather, images = [] } = body;
    
    if (!id || isNaN(id)) {
      return new Response(JSON.stringify({ error: '无效的ID' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!title || !title.trim()) {
      return new Response(JSON.stringify({ error: '日记标题不能为空' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await env.DB.prepare(`
      UPDATE diaries 
      SET title = ?, content = ?, date = ?, mood = ?, weather = ?, images = ?, updated_at = datetime('now') 
      WHERE id = ?
    `).bind(
      title.trim(), 
      content?.trim() || '', 
      date || new Date().toISOString().split('T')[0],
      mood || 'happy',
      weather || 'sunny',
      JSON.stringify(images),
      parseInt(id)
    ).run();
    
    if (result.changes === 0) {
      return new Response(JSON.stringify({ error: '日记不存在' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updatedDiary = await env.DB.prepare(`
      SELECT * FROM diaries WHERE id = ?
    `).bind(parseInt(id)).first();

    return new Response(JSON.stringify(updatedDiary), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('更新日记失败:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestDelete(context) {
  const { env } = context;
  
  try {
    const url = new URL(context.request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id || isNaN(id)) {
      return new Response(JSON.stringify({ error: '无效的ID' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await env.DB.prepare('DELETE FROM diaries WHERE id = ?').bind(parseInt(id)).run();
    
    if (result.changes === 0) {
      return new Response(JSON.stringify({ error: '记录不存在' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ success: true, message: '删除成功' }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
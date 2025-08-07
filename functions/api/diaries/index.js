// Cloudflare Pages Functions - 日记API
export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    const diaries = await env.oursql.prepare(`
      SELECT * FROM diaries ORDER BY date DESC, created_at DESC
    `).all();
    
    const diariesWithImages = diaries.results.map(diary => ({
      ...diary,
      images: diary.images ? diary.images.split(',') : []
    }));

    return new Response(JSON.stringify(diariesWithImages), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const body = await request.json();
    const { title, content, date, mood, weather, images = [] } = body;
    
    if (!title || !content || !date) {
      return new Response(JSON.stringify({ error: '标题、内容和日期不能为空' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await env.oursql.prepare(`
      INSERT INTO diaries (title, content, date, mood, weather, images, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      title, content, date, mood || '开心', weather || '晴天', 
      images.join(',')
    ).run();
    
    const diaryId = result.meta.last_row_id;
    const newDiary = await env.oursql.prepare(`
      SELECT * FROM diaries WHERE id = ?
    `).bind(diaryId).first();

    return new Response(JSON.stringify({
      ...newDiary,
      images: newDiary.images ? newDiary.images.split(',') : []
    }), {
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

export async function onRequestPut(context) {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    const body = await request.json();
    const { title, content, date, mood, weather, images = [] } = body;
    
    await env.oursql.prepare(`
      UPDATE diaries 
      SET title = ?, content = ?, date = ?, mood = ?, weather = ?, images = ?, updated_at = datetime('now') 
      WHERE id = ?
    `).bind(title, content, date, mood, weather, images.join(','), id).run();
    
    const updatedDiary = await env.oursql.prepare(`
      SELECT * FROM diaries WHERE id = ?
    `).bind(id).first();

    return new Response(JSON.stringify({
      ...updatedDiary,
      images: updatedDiary.images ? updatedDiary.images.split(',') : []
    }), {
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

export async function onRequestDelete(context) {
  const { env } = context;
  
  try {
    const url = new URL(context.request.url);
    const id = url.pathname.split('/').pop();
    
    await env.oursql.prepare('DELETE FROM diaries WHERE id = ?').bind(id).run();
    
    return new Response(JSON.stringify({ success: true }), {
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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
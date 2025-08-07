// Cloudflare Pages Functions - 时间轴API
export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    const events = await env.DB.prepare(`
      SELECT * FROM timeline_events ORDER BY date DESC, created_at DESC
    `).all();
    
    const eventsWithImages = events.results.map(event => ({
      ...event,
      images: event.images ? event.images.split(',') : []
    }));

    return new Response(JSON.stringify(eventsWithImages), {
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
    const { title, description, date, location, category, images = [] } = body;
    
    if (!title || !date) {
      return new Response(JSON.stringify({ error: '标题和日期不能为空' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await env.DB.prepare(`
      INSERT INTO timeline_events (title, description, date, location, category, images, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      title, description, date, location || '', category || '日常', 
      images.join(',')
    ).run();
    
    const eventId = result.meta.last_row_id;
    const newEvent = await env.DB.prepare(`
      SELECT * FROM timeline_events WHERE id = ?
    `).bind(eventId).first();

    return new Response(JSON.stringify({
      ...newEvent,
      images: newEvent.images ? newEvent.images.split(',') : []
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
    const { title, description, date, location, category, images = [] } = body;
    
    await env.DB.prepare(`
      UPDATE timeline_events 
      SET title = ?, description = ?, date = ?, location = ?, category = ?, images = ?, updated_at = datetime('now') 
      WHERE id = ?
    `).bind(title, description, date, location, category, images.join(','), id).run();
    
    const updatedEvent = await env.DB.prepare(`
      SELECT * FROM timeline_events WHERE id = ?
    `).bind(id).first();

    return new Response(JSON.stringify({
      ...updatedEvent,
      images: updatedEvent.images ? updatedEvent.images.split(',') : []
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
    
    await env.DB.prepare('DELETE FROM timeline_events WHERE id = ?').bind(id).run();
    
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
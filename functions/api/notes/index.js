// Cloudflare Pages Functions - 碎碎念API
export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    const notes = await env.DB.prepare(`
      SELECT * FROM notes 
      ORDER BY created_at DESC
    `).all()
    
    return new Response(JSON.stringify(notes.results || []), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function onRequestPost(context) {
  const { request, env } = context
  
  try {
    const body = await request.json()
    const { content, color } = body
    
    if (!content || content.trim().length === 0) {
      return new Response(JSON.stringify({ error: '内容不能为空' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const result = await env.DB.prepare(`
      INSERT INTO notes (content, color, created_at) 
      VALUES (?, ?, datetime('now'))
    `).bind(content.trim(), color || 'bg-yellow-100 border-yellow-200').run()
    
    const newNote = await env.DB.prepare(`
      SELECT * FROM notes WHERE id = ?
    `).bind(result.meta.last_row_id).first()
    
    return new Response(JSON.stringify(newNote), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
// Cloudflare Pages Functions - 相册单个资源API
export async function onRequestPut(context) {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    const body = await request.json();
    const { name, description, photos = [] } = body;
    
    if (!id || isNaN(id)) {
      return new Response(JSON.stringify({ error: '无效的ID' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!name || !name.trim()) {
      return new Response(JSON.stringify({ error: '相册名称不能为空' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 更新相册信息
    const result = await env.DB.prepare(`
      UPDATE albums SET name = ?, description = ?, updated_at = datetime('now') 
      WHERE id = ?
    `).bind(name.trim(), description?.trim() || '', parseInt(id)).run();
    
    if (result.changes === 0) {
      return new Response(JSON.stringify({ error: '相册不存在' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 删除旧照片并插入新照片
    await env.DB.prepare('DELETE FROM photos WHERE album_id = ?').bind(parseInt(id)).run();
    
    if (photos.length > 0) {
      const photoPromises = photos.map(photo => 
        env.DB.prepare(`
          INSERT INTO photos (album_id, url, caption, created_at) 
          VALUES (?, ?, ?, datetime('now'))
        `).bind(parseInt(id), photo.url || photo, photo.caption || '').run()
      );
      await Promise.all(photoPromises);
    }

    const updatedAlbum = await env.DB.prepare(`
      SELECT * FROM albums WHERE id = ?
    `).bind(parseInt(id)).first();
    
    const albumPhotos = await env.DB.prepare(`
      SELECT * FROM photos WHERE album_id = ?
    `).bind(parseInt(id)).all();

    return new Response(JSON.stringify({
      ...updatedAlbum,
      photos: albumPhotos.results || []
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('更新相册失败:', error);
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
    
    // 先删除相册中的照片
    await env.DB.prepare('DELETE FROM photos WHERE album_id = ?').bind(parseInt(id)).run();
    
    // 再删除相册
    const result = await env.DB.prepare('DELETE FROM albums WHERE id = ?').bind(parseInt(id)).run();
    
    if (result.changes === 0) {
      return new Response(JSON.stringify({ error: '相册不存在' }), { 
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
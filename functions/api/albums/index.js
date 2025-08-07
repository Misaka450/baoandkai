// Cloudflare Pages Functions - 相册API
export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    const albums = await env.DB.prepare(`SELECT * FROM albums`).all();
    const photos = await env.DB.prepare('SELECT * FROM photos').all();
    
    const albumsWithPhotos = albums.results.map(album => ({
      ...album,
      photos: photos.results.filter(photo => photo.album_id === album.id)
    }));

    return new Response(JSON.stringify(albumsWithPhotos), {
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
    const { name, description, photos = [] } = body;
    
    if (!name) {
      return new Response(JSON.stringify({ error: '相册名称不能为空' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const albumResult = await env.DB.prepare(`
      INSERT INTO albums (name, description, created_at) 
      VALUES (?, ?, datetime('now'))
    `).bind(name, description).run();
    
    const albumId = albumResult.meta.last_row_id;
    
    // 批量插入照片
    if (photos.length > 0) {
      const photoPromises = photos.map(photo => 
        env.DB.prepare(`
          INSERT INTO photos (album_id, url, caption, created_at) 
          VALUES (?, ?, ?, datetime('now'))
        `).bind(albumId, photo.url, photo.caption || '').run()
      );
      await Promise.all(photoPromises);
    }

    const newAlbum = await env.DB.prepare(`
      SELECT * FROM albums WHERE id = ?
    `).bind(albumId).first();
    
    const albumPhotos = await env.DB.prepare(`
      SELECT * FROM photos WHERE album_id = ?
    `).bind(albumId).all();

    return new Response(JSON.stringify({
      ...newAlbum,
      photos: albumPhotos.results
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
    const { name, description, photos = [] } = body;
    
    await env.DB.prepare(`
      UPDATE albums SET name = ?, description = ?, updated_at = datetime('now') 
      WHERE id = ?
    `).bind(name, description, id).run();
    
    // 删除旧照片并插入新照片
    await env.DB.prepare('DELETE FROM photos WHERE album_id = ?').bind(id).run();
    
    if (photos.length > 0) {
      const photoPromises = photos.map(photo => 
        env.DB.prepare(`
          INSERT INTO photos (album_id, url, caption, created_at) 
          VALUES (?, ?, ?, datetime('now'))
        `).bind(id, photo.url, photo.caption || '').run()
      );
      await Promise.all(photoPromises);
    }

    const updatedAlbum = await env.DB.prepare(`
      SELECT * FROM albums WHERE id = ?
    `).bind(id).first();
    
    const albumPhotos = await env.DB.prepare(`
      SELECT * FROM photos WHERE album_id = ?
    `).bind(id).all();

    return new Response(JSON.stringify({
      ...updatedAlbum,
      photos: albumPhotos.results
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
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    await env.DB.prepare('DELETE FROM photos WHERE album_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM albums WHERE id = ?').bind(id).run();
    
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
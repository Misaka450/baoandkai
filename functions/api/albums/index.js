// Cloudflare Pages Functions - 相册列表API
export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    const albums = await env.DB.prepare(`SELECT * FROM albums`).all();
    const photos = await env.DB.prepare('SELECT * FROM photos').all();
    
    const albumsWithPhotos = albums.results.map(album => ({
      ...album,
      photos: photos.results
        .filter(photo => photo.album_id === album.id)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    }));

    return new Response(JSON.stringify(albumsWithPhotos), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    
    if (!name || !name.trim()) {
      return new Response(JSON.stringify({ error: '相册名称不能为空' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const albumResult = await env.DB.prepare(`
      INSERT INTO albums (name, description, created_at) 
      VALUES (?, ?, datetime('now'))
    `).bind(name.trim(), description?.trim() || '').run();
    
    const albumId = albumResult.meta.last_row_id;
    
    // 批量插入照片，支持排序顺序
    if (photos && Array.isArray(photos) && photos.length > 0) {
      const photoPromises = photos.map((photo, index) => 
        env.DB.prepare(`
          INSERT INTO photos (album_id, url, caption, sort_order, created_at) 
          VALUES (?, ?, ?, ?, datetime('now'))
        `).bind(
          albumId, 
          photo.url || photo, 
          photo.caption || '', 
          photo.sort_order !== undefined ? photo.sort_order : index
        ).run()
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
      photos: albumPhotos.results || []
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('创建相册失败:', error);
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
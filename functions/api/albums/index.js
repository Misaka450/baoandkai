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
    const formData = await request.formData();
    const file = formData.get('file');
    const description = formData.get('description') || '';
    
    if (!file) {
      return new Response(JSON.stringify({ error: '请选择要上传的图片' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: '请上传 JPG、PNG、WebP 或 GIF 格式的图片' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 验证文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ error: '图片大小不能超过 5MB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const key = `albums/${Date.now()}-${file.name}`;
    await env.IMAGES.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000'
      }
    });
    
    // 获取文件URL
    const url = `https://images.baoandkai.com/${key}`;
    
    const result = await env.DB.prepare(`
      INSERT INTO photos (url, description, created_at) 
      VALUES (?, ?, datetime('now'))
    `).bind(url, description).run();
    
    const newPhoto = await env.DB.prepare(`
      SELECT * FROM photos WHERE id = ?
    `).bind(result.meta.last_row_id).first();
    
    return new Response(JSON.stringify(newPhoto), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false,
      error: '上传失败',
      message: process.env.ENVIRONMENT === 'development' ? error.message : '图片上传失败，请重试'
    }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
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
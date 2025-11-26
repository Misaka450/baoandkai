// Cloudflare Pages Functions - 相册列表API (优化版)

export async function onRequestGet(context) {
  const { env } = context;

  try {
    // 使用LEFT JOIN一次性获取相册和照片数据,避免N+1查询
    const result = await env.DB.prepare(`
      SELECT 
        a.id as album_id,
        a.name as album_name,
        a.description as album_description,
        a.created_at as album_created_at,
        p.id as photo_id,
        p.url as photo_url,
        p.description as photo_description,
        p.sort_order,
        p.created_at as photo_created_at
      FROM albums a
      LEFT JOIN photos p ON a.id = p.album_id
      ORDER BY a.id, p.sort_order
    `).all();

    // 在应用层分组,构建相册和照片的关系
    const albumsMap = new Map();

    for (const row of result.results) {
      if (!albumsMap.has(row.album_id)) {
        albumsMap.set(row.album_id, {
          id: row.album_id,
          name: row.album_name,
          description: row.album_description,
          created_at: row.album_created_at,
          photos: []
        });
      }

      // 如果有照片数据,添加到相应相册
      if (row.photo_id) {
        albumsMap.get(row.album_id).photos.push({
          id: row.photo_id,
          url: row.photo_url,
          description: row.photo_description,
          sort_order: row.sort_order,
          created_at: row.photo_created_at
        });
      }
    }

    const albumsWithPhotos = Array.from(albumsMap.values());

    return new Response(JSON.stringify(albumsWithPhotos), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    console.error('Albums API Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: env?.ENVIRONMENT === 'development' ? error.message : '服务器内部错误,请稍后重试'
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
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
    console.error('Upload Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '上传失败',
      message: env?.ENVIRONMENT === 'development' ? error.message : '图片上传失败，请重试'
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
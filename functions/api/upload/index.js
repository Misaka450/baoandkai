// Cloudflare Pages Functions 上传处理
export async function onRequestPost(context) {
  const { request, env } = context;
  
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('file');
    const folder = formData.get('folder') || 'images';
    
    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: '没有上传文件' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const uploadedUrls = [];
    
    for (const file of files) {
      const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${file.name.split('.').pop()}`;
      
      await env.ouralbum.put(filename, file.stream(), {
        httpMetadata: {
          contentType: file.type,
          cacheControl: 'public, max-age=31536000',
        },
      });

      const url = `https://pub-f3abc7adae724902b344281ec73f700c.r2.dev/${filename}`;
      uploadedUrls.push(url);
    }

    return new Response(JSON.stringify({ 
      urls: uploadedUrls,
      count: uploadedUrls.length
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
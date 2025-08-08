// Cloudflare Pages Functions - R2图片删除API
export async function onRequestDelete(context) {
  const { request, env } = context;
  
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const { filename } = await request.json();
    
    if (!filename) {
      return new Response(JSON.stringify({ error: '缺少文件名' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 从R2存储桶中删除文件
    const bucket = env.ouralbum;
    
    if (!bucket) {
      console.error('R2存储桶未配置，可用绑定:', Object.keys(env));
      return new Response(JSON.stringify({ error: '存储服务未配置' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 删除文件
    await bucket.delete(filename);
    
    console.log('R2文件删除成功:', filename);

    return new Response(JSON.stringify({ success: true, message: '文件删除成功' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('R2文件删除失败:', error);
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
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
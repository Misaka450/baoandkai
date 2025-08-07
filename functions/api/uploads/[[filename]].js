// Cloudflare Pages Functions 图片访问处理
export async function onRequestGet(context) {
  const { request, env, params } = context;
  
  try {
    const filename = params.filename;
    
    if (!filename) {
      return new Response('未找到文件', { status: 404 });
    }

    const object = await env.ouralbum.get(filename);
    
    if (!object) {
      return new Response('文件不存在', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(object.body, {
      headers,
    });
  } catch (error) {
    return new Response('服务器错误', { status: 500 });
  }
}
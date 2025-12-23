// Cloudflare Pages Functions 图片访问处理
// 这个端点通常是公开的，不需要身份验证中间件的严格拦截，
// 但由于它是GET请求且不在publicPaths中（除非我们添加它），
// 中间件会拦截它。
// 考虑到这是直接访问图片，通常应该由R2直接服务或通过特定的公开路由。
// 如果这是通过API代理访问，我们需要确保它是公开的。
// 在 _middleware.js 中，我们应该将 /api/uploads/ 添加到 publicPaths，或者在这里处理。
// 既然这是一个 [[filename]].js，它可能被用作图片代理。

export async function onRequestGet(context) {
  const { env, params } = context;

  try {
    // 处理 catch-all 参数可能为数组的情况（多级路径如 albums/xxx.jpg）
    const filename = Array.isArray(params.filename)
      ? params.filename.join('/')
      : params.filename;

    if (!filename) {
      return new Response('未找到文件', { status: 404 });
    }

    // 从 R2 存储桶中获取文件
    const object = await env.IMAGES.get(filename);

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
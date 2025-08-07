// Cloudflare Pages 的 worker 文件
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // SPA 路由处理
    if (!url.pathname.startsWith('/assets') && !url.pathname.includes('.')) {
      return fetch(new URL('/index.html', request.url));
    }
    
    // 静态资源正常处理
    return fetch(request);
  }
};
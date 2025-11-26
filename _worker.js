// Cloudflare Pages 的 worker 文件
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // API 路由处理 - 转发到后端函数
    if (url.pathname.startsWith('/api/')) {
      return fetch(request);
    }
    
    // SPA 路由处理 - 非静态资源请求返回index.html
    if (!url.pathname.startsWith('/assets') && !url.pathname.includes('.')) {
      return fetch(new URL('/index.html', request.url));
    }
    
    // 静态资源正常处理
    return fetch(request);
  }
};
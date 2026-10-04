import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { errorResponse } from '../utils/response.js';
import { cache } from '../lib/cache.js';
import { getSessionByToken, updateSessionActivity } from '../lib/session.js';

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/check-token',
  '/api/config',
  '/api/images/',
  '/api/vault/export'
];

export interface CachedUser {
  id: number;
  username: string;
  email: string;
  sessionId: number;
  tokenExpires: string;
}

/**
 * 判断路径是否为公开路径（无需登录即可访问）
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path =>
    pathname === path || pathname.startsWith(path + '/') || (path.endsWith('/') && pathname.startsWith(path))
  );
}

export async function authMiddleware(c: Context, next: Next) {
  const url = new URL(c.req.url);
  const pathname = url.pathname;

  if (isPublicPath(pathname)) {
    return await next();
  }

  try {
    // 1. 获取 Token（优先 Cookie，其次 Authorization header）
    let token = getCookie(c, 'auth_token');
    if (!token) {
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return errorResponse('未授权访问', 401);
    }

    // 2. CSRF 验证（非 GET 请求）
    if (c.req.method !== 'GET') {
      const csrfFromHeader = c.req.header('X-CSRF-Token');
      const csrfFromCookie = getCookie(c, 'csrf_token');

      if (!csrfFromHeader || !csrfFromCookie || csrfFromHeader !== csrfFromCookie) {
        return errorResponse('CSRF验证失败', 403);
      }

      // 从缓存验证 CSRF 与 Token 的绑定关系；
      // 缓存未命中（如服务重启、LRU 淘汰）时回退查询 sessions 表并回填缓存，
      // 避免用户因缓存丢失而被误报 403 强制重新登录
      let storedCsrf = await cache.get<string>(`csrf:${token}`);
      if (!storedCsrf) {
        const sessionForCsrf = await getSessionByToken(token);
        if (sessionForCsrf?.csrfToken) {
          storedCsrf = sessionForCsrf.csrfToken;
          // 回填缓存，TTL 与 Session 剩余有效期对齐（7 天上限）
          const csrfTtl = Math.min(
            7 * 24 * 60 * 60,
            Math.floor((new Date(sessionForCsrf.tokenExpires).getTime() - Date.now()) / 1000)
          );
          if (csrfTtl > 0) {
            await cache.set(`csrf:${token}`, storedCsrf, csrfTtl);
          }
        }
      }
      if (!storedCsrf || storedCsrf !== csrfFromHeader) {
        return errorResponse('CSRF令牌不匹配', 403);
      }
    }

    // 3. 用户信息验证（带缓存）
    let user = await cache.get<CachedUser>(`token:${token}`);
    if (user) {
      if (new Date(user.tokenExpires) <= new Date()) {
        await cache.delete(`token:${token}`);
        user = null;
      }
    }

    if (!user) {
      // 回退数据库查询（通过 sessions 表，token_hash 使用 SHA-256）
      const sessionUser = await getSessionByToken(token);
      if (sessionUser) {
        user = {
          id: sessionUser.id,
          username: sessionUser.username,
          email: sessionUser.email,
          sessionId: sessionUser.sessionId,
          tokenExpires: sessionUser.tokenExpires,
        };

        // 写入缓存
        const ttl = Math.floor((new Date(sessionUser.tokenExpires).getTime() - Date.now()) / 1000);
        if (ttl > 0) {
          await cache.set(`token:${token}`, user, ttl);
        }

        // 异步更新 Session 最后活动时间
        updateSessionActivity(sessionUser.sessionId).catch(() => {});
      }
    }

    if (!user) {
      return errorResponse('Token无效或已过期', 401);
    }

    // 存储用户信息于 Hono Context 中，以备路由中使用
    c.set('user', user);

  } catch (err) {
    console.error('中间件认证错误:', err);
    const isDev = process.env.NODE_ENV !== 'production';
    const errorMessage = isDev ? (err instanceof Error ? err.message : String(err)) : '认证失败';
    return errorResponse('服务器内部错误: ' + errorMessage, 500);
  }

  await next();
}
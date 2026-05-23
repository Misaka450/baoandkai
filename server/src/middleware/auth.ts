import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { errorResponse } from '../utils/response.js';
import { cache } from '../lib/cache.js';
import { pool } from '../lib/db.js';

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/check-token',
  '/api/config',
  '/api/images/'
];

export interface CachedUser {
  id: number;
  username: string;
  email: string;
  token_expires: string;
}

export async function authMiddleware(c: Context, next: Next) {
  const url = new URL(c.req.url);
  const pathname = url.pathname;

  const isPublic = PUBLIC_PATHS.some(path => 
    pathname === path || pathname.startsWith(path + '/') || (path.endsWith('/') && pathname.startsWith(path))
  );

  if (isPublic) {
    return await next();
  }

  try {
    // 1. 获取 Token
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

      // 验证与认证 Token 的绑定
      const storedCsrf = await cache.get(`csrf:${token}`);
      if (storedCsrf !== csrfFromHeader) {
        return errorResponse('CSRF令牌不匹配', 403);
      }
    }

    // 3. 用户信息验证（带缓存）
    let user = await cache.get<CachedUser>(`token:${token}`);
    if (user) {
      if (new Date(user.token_expires) <= new Date()) {
        await cache.delete(`token:${token}`);
        await cache.delete(`csrf:${token}`);
        user = null;
      }
    }

    if (!user) {
      // 回退数据库查询
      const { rows } = await pool.query(
        'SELECT id, username, email, token_expires FROM users WHERE token = $1 AND token_expires > $2',
        [token, new Date().toISOString()]
      );
      const dbUser = rows[0];
      if (dbUser) {
        user = {
          id: dbUser.id,
          username: dbUser.username,
          email: dbUser.email,
          token_expires: dbUser.token_expires
        };
        const ttl = Math.floor((new Date(user.token_expires).getTime() - Date.now()) / 1000);
        if (ttl > 0) {
          await cache.set(`token:${token}`, user, ttl);
        }
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

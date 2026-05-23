import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { jsonResponse, errorResponse } from '../utils/response.js';
import { cache } from '../lib/cache.js';
import { pool } from '../lib/db.js';

const auth = new Hono();

// 登录速率限制配置
const RATE_LIMIT = {
  MAX_ATTEMPTS: 5,
  WINDOW_SECONDS: 300,
  LOCKOUT_SECONDS: 1800,
};

/**
 * 生成CSRF令牌（16字节随机hex字符串）
 */
function generateCsrfToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * 获取客户端标识（优先使用IP，回退到用户名）
 */
function getClientId(c: any, username: string): string {
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Real-IP') || '';
  return ip ? `login_rate:${ip}` : `login_rate:user:${username}`;
}

/**
 * 检查登录速率限制
 */
async function checkRateLimit(clientId: string): Promise<{
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}> {
  const record = await cache.get<{ attempts: number; lockedUntil?: string }>(clientId);

  if (record?.lockedUntil) {
    const lockedUntil = new Date(record.lockedUntil).getTime();
    if (Date.now() < lockedUntil) {
      const retryAfter = Math.ceil((lockedUntil - Date.now()) / 1000);
      return { allowed: false, remaining: 0, retryAfter };
    }
  }

  const attempts = record?.attempts || 0;
  const remaining = Math.max(0, RATE_LIMIT.MAX_ATTEMPTS - attempts);

  return { allowed: attempts < RATE_LIMIT.MAX_ATTEMPTS, remaining, retryAfter: 0 };
}

/**
 * 记录一次失败的登录尝试
 */
async function recordFailedAttempt(clientId: string): Promise<void> {
  const record = (await cache.get<{ attempts: number; lockedUntil?: string }>(clientId)) || { attempts: 0 };
  const attempts = record.attempts + 1;

  const data: { attempts: number; lockedUntil?: string } = { attempts };

  if (attempts >= RATE_LIMIT.MAX_ATTEMPTS) {
    data.lockedUntil = new Date(Date.now() + RATE_LIMIT.LOCKOUT_SECONDS * 1000).toISOString();
  }

  await cache.set(clientId, data, RATE_LIMIT.LOCKOUT_SECONDS);
}

/**
 * 登录成功后清除速率限制记录
 */
async function clearRateLimit(clientId: string): Promise<void> {
  await cache.delete(clientId);
}

async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error('密码验证错误:', error);
    return false;
  }
}

/**
 * GET /api/auth/check-token
 * 检查token有效性
 */
auth.get('/check-token', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonResponse({ valid: false, error: '未提供token' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return jsonResponse({ valid: false, error: '未提供token' });
    }

    // 查询数据库验证token
    const { rows } = await pool.query(
      `SELECT id, username, email, token_expires
       FROM users 
       WHERE token = $1 AND token_expires > NOW()`,
      [token]
    );
    const user = rows[0];

    if (user) {
      return jsonResponse({
        valid: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          token_expires: user.token_expires,
        },
      });
    }

    return jsonResponse({ valid: false, error: 'token无效或已过期' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器内部错误';
    console.error('Token验证失败:', message);
    return jsonResponse({ valid: false, error: '服务器内部错误' }, 500);
  }
});

/**
 * POST /api/auth/login
 * 登录API
 */
auth.post('/login', async (c) => {
  try {
    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return errorResponse('请求格式错误', 400, '请提供有效的JSON格式数据');
    }

    const { username, password } = body;

    if (!username || !password) {
      return errorResponse('用户名和密码不能为空', 400);
    }

    // 检查登录速率限制
    const clientId = getClientId(c, username);
    const rateCheck = await checkRateLimit(clientId);

    if (!rateCheck.allowed) {
      const minutes = Math.ceil(rateCheck.retryAfter / 60);
      return errorResponse(
        `登录尝试次数过多，请在 ${minutes} 分钟后重试`,
        429,
        `Too many login attempts. Retry after ${rateCheck.retryAfter}s`
      );
    }

    // 查询数据库中的用户
    const { rows } = await pool.query(
      `SELECT id, username, password_hash, email 
       FROM users 
       WHERE username = $1`,
      [username]
    );
    const user = rows[0];

    if (!user) {
      await recordFailedAttempt(clientId);
      console.error('用户不存在:', username);
      return errorResponse('用户名或密码错误', 401);
    }

    // 使用bcrypt验证密码
    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      await recordFailedAttempt(clientId);
      return errorResponse('用户名或密码错误', 401);
    }

    // 登录成功，清除速率限制
    await clearRateLimit(clientId);

    // 生成安全的随机token
    const token = crypto.randomUUID();
    // 生成CSRF令牌
    const csrfToken = generateCsrfToken();
    const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const maxAge = 7 * 24 * 60 * 60; // 7天，单位秒

    try {
      await pool.query(
        `UPDATE users 
         SET token = $1, token_expires = $2 
         WHERE id = $3`,
        [token, tokenExpires, user.id]
      );

      const cacheUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        token_expires: tokenExpires,
      };
      const ttl = 7 * 24 * 60 * 60;
      await cache.set(`token:${token}`, cacheUser, ttl);
      await cache.set(`csrf:${token}`, csrfToken, ttl);
    } catch (error) {
      console.error('更新token或写入缓存失败:', error);
    }

    // 构建响应（用 c.json 确保 setCookie 生效）
    const isSecure = c.req.header('X-Forwarded-Proto') === 'https';
    const cookieOpts = {
      maxAge,
      path: '/',
      httpOnly: true,
      sameSite: 'Strict' as const,
      secure: isSecure,
    };
    setCookie(c, 'auth_token', token, cookieOpts);
    setCookie(c, 'csrf_token', csrfToken, cookieOpts);

    return c.json({
      success: true,
      csrfToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: 'admin',
      },
    });
  } catch (error: any) {
    console.error('登录API错误:', error);
    return errorResponse('登录失败', 500, error.message);
  }
});

/**
 * POST /api/auth/update-password-hash
 * 更新密码哈希
 */
auth.post('/update-password-hash', async (c) => {
  try {
    const body = await c.req.json();
    const { username, newPassword, adminToken } = body;

    // 验证管理员token
    const serverAdminToken = process.env.ADMIN_TOKEN;
    if (!serverAdminToken || adminToken !== serverAdminToken) {
      return errorResponse('无权限执行此操作', 403);
    }

    if (!username || !newPassword) {
      return errorResponse('用户名和新密码不能为空', 400);
    }

    // 生成新的密码哈希
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // 更新数据库
    const { rowCount } = await pool.query(
      `UPDATE users 
       SET password_hash = $1 
       WHERE username = $2`,
      [newPasswordHash, username]
    );

    if (rowCount === 0) {
      return errorResponse('用户不存在', 404);
    }

    return jsonResponse({
      success: true,
      message: `用户 ${username} 的密码已更新`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error('更新密码错误:', message);
    return errorResponse('更新失败', 500);
  }
});

export default auth;

import { Hono } from 'hono';
import { setCookie, getCookie } from 'hono/cookie';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { jsonResponse, errorResponse } from '../utils/response.js';
import { cache } from '../lib/cache.js';
import { pool } from '../lib/db.js';
import { createSession, getSessionByToken, deleteSession, deleteUserSessions } from '../lib/session.js';

const auth = new Hono();

// 登录速率限制配置
const RATE_LIMIT = {
  MAX_ATTEMPTS: 5,
  WINDOW_SECONDS: 300,
  LOCKOUT_SECONDS: 1800,
};

/**
 * 获取客户端标识（优先使用IP，回退到用户名）
 *
 * 安全说明：只信任 Nginx 反向代理注入的 X-Real-IP（客户端无法伪造，
 * 因为 Nginx 会用真实客户端地址覆盖它）。
 * 不能信任 CF-Connecting-IP 等客户端可自行携带的请求头，
 * 否则攻击者每次换一个伪造 IP 即可绕过登录失败锁定。
 */
function getClientId(c: any, username: string): string {
  const ip = c.req.header('X-Real-IP') || '';
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
    // 优先从 HttpOnly Cookie 中取 token（浏览器请求会自动携带，前端 JS 无需读取），
    // 回退兼容旧的 Authorization: Bearer 方式
    let token = getCookie(c, 'auth_token');
    if (!token) {
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return jsonResponse({ valid: false, error: '未提供token' });
    }

    // 通过 sessions 表验证 token（使用 SHA-256 哈希查询）
    const sessionUser = await getSessionByToken(token);

    if (sessionUser) {
      return jsonResponse({
        valid: true,
        user: {
          id: sessionUser.id,
          username: sessionUser.username,
          email: sessionUser.email,
          token_expires: sessionUser.tokenExpires,
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

    // 创建 Session（token 通过 SHA-256 哈希后存储在 sessions 表）
    const session = await createSession(user.id);

    const cacheUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      sessionId: user.id, // 缓存中用 userId 标识
      tokenExpires: session.expiresAt.toISOString(),
    };
    const ttl = 7 * 24 * 60 * 60;
    await cache.set(`token:${session.token}`, cacheUser, ttl);
    await cache.set(`csrf:${session.token}`, session.csrfToken, ttl);

    // 设置 Cookie（auth_token 为 HttpOnly，csrf_token 可被前端读取）
    const maxAge = 7 * 24 * 60 * 60; // 7天，单位秒
    const isSecure = c.req.header('X-Forwarded-Proto') === 'https';
    setCookie(c, 'auth_token', session.token, {
      maxAge,
      path: '/',
      httpOnly: true,
      sameSite: 'Strict',
      secure: isSecure,
    });
    setCookie(c, 'csrf_token', session.csrfToken, {
      maxAge,
      path: '/',
      sameSite: 'Strict',
      secure: isSecure,
    });

    return c.json({
      success: true,
      csrfToken: session.csrfToken,
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
 * 常量时间字符串比较（防时序攻击）
 *
 * 原理：普通的 === / !== 比较在第一个不匹配的字符处就返回，
 * 攻击者可通过测量响应耗时差异逐字节猜出密钥。
 * 先把两侧都哈希成固定长度（隐藏真实长度差异），
 * 再用 crypto.timingSafeEqual 保证比较耗时恒定。
 */
function safeTokenCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/** 密码重置端点的限流配置：每 IP 10 分钟内最多 5 次尝试 */
const RESET_RATE_LIMIT = {
  MAX_ATTEMPTS: 5,
  WINDOW_SECONDS: 600,
};

async function checkResetRateLimit(clientId: string): Promise<boolean> {
  const record = await cache.get<{ attempts: number }>(`pwd_reset:${clientId}`);
  return (record?.attempts || 0) < RESET_RATE_LIMIT.MAX_ATTEMPTS;
}

async function recordResetAttempt(clientId: string): Promise<void> {
  const record = (await cache.get<{ attempts: number }>(`pwd_reset:${clientId}`)) || { attempts: 0 };
  await cache.set(`pwd_reset:${clientId}`, { attempts: record.attempts + 1 }, RESET_RATE_LIMIT.WINDOW_SECONDS);
}

/**
 * POST /api/auth/logout
 * 登出接口
 *
 * 安全意义：此前前端登出只删除浏览器 Cookie，服务端 Session 在数据库中
 * 仍然有效（最长 7 天），被盗取的 Cookie 依旧可以调用接口。
 * 现在登出时同步删除数据库中的 Session 记录与缓存，做到真正失效。
 * （本端点受全局 authMiddleware 保护：需有效登录态 + CSRF 校验）
 */
auth.post('/logout', async (c) => {
  try {
    // 从 Cookie 中取当前会话 Token（与登录时写入的键一致）
    const token = getCookie(c, 'auth_token');

    if (token) {
      // 1. 删除数据库中的 Session 记录（该 Token 立即失效）
      await deleteSession(token);
      // 2. 同步清理内存缓存中的会话与 CSRF 绑定关系
      await cache.delete(`token:${token}`);
      await cache.delete(`csrf:${token}`);
    }

    // 3. 让浏览器删除两个 Cookie（maxAge 设为 0 即立即过期）
    const isSecure = c.req.header('X-Forwarded-Proto') === 'https';
    setCookie(c, 'auth_token', '', { maxAge: 0, path: '/', httpOnly: true, sameSite: 'Strict', secure: isSecure });
    setCookie(c, 'csrf_token', '', { maxAge: 0, path: '/', sameSite: 'Strict', secure: isSecure });

    return jsonResponse({ success: true, message: '已安全登出' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error('登出接口错误:', message);
    return errorResponse('登出失败', 500);
  }
});

/**
 * POST /api/auth/update-password-hash
 * 更新密码哈希
 */
auth.post('/update-password-hash', async (c) => {
  try {
    // 限流：防止暴力枚举 ADMIN_TOKEN（按 IP 限流，未登录场景拿不到其他可靠标识）
    const resetClientId = c.req.header('X-Real-IP') || 'unknown';
    if (!(await checkResetRateLimit(resetClientId))) {
      return errorResponse('尝试次数过多，请稍后再试', 429);
    }

    const body = await c.req.json();
    const { username, newPassword, adminToken } = body;

    // 验证管理员token（常量时间比较，防时序攻击泄露）
    const serverAdminToken = process.env.ADMIN_TOKEN;
    if (!serverAdminToken || typeof adminToken !== 'string' || !safeTokenCompare(adminToken, serverAdminToken)) {
      // 记录一次失败尝试（无论令牌对错都计数，错误信息保持模糊）
      await recordResetAttempt(resetClientId);
      return errorResponse('无权限执行此操作', 403);
    }

    if (!username || !newPassword) {
      return errorResponse('用户名和新密码不能为空', 400);
    }

    // 生成新的密码哈希
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // 更新数据库（RETURNING id 顺带拿到用户 ID，用于下一步踢会话）
    const { rows } = await pool.query(
      `UPDATE users 
       SET password_hash = $1 
       WHERE username = $2
       RETURNING id`,
      [newPasswordHash, username]
    );

    if (rows.length === 0) {
      return errorResponse('用户不存在', 404);
    }

    // 安全措施：密码已变更，删除该用户的所有 Session，
    // 强制所有已登录设备重新用新密码登录（防止旧凭据继续有效）
    await deleteUserSessions(rows[0].id);

    return jsonResponse({
      success: true,
      message: `用户 ${username} 的密码已更新，所有登录会话已失效`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error('更新密码错误:', message);
    return errorResponse('更新失败', 500);
  }
});

export default auth;
import bcrypt from 'bcryptjs';
import { jsonResponse, errorResponse } from '../../utils/response';

export interface Env {
    DB: D1Database;
    KV?: KVNamespace;
    ALLOWED_ORIGINS?: string;
    ADMIN_TOKEN?: string;
    ENVIRONMENT?: string;
}

// 登录速率限制配置
const RATE_LIMIT = {
    MAX_ATTEMPTS: 5,          // 最大尝试次数
    WINDOW_SECONDS: 300,      // 时间窗口（5分钟）
    LOCKOUT_SECONDS: 1800,    // 封禁时长（30分钟）
}

/**
 * 获取客户端标识（优先使用IP，回退到用户名）
 */
function getClientId(request: Request, username: string): string {
    // Cloudflare 提供的 CF-Connecting-IP 头
    const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Real-IP') || ''
    return ip ? `login_rate:${ip}` : `login_rate:user:${username}`
}

/**
 * 检查登录速率限制
 * 返回 { allowed: boolean, remaining: number, retryAfter: number }
 */
async function checkRateLimit(kv: KVNamespace | undefined, clientId: string): Promise<{
    allowed: boolean
    remaining: number
    retryAfter: number
}> {
    if (!kv) {
        // KV 不可用时跳过速率限制
        return { allowed: true, remaining: RATE_LIMIT.MAX_ATTEMPTS, retryAfter: 0 }
    }

    const record = await kv.get<{ attempts: number; lockedUntil?: string }>(clientId, { type: 'json' })

    // 检查是否在封禁期
    if (record?.lockedUntil) {
        const lockedUntil = new Date(record.lockedUntil).getTime()
        if (Date.now() < lockedUntil) {
            const retryAfter = Math.ceil((lockedUntil - Date.now()) / 1000)
            return { allowed: false, remaining: 0, retryAfter }
        }
    }

    const attempts = record?.attempts || 0
    const remaining = Math.max(0, RATE_LIMIT.MAX_ATTEMPTS - attempts)

    return { allowed: attempts < RATE_LIMIT.MAX_ATTEMPTS, remaining, retryAfter: 0 }
}

/**
 * 记录一次失败的登录尝试
 */
async function recordFailedAttempt(kv: KVNamespace | undefined, clientId: string): Promise<void> {
    if (!kv) return

    const record = await kv.get<{ attempts: number; lockedUntil?: string }>(clientId, { type: 'json' }) || { attempts: 0 }
    const attempts = record.attempts + 1

    const data: { attempts: number; lockedUntil?: string } = { attempts }

    // 达到最大尝试次数，触发封禁
    if (attempts >= RATE_LIMIT.MAX_ATTEMPTS) {
        data.lockedUntil = new Date(Date.now() + RATE_LIMIT.LOCKOUT_SECONDS * 1000).toISOString()
    }

    await kv.put(clientId, JSON.stringify(data), { expirationTtl: RATE_LIMIT.LOCKOUT_SECONDS })
}

/**
 * 登录成功后清除速率限制记录
 */
async function clearRateLimit(kv: KVNamespace | undefined, clientId: string): Promise<void> {
    if (!kv) return
    await kv.delete(clientId)
}

async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
        return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
        console.error('密码验证错误:', error);
        return false;
    }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
    const { request, env } = context;

    try {
        let body: any;
        try {
            body = await request.json();
        } catch {
            return errorResponse('请求格式错误', 400, '请提供有效的JSON格式数据');
        }

        const { username, password } = body;

        if (!username || !password) {
            return errorResponse('用户名和密码不能为空', 400);
        }

        // 检查登录速率限制
        const clientId = getClientId(request, username)
        const rateCheck = await checkRateLimit(env.KV, clientId)

        if (!rateCheck.allowed) {
            const minutes = Math.ceil(rateCheck.retryAfter / 60)
            return errorResponse(
                `登录尝试次数过多，请在 ${minutes} 分钟后重试`,
                429,
                `Too many login attempts. Retry after ${rateCheck.retryAfter}s`
            )
        }

        // 查询数据库中的用户
        const user = await env.DB.prepare(`
            SELECT id, username, password_hash, email 
            FROM users 
            WHERE username = ?
        `).bind(username).first<{ id: number; username: string; password_hash: string; email: string }>();

        if (!user) {
            await recordFailedAttempt(env.KV, clientId)
            console.error('用户不存在:', username);
            return errorResponse('用户名或密码错误', 401);
        }

        // 使用bcrypt验证密码
        const isValidPassword = await verifyPassword(password, user.password_hash);

        if (!isValidPassword) {
            await recordFailedAttempt(env.KV, clientId)
            return errorResponse('用户名或密码错误', 401);
        }

        // 登录成功，清除速率限制
        await clearRateLimit(env.KV, clientId)

        // 生成安全的随机token（每次登录都生成唯一token）
        const token = crypto.randomUUID();
        const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        try {
            await env.DB.prepare(`
                UPDATE users 
                SET token = ?, token_expires = ? 
                WHERE id = ?
            `).bind(token, tokenExpires, user.id).run();

            if (env.KV) {
                const cacheUser = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    token_expires: tokenExpires
                };
                const ttl = 7 * 24 * 60 * 60;
                await env.KV.put(`token:${token}`, JSON.stringify(cacheUser), { expirationTtl: ttl });
            }
        } catch (error) {
            console.error('更新token或写入KV失败:', error);
        }

        return jsonResponse({
            success: true,
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: 'admin'
            }
        });

    } catch (error: any) {
        console.error('登录API错误:', error);
        return errorResponse('登录失败', 500, error.message);
    }
}

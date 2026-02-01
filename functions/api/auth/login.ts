// Cloudflare Pages Functions - 安全登录API
import bcrypt from 'bcryptjs';
import { jsonResponse, errorResponse } from '../../utils/response';

export interface Env {
    DB: D1Database;
    KV?: KVNamespace;
    ALLOWED_ORIGINS?: string;
    ADMIN_TOKEN?: string;
    ENVIRONMENT?: string;
}

/**
 * 真正的bcrypt密码验证
 */
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

    const origin = request.headers.get('Origin');
    const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',') : [];
    let corsOrigin = '*';
    if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes('*'))) {
        corsOrigin = origin;
    } else if (allowedOrigins.length > 0) {
        corsOrigin = allowedOrigins[0];
    }

    const corsHeaders = {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    try {
        let body: any;
        try {
            body = await request.json();
        } catch (e) {
            return errorResponse('请求格式错误', 400, '请提供有效的JSON格式数据');
        }

        const { username, password } = body;

        if (!username || !password) {
            return errorResponse('用户名和密码不能为空', 400);
        }

        // 查询数据库中的用户
        const user = await env.DB.prepare(`
      SELECT id, username, password_hash, email 
      FROM users 
      WHERE username = ?
    `).bind(username).first<{ id: number; username: string; password_hash: string; email: string }>();

        if (!user) {
            console.error('用户不存在:', username);
            return errorResponse('用户名或密码错误', 401);
        }

        // 使用bcrypt验证密码
        const isValidPassword = await verifyPassword(password, user.password_hash);

        if (!isValidPassword) {
            return errorResponse('用户名或密码错误', 401);
        }

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

export async function onRequestOptions(context: { request: Request; env: Env }) {
    const { request, env } = context;
    const origin = request.headers.get('Origin');
    const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',') : [];
    let corsOrigin = '*';
    if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes('*'))) {
        corsOrigin = origin;
    } else if (allowedOrigins.length > 0) {
        corsOrigin = allowedOrigins[0];
    }

    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': corsOrigin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        }
    });
}

// Cloudflare Pages Functions - 检查token有效性
import { jsonResponse } from '../../utils/response';

export interface Env {
    DB: D1Database;
    ENVIRONMENT?: string;
}

export async function onRequestGet(context: { request: Request; env: Env }) {
    const { request, env } = context;

    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return jsonResponse({ valid: false, error: '未提供token' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return jsonResponse({ valid: false, error: '未提供token' });
        }

        // 查询数据库验证token
        const user = await env.DB.prepare(`
            SELECT id, username, email, token_expires
            FROM users 
            WHERE token = ? AND token_expires > datetime('now')
        `).bind(token).first<{ id: number; username: string; email: string; token_expires: string }>();

        if (user) {
            return jsonResponse({
                valid: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    token_expires: user.token_expires
                }
            });
        }

        // Token无效或已过期，仅返回必要信息
        return jsonResponse({ valid: false, error: 'token无效或已过期' });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '服务器内部错误';
        console.error('Token验证失败:', message);
        return jsonResponse({ valid: false, error: '服务器内部错误' }, 500);
    }
}

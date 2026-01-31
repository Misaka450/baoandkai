// 密码哈希更新工具
// 用于更新数据库中的密码为bcrypt哈希
import bcrypt from 'bcryptjs';
import { jsonResponse, errorResponse } from '../../utils/response';

export interface Env {
  DB: D1Database;
  ADMIN_TOKEN: string;
}

/**
 * 生成bcrypt密码哈希
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Cloudflare Pages Function - 更新管理员密码哈希
 * POST /api/auth/update-password-hash
 */
export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const body: any = await request.json();
    const { username, newPassword, adminToken } = body;

    // 验证管理员token
    if (adminToken !== env.ADMIN_TOKEN) {
      return errorResponse('无权限执行此操作', 403);
    }

    if (!username || !newPassword) {
      return errorResponse('用户名和新密码不能为空', 400);
    }

    // 生成新的密码哈希
    const newPasswordHash = await hashPassword(newPassword);

    // 更新数据库
    const result = await env.DB.prepare(`
      UPDATE users 
      SET password_hash = ? 
      WHERE username = ?
    `).bind(newPasswordHash, username).run();

    if (result.meta.changes === 0) {
      return errorResponse('用户不存在', 404);
    }

    return jsonResponse({
      success: true,
      message: `用户 ${username} 的密码已更新`,
      passwordHash: newPasswordHash
    });

  } catch (error: any) {
    console.error('更新密码错误:', error);
    return errorResponse('更新失败', 500, error.message);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
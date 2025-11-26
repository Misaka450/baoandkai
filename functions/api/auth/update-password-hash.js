// 密码哈希更新工具
// 用于更新数据库中的密码为bcrypt哈希

import bcrypt from 'bcryptjs';

/**
 * 生成bcrypt密码哈希
 * @param {string} password - 明文密码
 * @returns {Promise<string>} bcrypt哈希值
 */
export async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Cloudflare Pages Function - 更新管理员密码哈希
 * GET /api/auth/update-password-hash
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { username, newPassword, adminToken } = body;

    // 验证管理员token
    if (adminToken !== env.ADMIN_TOKEN) {
      return new Response(JSON.stringify({
        success: false,
        error: '无权限执行此操作'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!username || !newPassword) {
      return new Response(JSON.stringify({
        success: false,
        error: '用户名和新密码不能为空'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
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
      return new Response(JSON.stringify({
        success: false,
        error: '用户不存在'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `用户 ${username} 的密码已更新`,
      passwordHash: newPasswordHash
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('更新密码错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '更新失败',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
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
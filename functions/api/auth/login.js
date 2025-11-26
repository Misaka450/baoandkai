// Cloudflare Pages Functions - 安全登录API
// 使用bcryptjs进行真正的密码哈希验证

import bcrypt from 'bcryptjs';
import { handleError, ErrorTypes } from '../../middleware/errorHandler.js';
import { CORS_HEADERS } from '../../middleware/cors.js';

/**
 * 真正的bcrypt密码验证
 * @param {string} plainPassword - 明文密码
 * @param {string} hashedPassword - bcrypt哈希密码
 * @returns {Promise<boolean>} 验证结果
 */
async function verifyPassword(plainPassword, hashedPassword) {
  try {
    // 使用bcryptjs进行真正的密码验证
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error('密码验证错误:', error);
    return false;
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // 处理OPTIONS预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 获取请求数据
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({
        error: '请求格式错误',
        details: '请提供有效的JSON格式数据'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const { username, password } = body;

    // 验证必填字段
    if (!username || !password) {
      return new Response(JSON.stringify({
        error: '用户名和密码不能为空'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // 查询数据库中的用户
    const user = await env.DB.prepare(`
      SELECT id, username, password_hash, email 
      FROM users 
      WHERE username = ?
    `).bind(username).first();

    if (!user) {
      return new Response(JSON.stringify({
        error: '用户名或密码错误'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // 使用bcrypt验证密码
    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      return new Response(JSON.stringify({
        error: '用户名或密码错误'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // 使用环境变量中的token或生成安全的随机token
    const token = env.ADMIN_TOKEN || crypto.randomUUID();

    // 更新用户的token和过期时间（设置为当前时间+7天）
    const tokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await env.DB.prepare(`
      UPDATE users 
      SET token = ?, token_expires = datetime(?) 
      WHERE id = ?
    `).bind(token, tokenExpires, user.id).run();

    // 返回成功响应
    return new Response(JSON.stringify({
      success: true,
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: 'admin'
      }
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('登录API错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '登录失败',
      message: process.env.ENVIRONMENT === 'development' ? error.message : '登录失败，请稍后重试'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 处理OPTIONS请求
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
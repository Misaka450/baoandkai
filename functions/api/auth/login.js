// Cloudflare Pages Functions - 安全登录API
// 使用bcryptjs进行真正的密码哈希验证

import bcrypt from 'bcryptjs';

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

  // CORS headers will be handled by middleware in most cases, 
  // but for safety in direct calls or specific environments:
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
    // 允许使用多个用户名登录
    const user = await env.DB.prepare(`
      SELECT id, username, password_hash, email 
      FROM users 
      WHERE username = ? OR username = ?
    `).bind(username, 'admin').first();

    if (!user) {
      console.error('用户不存在:', username);
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

    // 确保token_expires字段存在
    try {
      await env.DB.prepare(`
        UPDATE users 
        SET token = ?, token_expires = datetime(?) 
        WHERE id = ?
      `).bind(token, tokenExpires, user.id).run();

      // 4. 将用户信息缓存到 KV 中 (优化中间件验证性能)
      if (env.KV) {
        const cacheUser = {
          id: user.id,
          username: user.username,
          email: user.email,
          token_expires: tokenExpires
        };
        // KV 设置过期时间 (秒)
        const ttl = 7 * 24 * 60 * 60;
        await env.KV.put(`token:${token}`, JSON.stringify(cacheUser), { expirationTtl: ttl });
      }
    } catch (error) {
      console.error('更新token或写入KV失败:', error);
    }

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
      message: env?.ENVIRONMENT === 'development' ? error.message : '登录失败，请稍后重试'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// 处理OPTIONS请求
export async function onRequestOptions(context) {
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

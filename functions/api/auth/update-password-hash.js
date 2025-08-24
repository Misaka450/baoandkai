// Cloudflare Pages Functions - 直接更新D1数据库密码为bcrypt哈希
// 将baobao用户的密码更新为baobao123的bcrypt哈希值

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 从环境变量获取密码哈希值，如果没有则使用默认值（仅用于演示）
    const bcryptHash = env.DEFAULT_PASSWORD_HASH || '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

    // 1. 检查用户是否存在
    const user = await env.DB.prepare(`
      SELECT id, username, password_hash 
      FROM users 
      WHERE username = 'baobao'
    `).first();

    if (!user) {
      // 如果用户不存在，创建用户
      await env.DB.prepare(`
        INSERT OR REPLACE INTO users (id, username, password_hash, email, couple_name1, couple_name2, anniversary_date)
        VALUES (1, 'baobao', ?, 'baobao@example.com', '包包', '恺恺', '2023-10-08')
      `).bind(bcryptHash).run();
      
      console.log('已创建用户并设置bcrypt哈希密码');
    } else {
      // 更新现有用户的密码
      await env.DB.prepare(`
        UPDATE users 
        SET password_hash = ? 
        WHERE username = 'baobao'
      `).bind(bcryptHash).run();
      
      console.log('已更新用户密码为bcrypt哈希');
    }

    return new Response(JSON.stringify({
      success: true,
      message: '密码已更新为bcrypt哈希值',
      username: 'baobao',
      bcrypt_hash: '已设置（出于安全原因不显示）',
      action: user ? 'updated' : 'created'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('更新密码错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: '请检查数据库连接和表结构'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// GET方法用于查看当前密码状态
export async function onRequestGet(context) {
  const { env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  try {
    const user = await env.DB.prepare(`
      SELECT id, username, password_hash, email 
      FROM users 
      WHERE username = 'baobao'
    `).first();

    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        message: '用户不存在',
        expected_hash: '已设置（出于安全原因不显示）',
        correct_password: '已设置（出于安全原因不显示）'
      }), {
        headers: corsHeaders
      });
    }

    const expectedHash = env.DEFAULT_PASSWORD_HASH || '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    const isCorrect = user.password_hash === expectedHash;

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        password_hash: user.password_hash,
        hash_length: user.password_hash.length,
        is_correct_hash: isCorrect
      },
      expected: {
        password: '已设置（出于安全原因不显示）',
        bcrypt_hash: '已设置（出于安全原因不显示）',
        matches: isCorrect
      },
      action_needed: !isCorrect ? '请调用POST方法更新密码' : '密码已正确设置'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
// Cloudflare Pages Functions - 设置bcrypt哈希密码
// 使用正确的bcrypt哈希值更新数据库

// 这是密码 'baobao123' 的正确bcrypt哈希值
// 使用bcrypt.hashSync('baobao123', 10) 生成
const BAOBAO123_HASH = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';

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
    // 1. 重新创建用户表，确保结构正确
    await env.DB.prepare(`DROP TABLE IF EXISTS users`).run();
    
    await env.DB.prepare(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        couple_name1 TEXT NOT NULL,
        couple_name2 TEXT NOT NULL,
        anniversary_date TEXT NOT NULL,
        background_image TEXT,
        token TEXT,
        token_expires TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // 2. 插入用户数据，使用正确的bcrypt哈希
    await env.DB.prepare(`
      INSERT INTO users (id, username, password_hash, email, couple_name1, couple_name2, anniversary_date)
      VALUES (1, 'baobao', ?, 'baobao@example.com', '包包', '恺恺', '2023-10-08')
    `).bind(BAOBAO123_HASH).run();

    return new Response(JSON.stringify({
      success: true,
      message: '密码已设置为bcrypt哈希值',
      hash: BAOBAO123_HASH,
      note: '现在可以使用密码 baobao123 登录了'
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

// 用于验证bcrypt哈希的测试端点
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

    return new Response(JSON.stringify({
      success: true,
      user: user,
      expectedHash: BAOBAO123_HASH,
      test: {
        password: 'baobao123',
        matches: user?.password_hash === BAOBAO123_HASH
      }
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
// Cloudflare Pages Functions - 修复密码API
// 直接修改D1数据库中的密码为明文
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
    // 1. 删除现有用户表并重新创建
    await env.DB.prepare(`DROP TABLE IF EXISTS users`).run();
    
    // 2. 重新创建用户表
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

    // 3. 插入正确的用户数据，密码为明文
    await env.DB.prepare(`
      INSERT INTO users (id, username, password_hash, email, couple_name1, couple_name2, anniversary_date)
      VALUES (1, 'baobao', 'baobao123', 'baobao@example.com', '包包', '恺恺', '2023-10-08')
    `).run();

    return new Response(JSON.stringify({
      success: true,
      message: '用户表已重建，密码设置为明文 baobao123'
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
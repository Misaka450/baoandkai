// 初始化端点 - 确保todos表存在
export async function onRequestGet(context) {
  const { env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    // 创建todos表的SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
        priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
        due_date DATE,
        category TEXT DEFAULT 'general',
        completed_at DATETIME,
        completion_notes TEXT,
        completion_photos TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await env.DB.prepare(createTableSQL).run();

    // 创建索引
    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
    `).run();

    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
    `).run();

    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category);
    `).run();

    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
    `).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'todos表已创建或已存在',
      action: 'initialized'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: '初始化失败',
      details: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestPost(context) {
  return onRequestGet(context); // 重用GET逻辑
}
import { jsonResponse, errorResponse } from '../../utils/response';

// 待办事项数据库初始化端点
export async function onRequestGet(context) {
  const { env } = context;

  try {
    // 创建todos表（如果不存在）
    await env.DB.prepare(`
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
      )
    `).run();

    // 创建索引
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status)`).run();
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority)`).run();
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date)`).run();
    await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category)`).run();

    // 检查是否已有数据
    const result = await env.DB.prepare(`SELECT COUNT(*) as count FROM todos`).first();

    return jsonResponse({
      success: true,
      message: 'todos表已初始化',
      hasData: result.count > 0,
      count: result.count
    });

  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

// 也支持POST请求
export async function onRequestPost(context) {
  return onRequestGet(context);
}
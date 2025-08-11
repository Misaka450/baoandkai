-- 情侣待办事项表
CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,                    -- 待办事项标题
    description TEXT,                       -- 详细描述
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),  -- 状态：待办/已完成/已取消
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),  -- 优先级 1-5
    due_date DATE,                          -- 截止日期
    category TEXT DEFAULT 'general',        -- 分类
    completed_at DATETIME,                  -- 完成时间
    completion_notes TEXT,                  -- 完成备注
    completion_photos TEXT,                -- 完成照片（JSON数组）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category);
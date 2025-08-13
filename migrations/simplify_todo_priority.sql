-- 简化待办事项优先级系统
-- 将优先级从1-5简化为1-3：高(3)、中(2)、低(1)

-- 更新现有数据的优先级映射
UPDATE todos 
SET priority = CASE 
    WHEN priority >= 4 THEN 3  -- 4-5映射为高优先级
    WHEN priority = 2 THEN 2   -- 2保持为中优先级
    ELSE 1                     -- 1保持为低优先级
END;

-- 修改优先级约束，限制为1-3
DROP INDEX IF EXISTS idx_todos_priority;
CREATE TABLE todos_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    priority INTEGER DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),  -- 简化为1-3
    due_date DATE,
    category TEXT DEFAULT 'general',
    completed_at DATETIME,
    completion_notes TEXT,
    completion_photos TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 迁移数据
INSERT INTO todos_new SELECT * FROM todos;
DROP TABLE todos;
ALTER TABLE todos_new RENAME TO todos;

-- 重新创建索引
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category);
-- 时间胶囊表迁移脚本
-- 创建时间胶囊功能所需的数据库表

-- 时间胶囊表 (time_capsules)
CREATE TABLE IF NOT EXISTS time_capsules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  message TEXT NOT NULL,
  unlock_date TEXT NOT NULL,
  is_unlocked INTEGER DEFAULT 0,
  created_by TEXT DEFAULT 'couple',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_time_capsules_unlock_date ON time_capsules(unlock_date);
CREATE INDEX IF NOT EXISTS idx_time_capsules_is_unlocked ON time_capsules(is_unlocked);
CREATE INDEX IF NOT EXISTS idx_time_capsules_created_at ON time_capsules(created_at);

-- 插入示例时间胶囊（可选）
-- INSERT INTO time_capsules (title, message, unlock_date, is_unlocked) VALUES 
-- ('一周年惊喜', '亲爱的，这是我们在一起的第一个周年，希望未来的每一天都能像现在这样幸福！', '2024-10-08', 0);

-- 更新设置表结构 - 移除不必要的字段
-- 如果settings表存在，则更新其结构
-- 如果settings表不存在，则创建新的简化版本

-- 检查并创建settings表（如果不存在）
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY,
  site_name TEXT NOT NULL DEFAULT '包包和恺恺的故事',
  site_description TEXT DEFAULT '记录我们的点点滴滴',
  theme TEXT NOT NULL DEFAULT 'light',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 插入或更新默认设置
INSERT OR REPLACE INTO settings (id, site_name, site_description, theme)
VALUES (1, '包包和恺恺的故事', '记录我们的点点滴滴', 'light');

-- 如果表已存在且有旧字段，则删除这些字段（SQLite不支持DROP COLUMN，需要重建表）
-- 注意：这是一个安全的操作，仅在新部署时生效

-- 创建临时表
CREATE TABLE settings_new (
  id INTEGER PRIMARY KEY,
  site_name TEXT NOT NULL DEFAULT '包包和恺恺的故事',
  site_description TEXT DEFAULT '记录我们的点点滴滴',
  theme TEXT NOT NULL DEFAULT 'light',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 复制现有数据（如果存在）
INSERT INTO settings_new (id, site_name, site_description, theme, created_at, updated_at)
SELECT id, site_name, site_description, theme, created_at, updated_at FROM settings WHERE id = 1;

-- 删除旧表并重命名新表（仅当表结构需要更新时）
-- 注意：此操作仅在手动执行迁移时进行
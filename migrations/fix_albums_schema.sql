-- 修复相册表结构，添加缺失的字段
-- 这个脚本用于修复现有的albums表，添加created_at字段

-- 检查albums表是否缺少created_at字段
-- 如果表已存在但没有created_at字段，则添加

-- 添加created_at字段到albums表（如果不存在）
ALTER TABLE albums ADD COLUMN IF NOT EXISTS created_at TEXT DEFAULT CURRENT_TIMESTAMP;

-- 添加updated_at字段到albums表（如果不存在）  
ALTER TABLE albums ADD COLUMN IF NOT EXISTS updated_at TEXT DEFAULT CURRENT_TIMESTAMP;

-- 添加created_at字段到photos表（如果不存在）
ALTER TABLE photos ADD COLUMN IF NOT EXISTS created_at TEXT DEFAULT CURRENT_TIMESTAMP;

-- 更新现有记录的created_at字段（如果为空）
UPDATE albums SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE albums SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
UPDATE photos SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;

-- 重新创建索引
CREATE INDEX IF NOT EXISTS idx_albums_created ON albums(created_at);
CREATE INDEX IF NOT EXISTS idx_photos_created ON photos(created_at);
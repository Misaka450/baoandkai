-- =====================================================
-- 003_cleanup.sql — 数据库冗余结构清理
--
-- 适用对象：已经按旧版 001_init.sql 初始化过的数据库。
-- 全新数据库执行 001 + 002 后无需运行本脚本。
--
-- 内容：
--   1. 删除从未被业务使用的 images 多态图片表
--   2. 删除 users 表中被 sessions 表取代的旧认证字段与索引
--   3. 删除 users 表中未被代码引用的 background_image 字段
--
-- ⚠️ 执行前建议备份：
--   docker exec bbkk-db pg_dump -U bbkk bbkk > backup_before_cleanup.sql
-- =====================================================

-- 1. 删除废弃的图片关联表（代码零引用，删表无数据损失风险）
DROP TABLE IF EXISTS images;

-- 2. 清理 users 表的旧认证残留（会话统一由 sessions 表管理）
DROP INDEX IF EXISTS idx_users_token;
ALTER TABLE users DROP COLUMN IF EXISTS token;
ALTER TABLE users DROP COLUMN IF EXISTS token_expires;

-- 3. 清理 users 表未使用的背景图字段（config 接口白名单从未包含它）
ALTER TABLE users DROP COLUMN IF EXISTS background_image;

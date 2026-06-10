-- =====================================================
-- 包包和恺恺的小窝 - Session 管理
-- 版本: 2.1.0
-- =====================================================

-- -------------------------------------------------------
-- 2. Session 表（替代 users.token 字段）
-- 支持多设备登录、单个 Session 吊销、安全哈希存储
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,          -- SHA-256(token)，避免明文存储
  csrf_token VARCHAR(64) NOT NULL,           -- CSRF 保护令牌
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,      -- 过期时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- -------------------------------------------------------
-- 3. 自动清理过期 Session 的函数
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sessions WHERE expires_at <= NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- 可选：迁移现有 users.token 到 sessions 表（如有数据）
-- 注意：旧 token 未使用 SHA-256 哈希，迁移后保持原样但标记为已迁移
-- 后续可通过登录自动刷新为新方案
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT id, token, token_expires FROM users
    WHERE token IS NOT NULL AND token_expires > NOW()
  LOOP
    -- 插入旧 token 到 sessions 表（token_hash 存储原始 token，兼容旧会话）
    INSERT INTO sessions (user_id, token_hash, csrf_token, expires_at)
    VALUES (
      user_record.id,
      user_record.token,
      'migrated',
      user_record.token_expires
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
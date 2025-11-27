# 修复生产数据库 - Albums表缺少created_at列

## 问题
D1数据库ID: `5867481e-ae09-485a-b866-0f453a6e0131`
错误: `no such column: created_at`

## 解决方案
执行 `fix_albums_schema.sql` 迁移脚本

## Wrangler命令

```bash
# 方法1: 使用wrangler执行SQL文件
npx wrangler d1 execute bbkk-db --remote --file=./migrations/fix_albums_schema.sql

# 方法2: 直接执行SQL命令
npx wrangler d1 execute bbkk-db --remote --command="ALTER TABLE albums ADD COLUMN IF NOT EXISTS created_at TEXT DEFAULT CURRENT_TIMESTAMP; ALTER TABLE albums ADD COLUMN IF NOT EXISTS updated_at TEXT DEFAULT CURRENT_TIMESTAMP; ALTER TABLE photos ADD COLUMN IF NOT EXISTS created_at TEXT DEFAULT CURRENT_TIMESTAMP; UPDATE albums SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL; UPDATE albums SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL; UPDATE photos SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL; CREATE INDEX IF NOT EXISTS idx_albums_created ON albums(created_at); CREATE INDEX IF NOT EXISTS idx_photos_created ON photos(created_at);"
```

## 验证
执行后访问相册页面,应该可以正常加载数据。

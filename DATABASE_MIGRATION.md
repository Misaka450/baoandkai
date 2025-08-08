# 数据库迁移指南

## 问题分析

当前相册功能出现500错误的原因是：
1. **albums表缺少created_at字段**
2. **photos表缺少created_at字段**
3. **数据库表结构与API代码不匹配**

## 修复步骤

### 1. 立即修复（开发环境）

运行以下命令修复数据库表结构：

```bash
# 更新开发数据库
wrangler d1 execute couple-moments-dev-db --file=migrations/fix_albums_schema.sql --env development

# 更新生产数据库  
wrangler d1 execute couple-moments-db --file=migrations/fix_albums_schema.sql --env production
```

### 2. 验证修复

修复后访问以下URL验证：
- https://baoandkai.pages.dev/api/albums/debug
- 应该不再显示"no such column: created_at"错误

### 3. 完整数据库初始化

如果是新部署，使用完整设置：

```bash
# 重新初始化数据库
wrangler d1 execute couple-moments-db --file=migrations/complete_setup.sql --env production
```

## 数据库结构确认

修复后的表结构：

### albums表
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- name: TEXT NOT NULL
- description: TEXT
- cover_image: TEXT
- created_at: TEXT DEFAULT CURRENT_TIMESTAMP
- updated_at: TEXT DEFAULT CURRENT_TIMESTAMP

### photos表
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- album_id: INTEGER NOT NULL
- url: TEXT NOT NULL
- caption: TEXT
- date: TEXT
- location: TEXT
- created_at: TEXT DEFAULT CURRENT_TIMESTAMP

## 常见错误处理

如果遇到以下错误：

### 1. 表已存在但缺少字段
```sql
-- 手动添加字段
ALTER TABLE albums ADD COLUMN IF NOT EXISTS created_at TEXT DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE albums ADD COLUMN IF NOT EXISTS updated_at TEXT DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS created_at TEXT DEFAULT CURRENT_TIMESTAMP;
```

### 2. 数据迁移
如果已有数据需要迁移：
```sql
-- 更新现有记录的创建时间
UPDATE albums SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE albums SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
UPDATE photos SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
```

## 验证API端点

修复后测试以下API端点：
- GET /api/albums - 获取相册列表
- POST /api/albums - 创建新相册
- PUT /api/albums/:id - 更新相册
- DELETE /api/albums/:id - 删除相册

## 部署说明

修复完成后：
1. 推送代码到GitHub
2. Cloudflare Pages会自动重新部署
3. 部署完成后验证功能正常
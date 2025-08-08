# 移除日记表数据库迁移指南

日记管理功能已经从代码中移除，但数据库中的日记表(diaries)仍然存在。

## 如果需要清理数据库中的日记表，请执行以下命令：

### 1. 本地测试环境
```bash
npx wrangler d1 execute oursql --command="DROP TABLE IF EXISTS diaries" --local
```

### 2. 生产环境
```bash
npx wrangler d1 execute oursql --command="DROP TABLE IF EXISTS diaries" --remote
```

### 3. 验证删除
```bash
# 检查表是否还存在
npx wrangler d1 execute oursql --command="SELECT name FROM sqlite_master WHERE type='table' AND name='diaries'" --remote
```

## 注意事项
- 删除表将永久删除所有日记数据，请确保已备份重要数据
- 如果表不存在，DROP TABLE命令会静默成功
- 建议在执行前使用 `/api/debug/database` API 检查当前数据库状态
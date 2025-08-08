# 部署检查清单

## 数据库设置

### 1. 检查D1数据库是否存在
```bash
npx wrangler d1 list
```

### 2. 创建数据库（如果不存在）
```bash
npx wrangler d1 create oursql
```

### 3. 初始化数据库表
```bash
# 初始化基础表
npx wrangler d1 execute oursql --file=./migrations/init.sql --remote

# 添加碎碎念功能
npx wrangler d1 execute oursql --file=./migrations/add_notes.sql --remote

# 或者使用完整设置
npx wrangler d1 execute oursql --file=./migrations/complete_setup.sql --remote
```

### 4. 验证数据库绑定
在Cloudflare控制台中检查：
- Pages项目 → 设置 → 函数 → D1数据库绑定
- 确保数据库名称和ID匹配wrangler.toml

## 常见错误解决

### 错误：D1_ERROR: not authorized: SQLITE_AUTH
**原因**：数据库未正确绑定到Pages
**解决**：
1. 登录Cloudflare控制台
2. 选择D1数据库
3. 确保数据库已绑定到baoandkai Pages项目

### 错误：table not found
**原因**：数据库表未创建
**解决**：运行上述数据库初始化命令

## 调试步骤

1. **测试数据库连接**
   ```
   GET /api/debug/simple
   ```

2. **查看表结构**
   ```
   GET /api/debug/database
   ```

3. **检查具体API**
   ```
   GET /api/notes
   GET /api/food
   ```

## 验证部署

部署后访问：
- https://baoandkai.pages.dev/api/debug/simple
- https://baoandkai.pages.dev/api/notes

如果返回数据，说明数据库已正确配置。
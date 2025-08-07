# Cloudflare D1 数据库设置指南

## 概述

本项目已经集成了Cloudflare D1数据库，用于替代原来的localStorage数据存储。所有数据现在都会持久化存储在Cloudflare D1数据库中。

## 数据库表结构

项目使用以下数据库表：

### 1. 相册 (albums)
- `id`: 主键，自增
- `name`: 相册名称
- `description`: 相册描述
- `images`: 图片URL列表（逗号分隔）
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 2. 日记 (diaries)
- `id`: 主键，自增
- `title`: 日记标题
- `content`: 日记内容
- `date`: 日期
- `mood`: 心情
- `weather`: 天气
- `images`: 图片URL列表（逗号分隔）
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 3. 时间轴事件 (timeline_events)
- `id`: 主键，自增
- `title`: 事件标题
- `description`: 事件描述
- `date`: 日期
- `location`: 地点
- `category`: 分类
- `images`: 图片URL列表（逗号分隔）
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 4. 美食记录 (food_records)
- `id`: 主键，自增
- `name`: 美食名称
- `description`: 描述
- `date`: 日期
- `location`: 地点
- `rating`: 评分 (1-5)
- `images`: 图片URL列表（逗号分隔）
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 5. 网站设置 (settings)
- `id`: 主键，固定为1
- `site_name`: 网站名称
- `site_description`: 网站描述
- `theme`: 主题 (light/dark)
- `enable_comments`: 是否启用评论
- `enable_share`: 是否启用分享
- `enable_timeline`: 是否启用时间轴
- `enable_albums`: 是否启用相册
- `enable_diary`: 是否启用日记
- `enable_food`: 是否启用美食
- `created_at`: 创建时间
- `updated_at`: 更新时间

## 设置步骤

### 1. 创建D1数据库

在Cloudflare Dashboard中：
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 选择你的账户和Workers & Pages
3. 点击"D1"选项卡
4. 点击"创建数据库"
5. 输入数据库名称：`couple-moments-db`（生产环境）或 `couple-moments-dev-db`（开发环境）
6. 点击"创建"

### 2. 获取数据库ID

创建数据库后，在D1数据库详情页面找到数据库ID，格式类似于：`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### 3. 更新wrangler.toml

将`wrangler.toml`文件中的`database_id`替换为你的实际数据库ID：

```toml
[[env.production.d1_databases]]
binding = "DB"
database_name = "couple-moments-db"
database_id = "你的实际数据库ID"

[[env.development.d1_databases]]
binding = "DB"
database_name = "couple-moments-dev-db"
database_id = "你的开发数据库ID"
```

### 4. 初始化数据库

运行以下命令创建数据库表：

```bash
# 安装Wrangler CLI（如果尚未安装）
npm install -g wrangler

# 登录Cloudflare
wrangler login

# 创建数据库表
wrangler d1 execute couple-moments-db --file=migrations/init.sql --env production
wrangler d1 execute couple-moments-dev-db --file=migrations/init.sql --env development
```

### 5. 部署应用

```bash
# 构建项目
npm run build

# 部署到Cloudflare Pages
npm run deploy
```

## 开发环境

在本地开发时，可以使用Wrangler的本地开发模式：

```bash
# 启动本地开发服务器
wrangler pages dev dist --env development
```

## API端点

项目提供了以下API端点：

### 相册
- `GET /api/albums` - 获取所有相册
- `POST /api/albums` - 创建新相册
- `PUT /api/albums/:id` - 更新相册
- `DELETE /api/albums/:id` - 删除相册

### 日记
- `GET /api/diaries` - 获取所有日记
- `POST /api/diaries` - 创建新日记
- `PUT /api/diaries/:id` - 更新日记
- `DELETE /api/diaries/:id` - 删除日记

### 时间轴
- `GET /api/timeline` - 获取所有时间轴事件
- `POST /api/timeline` - 创建新事件
- `PUT /api/timeline/:id` - 更新事件
- `DELETE /api/timeline/:id` - 删除事件

### 美食
- `GET /api/food` - 获取所有美食记录
- `POST /api/food` - 创建新记录
- `PUT /api/food/:id` - 更新记录
- `DELETE /api/food/:id` - 删除记录

### 设置
- `GET /api/settings` - 获取网站设置
- `PUT /api/settings` - 更新网站设置

## 数据迁移

如果你之前使用了localStorage存储数据，可以手动迁移数据：

1. 在浏览器控制台中导出localStorage数据：
```javascript
// 导出数据
const data = {
  albums: JSON.parse(localStorage.getItem('albums') || '[]'),
  diaries: JSON.parse(localStorage.getItem('diaries') || '[]'),
  timelineEvents: JSON.parse(localStorage.getItem('timelineEvents') || '[]'),
  foodRecords: JSON.parse(localStorage.getItem('foodRecords') || '[]'),
  settings: JSON.parse(localStorage.getItem('settings') || '{}')
};
console.log(JSON.stringify(data, null, 2));
```

2. 使用API导入数据到D1数据库

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查`wrangler.toml`中的数据库ID是否正确
   - 确保数据库已创建且名称匹配

2. **表不存在错误**
   - 运行初始化脚本：`wrangler d1 execute [数据库名] --file=migrations/init.sql`

3. **跨域请求错误**
   - API端点已配置CORS，确保域名正确

### 调试

使用以下命令查看数据库内容：
```bash
# 查看相册表
wrangler d1 execute couple-moments-db --command="SELECT * FROM albums"

# 查看日记表
wrangler d1 execute couple-moments-db --command="SELECT * FROM diaries"
```
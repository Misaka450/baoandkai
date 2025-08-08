# 包&恺情侣空间网站 - 初始版本

一个专为情侣打造的回忆记录平台，记录你们在一起的每一个美好瞬间。

## 功能特色

- **爱情计时器**：实时显示在一起的时间，精确到秒
- **时间轴**：按时间倒序展示重要事件和回忆
- **相册管理**：创建多个相册，上传和管理美好照片
- ~~**心情日记**：记录每天的心情和故事~~（已移除）
- **美食打卡**：记录一起品尝的美食和餐厅评价
- **后台管理**：轻松管理所有内容和设置

## 技术栈

- **前端**：React + Vite + Tailwind CSS
- **后端**：Cloudflare Workers
- **数据库**：Cloudflare D1 (SQLite)
- **文件存储**：Cloudflare R2
- **部署**：Cloudflare Pages

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 本地开发

```bash
npm run dev
```

### 3. 构建项目

```bash
npm run build
```

### 4. 部署到Cloudflare

#### 4.1 配置Cloudflare资源

1. 创建D1数据库：
```bash
wrangler d1 create couple-moments-db
```

2. 创建R2存储桶：
```bash
wrangler r2 bucket create couple-moments-images
```

3. 更新`wrangler.toml`中的数据库和存储桶ID

#### 4.2 初始化数据库

```bash
wrangler d1 execute couple-moments-db --file=./migrations/init.sql
```

#### 4.3 部署Workers

```bash
wrangler deploy
```

#### 4.4 部署Pages

```bash
npm run build
wrangler pages deploy dist
```

## 项目结构

```
couple-moments/
├── src/
│   ├── components/     # 公共组件
│   ├── contexts/      # React上下文
│   ├── hooks/         # 自定义Hook
│   ├── pages/         # 页面组件
│   │   └── admin/     # 后台管理页面
│   ├── workers/       # Cloudflare Workers
│   └── index.css      # 全局样式
├── migrations/        # 数据库迁移脚本
├── public/           # 静态资源
├── wrangler.toml     # Cloudflare配置
└── package.json
```

## 环境变量

在`wrangler.toml`中配置：

- `DATABASE_ID`: D1数据库ID
- `BUCKET_NAME`: R2存储桶名称

## 默认管理员账号

- 用户名：admin
- 密码：admin123

## 功能模块

### 1. 首页 - 爱情计时器
- 实时显示在一起的时间
- 可自定义纪念日
- 支持背景图片上传

### 2. 时间轴
- 按时间倒序展示事件
- 支持分类筛选（约会/旅行/节日/日常）
- 每个事件包含标题、日期、地点、描述和图片

### 3. 相册
- 创建多个相册
- 支持图片上传和管理
- 幻灯片播放功能

### 4. ~~日记~~（已移除）
~~- 记录心情和故事~~
~~- 支持心情标签和天气选择~~
~~- 可添加配图~~

### 5. 美食打卡
- 记录餐厅信息
- 多维度评分（口味/环境/服务）
- 支持图片和评价

## 开发指南

### 添加新功能

1. 在`src/pages/`下创建新页面组件
2. 在`src/workers/index.js`中添加对应API
3. 更新路由配置

### 数据库变更

1. 在`migrations/`中添加新的SQL文件
2. 使用`wrangler d1 execute`执行迁移

## 注意事项

- 首次部署后需要初始化数据库
- 图片上传需要配置R2存储桶权限
- 生产环境请修改默认管理员密码

## 许可证

MIT License
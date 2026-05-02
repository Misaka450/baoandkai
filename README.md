# 包包和恺恺的小窝 💕

一个充满爱意且功能强大的温馨小窝，专为记录包包和恺恺的每一份美好记忆而打造。

本项目采用 **Cloudflare 全栈无服务器架构**，无需维护传统服务器，具备极高的访问速度和低廉的运营成本。

---

## ✨ 核心功能

- 🏠 **智慧首页** - 动态展示情侣信息与纪念日倒计，支持极致个性化的背景定制
- 📸 **高清相册** - 沉浸式照片墙，支持批量上传、智能压缩及流畅的拖拽排序
- 📝 **心动碎碎念** - 随时随地记录生活点滴，支持精美便签样式展示
- 🍜 **美食足迹** - 记录共同品味的人间烟火，包含评分、定位及照片
- 🗺️ **足迹地图** - 可视化中国地图，支持省市级下钻，热力图展示旅行轨迹
- 📅 **时光轴** - 以时间为序梳理重要里程碑，铭记每一个高光时刻
- ⏳ **时光胶囊** - 封存美好瞬间，在约定时间开启的惊喜
- ✅ **甜蜜清单** - 共同完成的生活目标，带状态追踪与精美完成动画
- 📊 **数据统计** - 后台数据总览，活跃度趋势、分类分布等多维度分析
- 👨‍💻 **全能后台** - 一站式内容管控中心，支持实时数据预览与系统全局配置
- 🎨 **极致适配** - 完美适配从手机到 4K 巨屏的各终端设备，提供丝滑的操作体验

---

## 🚀 核心技术栈

| 分类 | 技术选型 | 说明 |
|------|----------|------|
| **前端框架** | React 18 + TypeScript | 类型安全的现代前端架构 |
| **构建工具** | Vite 6 | 极速开发体验与优化构建 |
| **样式方案** | Tailwind CSS 3 | 原子化 CSS，高效定制 UI |
| **动效引擎** | Framer Motion 12 | 流畅的交互动画体验 |
| **状态管理** | React Query 5 | 服务端状态管理与缓存 |
| **后端服务** | Cloudflare Pages Functions | 边缘计算，毫秒级响应 |
| **数据库** | Cloudflare D1 | 高性能边缘 SQL 数据库 |
| **对象存储** | Cloudflare R2 | 可靠、低成本的媒体存储 |
| **键值存储** | Cloudflare KV | 高速键值缓存 |
| **错误监控** | Sentry | 实时异常追踪与监控 |
| **自动化部署** | GitHub Actions | GitOps 持续交付 |

---

## 📁 项目结构

```
bbkk/
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Actions 自动部署配置
├── functions/               # Cloudflare Pages Functions 后端函数
│   ├── api/                 # REST API 路由
│   │   ├── albums/          # 相册管理 API
│   │   ├── auth/            # 认证 API
│   │   ├── config/          # 系统配置 API
│   │   ├── delete/          # 照片删除 API
│   │   ├── food/            # 美食打卡 API
│   │   ├── images/          # 图片访问 API
│   │   ├── map/             # 地图打卡 API
│   │   ├── notes/           # 碎碎念 API
│   │   ├── stats/           # 数据统计 API
│   │   ├── time-capsules/   # 时光胶囊 API
│   │   ├── timeline/        # 时光轴 API
│   │   ├── todos/           # 清单 API
│   │   ├── upload/          # 文件上传 API
│   │   └── _middleware.ts   # API 中间件（认证/日志）
│   └── utils/               # 后端工具函数
│       ├── db.ts            # 数据库连接
│       ├── response.ts      # 响应封装
│       ├── url.ts           # URL 处理工具
│       └── validation.ts    # 数据校验工具
├── scripts/                 # 运维脚本（R2迁移等）
├── src/                     # 前端源代码
│   ├── components/          # React 组件
│   │   ├── admin/           # 管理后台组件
│   │   │   └── ui/          # 后台 UI 基础组件
│   │   ├── common/          # 通用组件（Loading/Error/Empty等）
│   │   ├── icons/           # 图标组件
│   │   └── map/             # 地图相关组件（中国地图/省份详情等）
│   ├── config/              # 前端配置（API/Sentry/性能）
│   ├── constants/           # 常量定义（动画/API/样式）
│   ├── contexts/            # React Context（认证状态）
│   ├── data/                # 静态数据（省份城市路径/地图数据）
│   ├── hooks/               # 自定义 Hooks
│   ├── pages/               # 页面组件
│   │   └── admin/           # 管理后台页面
│   ├── services/            # API 服务层
│   ├── types/               # TypeScript 类型定义
│   └── utils/               # 工具函数
├── schema.sql               # 数据库完整结构定义
└── index.html               # 入口 HTML
```

---

## 🛠️ 快速起步

### 1. 本地开发准备

```bash
# 克隆仓库
git clone https://github.com/Misaka450/baoandkai.git
cd baoandkai

# 安装依赖
npm install

# 启动前端开发服务器（端口 3000）
npm run dev

# 启动本地 Wrangler 后端（端口 8788，需另开终端）
npm run dev:wrangler
```

> **提示**: 开发环境通过 Vite 代理将 `/api` 请求自动转发到本地 Wrangler (端口 8788)，两个服务需同时运行。

### 2. 环境变量配置

复制环境变量模板并配置：

```bash
cp .env.example .env.local
```

关键配置项说明：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `VITE_SENTRY_DSN` | Sentry 错误监控 DSN | `https://xxx@sentry.io/123` |
| `ADMIN_TOKEN` | 管理员令牌（生产环境使用） | `your-secure-token` |
| `DEFAULT_PASSWORD_HASH` | 默认密码哈希（bcrypt） | `$2a$10$...` |
| `ENVIRONMENT` | 环境标识 | `production` / `development` |
| `ALLOWED_ORIGINS` | 允许的 CORS 来源 | `https://baoandkai.pages.dev` |

> **安全提醒**: 敏感信息请勿提交到仓库，生产环境请在 Cloudflare Pages 控制台配置环境变量。

### 3. 数据库初始化

```bash
# 初始化本地数据库（使用 schema.sql）
npx wrangler d1 execute oursql --file=./schema.sql

# 或使用快捷命令
npm run db:init
```

> **注意**: 本地开发时 Wrangler 会自动在 `.wrangler_local/` 目录下创建 SQLite 数据库文件。

### 4. 云端部署（Cloudflare Pages）

1. **Fork 仓库** 并连接到 Cloudflare Pages
2. **创建云端资源**:
   - 创建 **D1** 数据库并记录 ID
   - 创建 **R2** 存储桶并记录名称
   - 创建 **KV** 命名空间并记录 ID
3. **在 Cloudflare Pages 控制台绑定资源**:
   - D1 数据库绑定名为 `DB`
   - R2 存储桶绑定名为 `BUCKET`
   - KV 命名空间绑定名为 `KV`
4. **配置环境变量** 在 Pages 设置中添加：
   - `ADMIN_TOKEN`
   - `ENVIRONMENT = "production"`
   - `ALLOWED_ORIGINS`
5. **触发部署** 推送到 `master` 分支即可自动部署（通过 GitHub Actions）

---

## 🔌 API 接口文档

### 认证相关

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/check-token` | 验证 Token 有效性 |
| PUT | `/api/auth/update-password-hash` | 更新密码 |

### 核心资源

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/albums` | 获取/创建相册 |
| GET/PUT/DELETE | `/api/albums/:id` | 单个相册操作 |
| GET/POST | `/api/albums/:id/photos` | 获取/添加照片 |
| PUT | `/api/albums/:id/photos/reorder` | 照片排序 |
| GET/DELETE | `/api/albums/:id/photos/:photoId` | 单张照片操作 |
| GET/POST | `/api/timeline` | 获取/创建时间轴事件 |
| GET/PUT/DELETE | `/api/timeline/:id` | 单个时间轴事件操作 |
| GET/POST | `/api/food` | 获取/创建美食打卡 |
| GET/PUT/DELETE | `/api/food/:id` | 单个美食打卡操作 |
| PUT | `/api/food/reorder` | 美食打卡排序 |
| GET/POST | `/api/todos` | 获取/创建待办事项 |
| GET/PUT/DELETE | `/api/todos/:id` | 单个待办事项操作 |
| GET/POST | `/api/notes` | 获取/创建便签 |
| GET/PUT/DELETE | `/api/notes/:id` | 单个便签操作 |
| GET/POST | `/api/map` | 获取/创建地图打卡 |
| GET/PUT/DELETE | `/api/map/:id` | 单个地图打卡操作 |
| GET/POST | `/api/time-capsules` | 获取/创建时光胶囊 |
| GET/PUT/DELETE | `/api/time-capsules/:id` | 单个时光胶囊操作 |
| GET/POST | `/api/config` | 获取/更新系统配置 |
| GET | `/api/stats` | 获取数据统计总览 |

### 文件操作

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/upload` | 上传文件到 R2 |
| DELETE | `/api/upload/delete` | 删除 R2 中的文件 |
| DELETE | `/api/delete/photo` | 删除照片（含数据库记录） |
| GET | `/api/images/*` | 访问 R2 中的图片 |

---

## 🗄️ 数据库表结构

### 主要数据表

| 表名 | 说明 |
|------|------|
| `users` | 用户信息与系统配置 |
| `albums` | 相册列表 |
| `photos` | 照片记录 |
| `timeline_events` | 时间轴事件 |
| `food_checkins` | 美食打卡记录 |
| `notes` | 便签/碎碎念 |
| `todos` | 待办清单 |
| `map_checkins` | 地图打卡记录 |
| `time_capsules` | 时光胶囊 |
| `settings` | 系统设置键值对 |

详细表结构请参考 [schema.sql](./schema.sql)。

---

## 🔧 最新架构优化

我们近期对项目进行了深度重构与性能优化：

- ⚡ **Vite 构建优化**: 极致缩小产物包体积（约 **61%** 的降幅），提升首屏加载速度
- 🗺️ **足迹地图**: 全新可视化足迹地图，支持省市级下钻，动态展示旅行轨迹与打卡记录
- 🖼️ **高性能画廊**: 深度优化的图片加载策略（缩略图/原图渐进式加载），支持全屏沉浸式浏览与手势缩放
- 📊 **数据统计面板**: 后台新增数据总览、月度活跃度趋势、菜系/省份/分类分布等多维度分析
- 🛡️ **全面 TypeScript**: 全量迁移至 .tsx，提供更稳健的类型检查和工程可靠性
- 🌏 **全站中文化**: 管理后台（Admin UI）已完全汉化，提供更亲切的使用体验
- 📸 **功能增强**: 相册、美食打卡、时间轴及心愿清单全面支持图片上传与管理
- 🗑️ **完整 CRUD**: 所有核心资源均支持完整的增删改查操作，包含单条记录的 GET/PUT/DELETE
- 🧼 **代码规范化**: 统一错误处理（ErrorBoundary）与加载动画（LoadingSpinner），修复冗余路由，确保代码整洁
- 🎨 **智能媒体处理**: 优化前端图片预压缩流程，显著降低存储带宽占用
- 🔐 **安全加固**: JWT 认证、密码 bcrypt 加密、CORS 来源控制、XSS 防护等安全措施
- 🚀 **GitHub Actions 自动部署**: 推送到 `master` 分支自动触发 Cloudflare Pages 部署，Node 24 就绪

---

## 🗄️ 数据库优化 (D1)

### 优化要点

| 优化项 | 说明 |
|--------|------|
| **自动时间戳** | 使用 `datetime('now', 'localtime')` 替代 `CURRENT_TIMESTAMP`，支持本地时区 |
| **数据校验** | 为评分字段添加 `CHECK` 约束，确保数据合法性（1-5分） |
| **唯一索引** | `albums.name` 添加唯一索引，防止重名相册 |
| **复合索引** | `photos(album_id, sort_order)` 优化相册内照片排序查询 |
| **触发器** | 自动更新 `updated_at` 字段，便于追踪数据变更 |
| **外键约束** | 开启 `defer_foreign_keys` 延迟检查，支持级联删除 |

### 表结构总览

| 表名 | 说明 | 索引数 |
|------|------|--------|
| `users` | 用户信息与认证 | 1 |
| `albums` | 相册列表 | 2 |
| `photos` | 照片记录 | 3 |
| `timeline_events` | 时间轴事件 | 3 |
| `food_checkins` | 美食打卡 | 4 |
| `notes` | 便签/碎碎念 | 2 |
| `settings` | 系统配置 | 1 |
| `todos` | 待办事项 | 5 |
| `map_checkins` | 地图打卡 | 3 |
| `time_capsules` | 时光胶囊 | 2 |
| `diaries` | 日记 | 3 |

---

## 🪣 存储优化 (R2)

### 当前存储统计

| 文件夹 | 文件数 | 用途 |
|--------|--------|------|
| `albums/` | ~25 | 相册照片（按相册分类） |
| `timeline/` | ~20 | 时间轴照片 |
| `food/` | ~16 | 美食打卡照片 |
| `images/` | ~8 | 通用上传图片 |
| `avatars/` | - | 用户头像 |
| `todos/` | - | 待办附件 |

### 存储建议

1. **定期清理孤岛文件**: 图片删除时同步清理数据库引用
2. **启用 CDN 缓存**: 所有图片已设置 `Cache-Control: public, max-age=31536000`
3. **图片压缩**: 上传前前端自动压缩（最大 1920px，质量 80%）
4. **重复文件检测**: 部分文件存在重复（相同 etag），可考虑去重

### 文件命名规范

上传后文件名会自动转换为 `{timestamp}_{random}.{ext}` 格式，例如：
- 原文件: `IMG_1234.jpg`
- 上传后: `1754966207329_28qfhi.jpg`

**原因**: 防止文件名冲突、保护隐私、统一管理

---

## 🌟 技术亮点

1. **边缘计算架构** - 利用 Cloudflare 全球边缘网络，实现低延迟访问
2. **懒加载策略** - 页面组件按需加载，首页渲染后自动预加载常用路由
3. **代码分割** - Vite 手动分包（vendor/query/animation/utils），主流浏览器仅加载所需代码
4. **本地缓存** - React Query 多层缓存策略，减少不必要的 API 请求
5. **渐进式图片** - 支持 srcset/sizes + 懒加载 + 模糊占位，提供流畅体验
6. **实时统计** - 后台数据面板并行查询，React Query 后台刷新确保数据新鲜度
7. **路由预加载** - 使用 `requestIdleCallback` 在浏览器空闲时预加载常用页面模块
8. **构建优化** - Terser 压缩 + 去除 console/debugger + Rollup 包体积可视化分析

---

## 💝 鸣谢

感谢 Cloudflare 提供的边缘计算平台，以及 React 社区的无限创造力。该项目致力于用技术温暖生活。

---

## 📄 许可证

本项目仅供个人学习与使用，未经授权不得用于商业目的。

---

<div align="center">
  <p>🚀 <strong>项目状态: 运行稳定 | 持续迭代中 ✅</strong></p>
  <p>💖 <em>让每一个瞬间都值得被铭记</em> 💖</p>
  <p>
    <a href="https://baoandkai.pages.dev">演示站点</a> ·
    <a href="https://github.com/Misaka450/baoandkai">GitHub 仓库</a>
  </p>
</div>

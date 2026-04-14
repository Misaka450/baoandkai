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
├── functions/              # Cloudflare Pages Functions 后端函数
│   ├── api/                # REST API 路由
│   │   ├── albums/         # 相册管理 API
│   │   ├── auth/           # 认证 API
│   │   ├── config/         # 系统配置 API
│   │   ├── food/           # 美食打卡 API
│   │   ├── map/            # 地图打卡 API
│   │   ├── notes/          # 碎碎念 API
│   │   ├── time-capsules/  # 时光胶囊 API
│   │   ├── timeline/       # 时光轴 API
│   │   ├── todos/          # 清单 API
│   │   ├── upload/         # 文件上传 API
│   │   └── images/         # 图片访问 API
│   └── utils/              # 后端工具函数
│       ├── db.ts           # 数据库连接
│       ├── response.ts     # 响应封装
│       └── url.ts          # URL 处理工具
├── migrations/             # 数据库迁移文件
├── scripts/                # 数据转换脚本
├── src/                    # 前端源代码
│   ├── components/         # React 组件
│   │   ├── admin/          # 管理后台组件
│   │   ├── common/         # 通用组件
│   │   ├── icons/          # 图标组件
│   │   ├── map/            # 地图相关组件
│   │   └── ui/             # UI 基础组件
│   ├── config/             # 前端配置
│   ├── constants/          # 常量定义
│   ├── contexts/           # React Context
│   ├── data/               # 静态数据（省份、城市路径等）
│   ├── hooks/              # 自定义 Hooks
│   ├── pages/              # 页面组件
│   │   └── admin/          # 管理后台页面
│   ├── services/           # API 服务层
│   ├── types/              # TypeScript 类型定义
│   └── utils/              # 工具函数
├── schema.sql              # 数据库完整结构
└── wrangler.toml           # Cloudflare 配置
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

# 启动开发服务器（前端 + 后端）
npm run dev
npm run dev:wrangler  # 可选：启动本地 Wrangler 后端
```

> **提示**: 开发环境通过 Vite 代理将 `/api` 请求转发到本地 Wrangler (端口 8788)。

### 2. 环境变量配置

复制环境变量模板并配置：

```bash
cp .env.example .env
```

关键配置项说明：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `JWT_SECRET` | JWT 签名密钥 | `your-secret-key` |
| `ENVIRONMENT` | 环境标识 | `production` / `development` |
| `IMAGE_BASE_URL` | 图片 CDN 基础 URL | `https://img.xxx.com` |

> **安全提醒**: `.env.production` 中的敏感信息仅用于构建时注入，生产环境请在 Cloudflare Pages 控制台配置。

### 3. 数据库初始化

```bash
# 初始化本地数据库
npm run db:init

# 执行迁移
npm run db:migrate

# 或一键完成（包含初始化+迁移）
npm run setup-db
```

### 4. 云端部署（Cloudflare Pages）

1. **Fork 仓库** 并连接到 Cloudflare Pages
2. **创建云端资源**:
   - 创建 **D1** 数据库并记录 ID
   - 创建 **R2** 存储桶并记录名称
   - 创建 **KV** 命名空间并记录 ID
3. **更新 `wrangler.toml`** 中的资源绑定配置
4. **配置环境变量** 在 Pages 设置中添加：
   - `JWT_SECRET`
   - `ENVIRONMENT = "production"`
   - `IMAGE_BASE_URL`
5. **触发部署** 推送到 `main` 分支即可自动部署

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
| GET/POST | `/api/timeline` | 获取/创建时间轴事件 |
| GET/POST | `/api/food` | 获取/创建美食打卡 |
| GET/POST | `/api/todos` | 获取/创建待办事项 |
| GET/POST | `/api/notes` | 获取/创建便签 |
| GET/POST | `/api/map` | 获取/创建地图打卡 |
| GET/POST | `/api/time-capsules` | 获取/创建时光胶囊 |
| GET/POST | `/api/config` | 获取/更新系统配置 |

### 文件操作

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/upload` | 上传文件到 R2 |
| DELETE | `/api/upload/delete` | 删除 R2 中的文件 |

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
- 🛡️ **全面 TypeScript**: 全量迁移至 .tsx，提供更稳健的类型检查和工程可靠性
- 🌏 **全站中文化**: 管理后台（Admin UI）已完全汉化，提供更亲切的使用体验
- 📸 **功能增强**: 相册、美食打卡、时间轴及心愿清单全面支持图片上传与管理
- 🗄️ **数据库同步**: 生产环境数据库结构已自动适配，确保线上线下功能完全一致
- 🧼 **代码规范化**: 统一错误处理（ErrorBoundary）与加载动画（LoadingSpinner），修复冗余路由，确保代码整洁
- 🎨 **智能媒体处理**: 优化前端图片预压缩流程，显著降低存储带宽占用
- 🔐 **安全加固**: JWT 认证、密码 bcrypt 加密、XSS 防护等安全措施
- 🚀 **Node 24 就绪**: GitHub Actions 已配置 `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` 环境变量，确保在 Node.js 20 停用前完成迁移

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

| 表名 | 说明 | 记录数 |
|------|------|--------|
| `users` | 用户信息与认证 | 1 |
| `albums` | 相册列表 | 4 |
| `photos` | 照片记录 | 29 |
| `timeline_events` | 时间轴事件 | 11 |
| `food_checkins` | 美食打卡 | 4 |
| `notes` | 便签/碎碎念 | - |
| `todos` | 待办事项 | - |
| `map_checkins` | 地图打卡 | - |
| `time_capsules` | 时光胶囊 | - |
| `diaries` | 日记 | 1 |
| `settings` | 系统配置 | - |

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
2. **懒加载策略** - 页面组件按需加载，首屏加载时间大幅缩短
3. **代码分割** - Vite 自动分包，主流浏览器仅加载所需代码
4. **本地缓存** - React Query 多层缓存策略，减少不必要的 API 请求
5. **渐进式图片** - 支持 srcset/sizes + 懒加载 + 模糊占位，提供流畅体验
6. **实时统计** - React Query 的后台刷新确保数据新鲜度

---

## 💝 鸣谢

感谢 Cloudflare 提供的边缘计算平台，以及 React 社区的无限创造力。该项目致力于用技术温暖生活。

---

## 📄 许可证

本项目仅供个人学习与使用，未经授权不得用于商业目的。

---

<div align="center">
  <p>🚀 <strong>项目状态: 运行稳定 | 优化完成 ✅</strong></p>
  <p>💖 <em>让每一个瞬间都值得被铭记</em> 💖</p>
  <p>
    <a href="https://baoandkai.pages.dev">演示站点</a> ·
    <a href="https://github.com/Misaka450/baoandkai">GitHub 仓库</a>
  </p>
</div>

# 包包和恺恺的小窝 💕 (Couple Moments)

> 一个充满爱意、现代化且高性能的情侣专属数字小窝，专为记录包包和恺恺的每一份美好记忆而打造。  
> 无论是旅行足迹、心动碎碎念、美食打卡、高清相册还是时光胶囊，这里都能为你长久封存属于两人的浪漫时光。

---

## 📖 目录 (Table of Contents)

- [🌟 项目概览 (Project Overview)](#-项目概览-project-overview)
  - [核心特色](#-核心特色)
  - [系统架构图](#-系统架构图)
  - [核心技术栈](#-核心技术栈)
- [📁 目录结构 (Directory Structure)](#-目录结构-directory-structure)
- [🚀 安装与快速上手 (Installation & Quick Start)](#-安装与快速上手-installation--quick-start)
  - [环境准备](#1-环境准备)
  - [方式一：本地开发调试模式 (推荐开发者)](#方式一本地开发调试模式-推荐开发者)
  - [方式二：Docker Compose 一键容器化部署 (推荐服务器上线)](#方式二docker-compose-一键容器化部署-推荐服务器上线)
  - [方式三：轻量运行时包构建部署 (Runtime Bundle)](#方式三轻量运行时包构建部署-runtime-bundle)
- [⚙️ 配置选项指南 (Configuration Options)](#️-配置选项指南-configuration-options)
  - [前端与通用环境变量 (.env)](#前端与通用环境变量-env)
  - [Docker 容器环境变量 (.env.docker)](#docker-容器环境变量-envdocker)
  - [Nginx 反向代理与资源直出配置](#nginx-反向代理与资源直出配置)
- [💡 使用指南 (Usage Guidelines)](#-使用指南-usage-guidelines)
  - [前台温馨互动体验](#前台温馨互动体验)
  - [后台内容管控与安全体系](#后台内容管控与安全体系)
  - [核心 REST API 接口清单](#核心-rest-api-接口清单)
- [🛠️ 故障排查与排坑指南 (Troubleshooting)](#️-故障排查与排坑指南-troubleshooting)
- [🤝 贡献与开发规范 (Contribution Guidelines)](#-贡献与开发规范-contribution-guidelines)
- [📄 许可证与致谢 (License & Acknowledgements)](#-许可证与致谢-license--acknowledgements)

---

## 🌟 项目概览 (Project Overview)

### ✨ 核心特色

- 🏠 **智慧恋爱首页**：实时计算恋爱天数与纪念日倒数，支持个性化背景、情侣动态头像、自定义问候语与那年今日回忆唤醒。
- 📸 **高清智能画廊**：沉浸式多相册瀑布流展示，支持拖拽排序、大图全屏手势缩放浏览、Exif 拍摄信息智能提取，移动端支持相册下钻管理与即时改名。
- 🖼️ **拍立得相纸工坊 (Polaroid Studio)**：支持在相册与看图模式下一键生成复古拍立得相纸，内置 5 款莫兰迪色温滤镜、手写体寄语与专属“❤️ 包包 & 恺恺 · 珍藏回忆”情侣火漆红印章，基于 2x Retina Canvas 离线高清直出下载。
- 📻 **微型黑胶自然白噪音 (Vinyl Ambient Player)**：纯客户端 Web Audio API 物理合成 5 款自然白噪音（雨落窗台、暖冬壁炉、街角咖啡、夏日海浪、舒缓和弦），带逼真黑胶旋转、唱臂微动效、定时关闭底抽屉与平滑音量控制。
- 🗺️ **足迹可视化地图 & 旅程回放**：高精度中国地图，支持省市二级下钻交互、路线轨迹连线、旅行打卡照片绑定，集成 Canvas 粒子航线旅程回放 (Travel Playback) 与年度足迹长图报告。
- 🍜 **人间烟火美食打卡**：记录共同品味的美食足迹，支持打卡地点、星级评分、招牌菜系与多图展示。
- 📝 **心动碎碎念**：随手记录日常生活里的小确幸，提供精美拟物化便签卡片与多色彩标签，支持一键删除二次确认。
- ⏳ **时光胶囊**：封存属于两人的私密回忆或未来寄语，到达设定的解锁时间方可开启。
- 📅 **时光轴历程 (高密度重构)**：以时间流形式串联每一个重要里程碑，铭记高光时刻；手机端深度适配高密度图文流，首屏可直观浏览 5 个回忆。
- ✅ **甜蜜清单 (100件事)**：共同探索的生活愿望清单，支持分类筛选、完成状态切换、达成感言与庆祝动效。
- 📳 **触觉微交互 (Haptics Feedback)**：移动端全面接入轻微振动触感反馈（轻触、切换、操作达成、删除二次确认等，iOS/Android 兼容兜底）。
- 📱 **移动端全场景安全区与高密度适配**：全站适配 iOS / Android `100dvh` 与 `env(safe-area-inset-*)`，侧边抽屉与底部浮球防刘海及底栏手势遮挡，杜绝横向滚动溢出。
- 🎨 **100% 统一的莫兰迪设计系统**：移除所有原生系统弹窗与硬编码大红，全站弹窗统一通过 `createPortal` 隔离防穿透，统一柔和粉灰、豆沙绿与暖米灰。
- 📊 **多维数据洞察**：后台集成数据总览面板，统计活跃度趋势、足迹覆盖度、菜系分布等。
- 🔐 **严苛安全防护**：基于 Session 的会话认证机制、密码 bcrypt 安全哈希、全局 CSRF Token 防护、上传路径安全白名单、防暴力破解速率限制。

---

### 🏛️ 系统架构图

本项目已全面升级为以 **Node.js (Hono) + PostgreSQL 17 + 本地持久化 / Nginx 直出** 为核心的工业级独立自主架构，支持 Docker 容器化跨平台部署（兼容 x86_64 与 ARM64 架构）：

```text
客户端 (PC / 手机浏览器)
       │
       ▼ (HTTP 80 / HTTPS 443)
┌────────────────────────────────────────────────────────┐
│                   Nginx 网关容器 (bbkk-nginx)          │
│                                                        │
│  ├─ /              → 前端静态单页应用 SPA (/dist)         │
│  ├─ /assets/*      → 前端静态资源 (带 Hash，长期缓存 1y)   │
│  ├─ /uploads/*     → 用户上传媒体文件直出 (高性能零拷贝)   │
│  └─ /api/*         ──┐ (反向代理内部端口 3001)           │
└──────────────────────┼─────────────────────────────────┘
                       ▼
┌────────────────────────────────────────────────────────┐
│              Node.js 后端服务 (bbkk-app)                │
│                                                        │
│  ├─ Hono Web 框架 (轻量毫秒级响应 REST API)            │
│  ├─ 中间件层: CORS 校验 / CSRF 防御 / 访问速率限制     │
│  ├─ 内存 LRU Cache 缓存加速                            │
│  ├─ 本地文件系统 (持久化 /uploads 存储)                 │
│  └─ 数据交互 (pg 连接池)                                │
└──────────────────────┬─────────────────────────────────┘
                       ▼ (端口 5432)
┌────────────────────────────────────────────────────────┐
│             PostgreSQL 17 数据库 (bbkk-db)             │
│                                                        │
│  └─ 持久化存储用户、相册、足迹、会话、美食打卡等业务数据│
└────────────────────────────────────────────────────────┘
```

---

### 🚀 核心技术栈

| 领域 | 选用技术 | 说明与优势 |
| :--- | :--- | :--- |
| **前端开发** | React 18 + TypeScript | 强类型组件化开发，架构健壮 |
| **工程构建** | Vite 6 | 毫秒级冷启动与极速 HMR 热重载 |
| **UI 样式** | Tailwind CSS 3 | 原子化样式系统，响应式全屏适配 |
| **动效框架** | Framer Motion 12 | 丝滑弹簧物理动效与页面平滑过渡 |
| **音频引擎** | Web Audio API | 纯客户端程序化实时合成环境白噪音音效 |
| **图形渲染** | Canvas 2D + SVG | 拍立得 2x 高清导出与足迹航线粒子飞行动画 |
| **设备触感** | Web Haptics API | 移动端多级微交互震动反馈与触觉体验 |
| **请求缓存** | TanStack React Query 5 | 服务端状态管理、乐观更新与自动重试 |
| **后端框架** | Hono 4 + Node.js (v20+) | 新一代轻量高性能 Web 框架 |
| **主数据库** | PostgreSQL 17 | 工业级开源关系型数据库，完整事务与外键级联 |
| **图像引擎** | Sharp + Exifr | 本地高效图片预处理、压缩与相机拍摄参数提取 |
| **网关代理** | Nginx (Alpine) | 高并发静态资源分发与反向代理网关 |
| **容器编排** | Docker & Docker Compose | 一键编排、跨平台环境无缝一致性 |
| **异常监控** | Sentry (可选) | 生产环境异常崩溃实时报警与诊断 |

---

## 📁 目录结构 (Directory Structure)

```text
bbkk/
├── .vscode/                     # VSCode 统一开发配置
├── nginx/                       # Nginx 网关配置
│   └── default.conf             # 生产反代、静态直出与 SSL 配置
├── scripts/                     # 运维与发布脚本
│   └── prepare-runtime-bundle.mjs # 一键打包生产最小运行工件脚本
├── server/                      # 后端源码 (Node.js + Hono)
│   ├── migrations/              # PostgreSQL 数据库建表与迁移脚本
│   │   ├── 001_init.sql         # 全量业务表与索引定义
│   │   └── 002_sessions.sql     # 会话 Session 表与过期清理函数
│   ├── src/                     # 后端业务源码
│   │   ├── lib/                 # 核心基础库 (db 连接池、lru cache、storage 存储)
│   │   ├── middleware/          # 中间件 (auth 鉴权、cors 跨域、security 安全头)
│   │   ├── routes/              # RESTful API 路由模块 (auth, albums, food, map 等)
│   │   ├── utils/               # 实用工具函数 (exif, validation, response 封装)
│   │   └── index.ts             # 后端应用启动入口
│   ├── package.json             # 后端依赖配置
│   └── tsconfig.json            # 后端 TypeScript 配置
├── src/                         # 前端源码 (React 18 + Vite)
│   ├── components/              # 业务及通用组件库 (admin, map, common, ui, VinylPlayer, PolaroidModal 等)
│   ├── config/                  # 前端运行时配置 (api, sentry, performance)
│   ├── constants/               # 全局常量定义 (动画配置、预设分类等)
│   ├── contexts/                # 全局 React Context 状态 (AuthContext 等)
│   ├── data/                    # 静态数据 (全国 34 省市区多边形 SVG 路径坐标)
│   ├── hooks/                   # 自定义 React Hooks
│   ├── pages/                   # 前端页面路由组件
│   ├── services/                # Axios/Fetch API 客户端通讯层
│   ├── types/                   # 业务模型 TypeScript 接口定义
│   ├── utils/                   # 辅助工具函数 (imageUtils, haptics, modalState, localAvatar 等)
│   ├── App.tsx                  # 前端根组件与路由注册
│   └── main.tsx                 # 前端应用入口
├── uploads/                     # 本地文件存储目录 (相册、头像、背景、打卡图)
├── .env.example                 # 本地开发环境变量模板
├── .env.docker.example          # Docker 部署环境变量模板
├── Dockerfile                   # 完整多阶段构建 Dockerfile
├── Dockerfile.runtime           # 基于已编译工件的极速运行时 Dockerfile
├── docker-compose.yml           # 标准一键启动容器编排文件
├── docker-compose.runtime.yml   # 运行时离线包容器编排文件
├── package.json                 # 前端依赖与全局脚本入口
├── tailwind.config.js           # Tailwind CSS 主题配置
└── vite.config.js               # Vite 构建及开发代理配置
```

---

## 🚀 安装与快速上手 (Installation & Quick Start)

### 1. 环境准备

在开始之前，请确认您的系统已安装以下环境工具：

- **操作系统**：Windows 10/11、macOS 或 Linux (Ubuntu/Debian/CentOS)
- **Node.js**：`v20.0.0` 或更高版本（推荐 LTS 版本）
- **包管理工具**：`npm` (>= 9.0) 或 `pnpm`
- **Docker & Docker Compose**（如果使用容器化部署模式）：Docker Desktop (Windows) 或 Docker Engine (Linux)

---

### 方式一：本地开发调试模式 (推荐开发者)

适合在个人电脑（如 Windows 系统）上边改代码边调试。

#### 第 1 步：克隆代码仓库

打开终端（Windows 推荐使用 **PowerShell** 或 **Windows Terminal**）：

```bash
git clone https://github.com/Misaka450/baoandkai.git
cd baoandkai
```

#### 第 2 步：安装前后端依赖

```bash
# 1. 安装前端项目依赖
npm install

# 2. 安装后端服务依赖
cd server
npm install
cd ..
```

#### 第 3 步：启动并配置本地 PostgreSQL 数据库

您可以选择使用本地已安装的 PostgreSQL 17，或者用一条 Docker 命令快速启动一个临时的本地数据库：

```bash
# 使用 Docker 快速启动一个本地 PostgreSQL 实例
docker run -d --name bbkk-local-db -p 5432:5432 -e POSTGRES_DB=bbkk -e POSTGRES_USER=bbkk -e POSTGRES_PASSWORD=bbkk_secret postgres:17-alpine
```

执行建表 SQL 初始化结构（可以直接使用 psql、Navicat、DBeaver 或命令行导入）：

```bash
# 将 migrations 目录下的两个脚本按次序导入数据库
# 示例：通过 docker exec 导入
docker exec -i bbkk-local-db psql -U bbkk -d bbkk < server/migrations/001_init.sql
docker exec -i bbkk-local-db psql -U bbkk -d bbkk < server/migrations/002_sessions.sql
```

#### 第 4 步：配置环境变量

在项目根目录下创建环境配置文件：

```bash
# 复制开发模板
cp .env.example .env.local
```

同时在 `server/` 目录下创建 `server/.env` 文件：

```ini
# server/.env 后端本地配置
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bbkk
DB_USER=bbkk
DB_PASSWORD=bbkk_secret
ADMIN_TOKEN=my_super_secret_admin_token_2026
ALLOWED_ORIGINS=http://localhost:3000
UPLOAD_DIR=../uploads
IMAGE_BASE_URL=http://localhost:3001/uploads
```

#### 第 5 步：启动开发服务

请打开两个独立的终端窗口分别启动前端与后端：

```bash
# 【终端 1】：启动后端服务 (端口 3001)
cd server
npm run dev

# 【终端 2】：在根目录下启动前端服务 (端口 3000)
npm run dev
```

打开浏览器访问：`http://localhost:3000` 即可开始体验！  
前端 Vite 会自动将以 `/api` 开头的请求反向代理到后端的 `3001` 端口，开箱即用。

---

### 方式二：Docker Compose 一键容器化部署 (推荐服务器上线)

适合部署在 Linux 云服务器（如阿里云、腾讯云、搬瓦工、树莓派等 ARM/x86 架构），支持通过 1Panel 或宝塔等面板进行运维。

#### 第 1 步：准备环境变量

在服务器上克隆仓库后，基于示例文件生成 Docker 专用环境变量：

```bash
cp .env.docker.example .env
```

使用编辑器（如 `nano .env` 或 `vim .env`）修改生产安全密码：

```ini
# PostgreSQL 数据库超级密码 (务必修改为强密码！)
DB_PASSWORD=YourStrongDatabasePassword123!

# 管理员安全令牌 (用于特定权限认证与密码重置)
ADMIN_TOKEN=YourSecureRandomAdminToken9988

# 允许访问的域名 (若绑定了独立域名请填写)
ALLOWED_ORIGINS=https://bbkk.980823.xyz

# 外部暴露的 HTTP 访问端口
HTTP_PORT=80
```

#### 第 2 步：一键构建并启动服务

```bash
# 一键自动构建前端、后端镜像并拉起 PostgreSQL 数据库
docker compose up -d --build
```

系统会自动启动三个互相协作的容器：
- `bbkk-db`：PostgreSQL 17 数据库（数据挂载在 Docker Volume `pg_data`）
- `bbkk-app`：Node.js + Hono 后端服务
- `bbkk-nginx`：Nginx 网关与静态直出服务器（映射主机的 80 端口）

#### 第 3 步：查看服务状态与日志

```bash
# 查看所有容器健康运行状态
docker compose ps

# 查看后端实时日志
docker compose logs -f app

# 查看数据库日志
docker compose logs -f postgres
```

访问服务器 IP 或域名即可体验完整项目。

---

### 方式三：轻量运行时包构建部署 (Runtime Bundle)

如果服务器配置较低（如 1核1G 内存的轻量云服务器），在服务器上直接执行 `npm run build` 可能导致内存耗尽（OOM）。本项目提供了**本地预打包、服务器纯净免编译直跑**方案：

```bash
# 1. 在本地电脑打包前端与后端
npm run build
cd server && npm run build && cd ..

# 2. 执行打包脚本，生成轻量运行时捆绑目录 (release/bbkk-runtime)
npm run pack:runtime
```

将生成的 `release/bbkk-runtime` 目录上传至服务器，直接使用精简编排文件运行：

```bash
cd bbkk-runtime
cp .env.docker.example .env
docker compose -f docker-compose.runtime.yml up -d
```

---

## ⚙️ 配置选项指南 (Configuration Options)

### 前端与通用环境变量 (.env)

| 配置变量名 | 类型 | 默认值 / 示例 | 说明 |
| :--- | :--- | :--- | :--- |
| `VITE_SENTRY_DSN` | 选填 | `https://xxx@sentry.io/123` | 前端 Sentry 错误日志上报地址（留空则不启用） |
| `ADMIN_TOKEN` | **必填** | `secret_token_string` | 管理员全局令牌，用于密码重置及敏感管理操作 |
| `ALLOWED_ORIGINS` | 选填 | `https://domain.com` | 后端允许的跨域来源列表，多个以英文逗号分隔（生产环境请勿使用 `*`） |

### Docker 容器环境变量 (.env.docker)

| 配置变量名 | 类型 | 示例值 | 说明 |
| :--- | :--- | :--- | :--- |
| `DB_PASSWORD` | **必填** | `VerySecurePassword!` | PostgreSQL 数据库连接密码 |
| `ADMIN_TOKEN` | **必填** | `RandomToken64Char` | 管理员高权限凭证 |
| `POSTGRES_DB` | 选填 | `bbkk` | PostgreSQL 默认数据库名称 |
| `POSTGRES_USER` | 选填 | `bbkk` | PostgreSQL 连接用户 |
| `ALLOWED_ORIGINS` | 选填 | `https://your-domain.com` | CORS 限制，防非法外链调用 |
| `IMAGE_BASE_URL` | 选填 | `/uploads` | 图片资源访问基准 URL 前缀 |
| `HTTP_PORT` | 选填 | `80` | 外部宿主机映射端口（可设为 8080 等避开冲突） |

### Nginx 反向代理与资源直出配置

`nginx/default.conf` 中预设了针对高并发情侣站点的优化规则：
- **静态资源缓存**：`/assets/` 带有编译 Hash 的 JS/CSS 文件开启 1 年不可变长缓存（`Cache-Control: public, immutable`）。
- **用户媒体直出**：`/uploads/` 本地图片目录直接由 Nginx 挂载读取输出，免去 Node 进程调度损耗，加速首屏渲染。
- **SPA 路由重写**：`try_files $uri $uri/ /index.html` 保证 React 页面刷新不出现 404。
- **接口反代**：`/api/` 自动代理转发至 Node.js 服务的 `3001` 端口，并支持最大 20MB 上传体积（`client_max_body_size 20M`）。

---

## 💡 使用指南 (Usage Guidelines)

### 前台温馨互动体验

1. **首页天数心动计时**：展示两位主人的合照、昵称，以及相恋的第 X 天。背景图片支持自定义更换。
2. **足迹地图探索**：在“足迹地图”页面中，点击对应省份即可平滑放大并下钻至地级市，直观展示每一次共同旅行的轨迹与打卡图集。
3. **高清相册相遇**：在相册页选择相册进入，支持多图瀑布流式浏览。点击任意照片即可唤醒全屏大图预览与手势切换。
4. **美食足迹打卡**：查阅两人探店品尝的每一道珍馐，支持按菜系分类、评分排序。
5. **时光胶囊开启**：查看待开启与已开启的时光胶囊。未到开启时间的胶囊将被妥善密封，留存期待。
6. **微型黑胶与白噪音**：随时点击右下角黑胶唱机收听雨声、咖啡馆等 5 种氛围声，支持 15/30/60 分钟睡眠倒计时。
7. **定制拍立得相纸**：在照片大图或相册中点击拍立得相机图标，可自选色温滤镜、手写祝福并导出带专属情侣红印章的高清照片。

### 后台内容管控与安全体系

- **管理员登录路径**：访问 `/admin` 或点击前台页面底部的“管理入口”。
- **双重认证安全体系**：
  - **HttpOnly Cookie**：认证成功后发放安全的 `auth_token` Cookie，防 XSS 窃取。
  - **CSRF Token**：针对所有状态变更请求（POST/PUT/DELETE），强制校验 `X-CSRF-Token` 请求头，彻底规避跨站伪造请求漏洞。
  - **速率限制**：针对恶意密码尝试，实施 5 次连续失败即临时锁定 IP 与账户的策略。
- **后台管理功能**：
  - 相册管理：创建相册、拖拽调整封面与展示次序、批量添加图片。
  - 内容发布：随时随地发布时间轴事件、待办心愿目标、美食打卡与心情碎碎念。
  - 全局配置：一键修改情侣姓名、纪念日、主页标题、标语、背景壁纸与头像链接。

---

### 核心 REST API 接口清单

所有接口均位于 `/api` 前缀下：

#### 🔐 认证与会话相关
- `POST /api/auth/login` - 密码登录，发放 HttpOnly Cookie 与 CSRF Token
- `POST /api/auth/logout` - 安全登出，服务端立即销毁 Session 并清除 Cookie 🔒
- `GET /api/auth/check-token` - 校验当前会话有效性并获取用户信息
- `POST /api/auth/update-password-hash` - 基于管理员令牌重置指定账号密码（重置后该账号所有会话强制失效）

#### 📸 相册与照片管理
- `GET /api/albums` - 获取相册列表（含分页与照片计数）
- `POST /api/albums` - 创建新相册 🔒
- `GET /api/albums/:id` - 获取单个相册详情
- `PUT /api/albums/:id` - 修改相册基础信息 🔒
- `DELETE /api/albums/:id` - 删除相册（级联删除其下所有照片） 🔒
- `GET /api/albums/:id/photos` - 获取指定相册的照片列表（分页）
- `POST /api/albums/:id/photos` - 向相册添加照片 🔒
- `PUT /api/albums/:id/photos/reorder` - 批量更新照片排序 🔒
- `DELETE /api/albums/:id/photos/:photoId` - 删除指定照片（同步清理物理磁盘文件） 🔒

#### 🗺️ 足迹与地图打卡
- `GET /api/map` - 获取所有已点亮的足迹打卡记录
- `POST /api/map` - 创建新的足迹打卡记录 🔒
- `PUT /api/map/:id` - 更新打卡信息 🔒
- `DELETE /api/map/:id` - 删除足迹打卡 🔒

#### 🍜 美食打卡
- `GET /api/food` - 获取美食打卡列表
- `POST /api/food` - 新增美食打卡记录 🔒
- `PUT /api/food/reorder` - 调整美食卡片顺序 🔒
- `PUT /api/food/:id` - 修改美食打卡 🔒
- `DELETE /api/food/:id` - 删除美食打卡 🔒

#### 📅 时光轴、便签与待办
- `GET /api/timeline` & `POST /api/timeline` - 查询/创建时间轴大事件
- `GET /api/notes` & `POST /api/notes` - 查询/发布心动碎碎念便签
- `GET /api/todos` & `POST /api/todos` - 查询/创建甜蜜心愿清单（100件事）
- `PUT /api/todos/:id` - 切换心愿清单完成状态 🔒

#### ⏳ 时光胶囊与配置统计
- `GET /api/time-capsules` - 获取胶囊列表（自动根据设定时间判断是否解锁正文）
- `POST /api/time-capsules` - 封存新的时光胶囊 🔒
- `GET /api/config` - 获取公开站点配置（情侣名称、纪念日天数等）
- `POST /api/config` - 更新站点全局配置 🔒
- `GET /api/stats` - 获取后台数据大屏聚合指标（照片数、足迹统计、活跃度趋势）
- `POST /api/vault/export` - 验证小窝密码打包导出全站回忆数据与媒体归档 🔒

#### 📁 文件上传处理
- `POST /api/upload` - 上传多媒体图片（支持 Sharp 自动处理与 Exif 读取，单文件限 20MB） 🔒
- `DELETE /api/upload/delete` - 删除指定相对路径的图片文件 🔒

> 注：标有 🔒 符号的接口需要管理员认证及 CSRF 验证保护。

---

## 🛠️ 故障排查与排坑指南 (Troubleshooting)

### 1. 数据库无法连接 (`ECONNREFUSED` 或 `password authentication failed`)
- **排查步骤**：
  1. 检查 PostgreSQL 是否正在运行：执行 `docker compose ps` 查看 `bbkk-db` 状态是否为 `Up (healthy)`。
  2. 检查环境变量：确保 `.env` 中的 `DB_PASSWORD` 与数据库初始化时设定的密码一致。
  3. 注意 Windows 本地调试：若本地运行 Node 提示连接超时，检查 `server/.env` 中的 `DB_HOST` 应填 `localhost`；若在 Docker 容器内部则应填 `postgres`。

### 2. 上传图片报错 (`不允许的上传目录` 或 `EACCES / Permission denied`)
- **排查步骤**：
  1. 确保上传目录有写入权限：Linux 服务器上请执行 `chmod -R 777 uploads` 或将所有者赋给运行用户。
  2. 接口限制检查：后端设有安全目录白名单，合法目录为 `images`、`albums`、`avatars`、`food`、`map`。
  3. 文件类型限制：仅支持 `image/jpeg`、`image/png`、`image/gif`、`image/webp` 格式。

### 3. 后台操作提示 403 `CSRF验证失败`
- **排查步骤**：
  1. 检查 Cookie 发送情况：非 HTTPS 环境下，请确认浏览器的 Cookie 策略未拦截本地 Cookie。
  2. 刷新页面重新登录：Token 刷新后会分发最新的 CSRF Token，客户端发起 PUT/POST 时需携带 `X-CSRF-Token` 请求头。

### 4. Nginx 页面打不开或提示 502 Bad Gateway
- **排查步骤**：
  1. 检查后端容器是否正常运行：执行 `docker compose logs -f app`，确认 Node 服务已成功监听在 3001 端口。
  2. 检查 Nginx 容器连通性：确保 `app` 容器与 `nginx` 处于同一 Docker 网络中。

### 5. Windows 开发环境特有注意事项
- **换行符问题**：Git 在 Windows 可能会自动将换行符转为 CRLF，导致某些 Linux 脚本执行异常。建议在拉取代码前执行 `git config core.autocrlf false`。
- **端口冲突**：如果启动失败，请检查本地 3000、3001 或 5432 端口是否被其他软件占用。可以通过 PowerShell 命令 `netstat -ano | findstr 3000` 查证。

---

## 🤝 贡献与开发规范 (Contribution Guidelines)

欢迎一同维护和完善小窝！在提交 PR 前请遵循以下步骤：

### 1. 分支管理策略
- 主分支：`master`（保持随时可发布状态）。
- 特性分支：建议从 `master` 切出分支：`git checkout -b feat/your-feature-name`。

### 2. 代码检查与自动化测试
在提交变更前，请在本地运行测试与代码规范检查：

```bash
# 运行前端测试 (Vitest)
npm run test

# 运行后端测试 (20+ 单元测试)
cd server && npm test && cd ..

# 检查前端 TypeScript 类型
npx tsc --noEmit

# 检查后端 TypeScript 类型
cd server && npx tsc --noEmit && cd ..
```

### 3. 代码注释与中文原则
- **通俗易懂的注释**：复杂算法或关键业务逻辑处，请按功能补充通俗生动的中文注释。
- **类型安全**：新增数据接口必须在 `src/types/` 和 `server/src/types/` 中定义完整的数据类型，严禁滥用 `any`。

---

## 📄 许可证与致谢 (License & Acknowledgements)

### 💝 特别致谢
- 感谢包包和恺恺彼此的陪伴与爱意，这是本小窝诞生的灵感源泉。
- 感谢开源社区优秀项目：React、Hono、Vite、Tailwind CSS、PostgreSQL、Framer Motion。

### 📜 许可证
本项目采用 **MIT License** 开源许可证。欢迎作为情侣专属纪念网站部署自用，但请保留相关版权信息。

---

<div align="center">
  <p>💖 <strong>愿天下有情人终成眷属，愿每一次驻足都充满温暖</strong> 💖</p>
  <p>🚀 <em>项目运行稳定 · 持续迭代升级中</em></p>
</div>

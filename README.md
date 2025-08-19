# 包包和恺恺的小窝 💕

一个温馨的小窝网站，记录包包和恺恺的美好时光。基于Cloudflare全栈技术栈，无需服务器，部署简单，功能丰富。

## ✨ 功能特色

- 🏠 **温馨首页** - 展示情侣信息和纪念日倒计时，支持自定义背景
- 📸 **回忆相册** - 上传和管理美好瞬间的照片，支持拖拽排序
- 📝 **碎碎念** - 记录日常的小确幸和心情，管理员可删除任意内容
- 🍜 **美食打卡** - 记录一起品尝的美食，包含评分和位置信息
- 📅 **时间轴** - 按时间线展示重要时刻，支持图片和分类
- ✅ **甜蜜待办** - 一起完成的小目标清单，支持优先级和状态
- 👨‍💻 **管理后台** - 一站式内容管理，支持图片上传和系统设置
- 🎨 **主题定制** - 支持自定义网站标题、描述、背景图等
- 📱 **响应式设计** - 完美适配手机、平板、电脑

## 🚀 技术栈

- **前端**: React 18 + Vite + Tailwind CSS + Framer Motion
- **后端**: Cloudflare Pages Functions (Serverless)
- **数据库**: Cloudflare D1 (SQLite兼容)
- **存储**: Cloudflare R2 (兼容S3)
- **部署**: GitHub Actions + Cloudflare Pages (CI/CD)
- **身份验证**: 基于token的会话管理
- **图片处理**: 客户端压缩 + 服务端存储

## 📦 快速开始

### 🛠️ 开发环境搭建

1. **克隆项目**
   ```bash
   git clone https://github.com/Misaka450/baoandkai.git
   cd baoandkai
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **本地开发**
   ```bash
   npm run dev
   # 访问 http://localhost:5173
   ```

### 🚀 生产部署

#### 方案1：一键部署（推荐）
1. Fork本项目到你的GitHub
2. 绑定到Cloudflare Pages
3. 自动部署完成！

#### 方案2：手动部署
1. **构建项目**
   ```bash
   npm run build
   ```

2. **部署到Cloudflare**
   ```bash
   npm run deploy
   ```

#### 方案3：使用Wrangler
```bash
# 安装Wrangler
npm install -g wrangler

# 登录Cloudflare
wrangler login

# 部署
wrangler pages deploy dist
```

## 🔧 环境配置

### 1. Cloudflare资源准备

#### 创建D1数据库
```bash
# 创建数据库
wrangler d1 create baoandkai-db

# 获取数据库ID，填入wrangler.toml
```

#### 创建R2存储桶
```bash
# 创建存储桶
wrangler r2 bucket create baoandkai-images
```

### 2. 配置文件设置

#### wrangler.toml
```toml
name = "baoandkai"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "dist"

[[d1_databases]]
binding = "DB"
database_name = "baoandkai-db"  # 替换为你的数据库名
database_id = "your-database-id"  # 替换为你的数据库ID

[[r2_buckets]]
binding = "ouralbum"
bucket_name = "baoandkai-images"  # 替换为你的存储桶名

[vars]
ENVIRONMENT = "production"
```

### 3. 数据库初始化

#### 自动初始化（推荐）
首次部署时，系统会自动运行数据库迁移。

#### 手动初始化
```bash
# 本地测试数据库
wrangler d1 execute baoandkai-db --local --file=./migrations/init.sql

# 生产数据库
wrangler d1 execute baoandkai-db --file=./migrations/init.sql
```

#### 更新管理员密码
```bash
# 访问 /api/auth/update-password-hash 来设置管理员密码
# 默认用户名: baobao  默认密码: baobao123
```

## 📱 功能详解

### 🏠 首页功能
- 💝 情侣信息展示（可自定义情侣姓名）
- ⏰ 纪念日倒计时（支持设置纪念日期）
- 🎨 自定义背景图（支持上传背景图片）
- 📱 完美移动端适配

### 📸 相册功能
- 📁 无限创建相册分类
- 🖼️ 批量上传照片（支持拖拽）
- 🎯 拖拽排序照片
- 🔍 高清图片预览
- 📱 手机拍照直接上传
- 🗑️ 一键删除照片

### 📝 碎碎念功能
- ✨ 记录日常小确幸
- 🎨 多彩便签样式
- 👨‍💻 管理员可删除任意内容
- 📅 时间戳显示
- 💝 爱心互动

### 🍜 美食打卡
- 🏪 餐厅名称记录
- ⭐ 1-5星评分系统
- 📍 地理位置标记
- 📝 详细描述
- 📸 美食照片上传
- 📅 打卡时间记录

### 📅 时间轴功能
- 📅 按时间线展示重要时刻
- 🏷️ 支持事件分类（纪念日、旅行、日常等）
- 🖼️ 支持多张图片
- 📝 详细描述
- 🔍 按分类筛选
- 📱 时间轴滑动体验

### ✅ 甜蜜待办
- 📋 创建待办事项
- 🎯 优先级设置（高/中/低）
- ✅ 完成状态跟踪
- 🗓️ 截止日期
- 📱 手机端快速添加
- 🎉 完成庆祝动画

### 👨‍💻 管理后台
- 🔐 安全登录验证
- 📊 一站式内容管理
- 🖼️ 图片批量管理
- ⚙️ 网站设置（标题、描述、背景等）
- 📱 移动端管理界面
- 🔄 实时数据同步

## 🎯 使用技巧

### 🚀 快速上手
1. **首次访问**: 使用管理员账号登录
   - 用户名: `baobao`
   - 密码: `baobao123`

2. **基础设置**: 进入管理后台设置情侣姓名、纪念日期、网站标题等
3. **开始使用**: 直接上传照片、添加碎碎念、记录美食等

### 📱 移动端优化
- **拍照上传**: 手机可直接拍照上传到相册
- **快速添加**: 支持语音输入待办事项
- **手势操作**: 支持左滑删除、长按编辑等手势

### 💡 高级技巧
- **图片优化**: 上传前自动压缩，保证清晰度同时减小体积
- **批量操作**: 支持批量删除、批量移动照片
- **数据安全**: 自动云端备份，无需担心数据丢失
- **分享功能**: 支持生成分享链接给朋友

### 🔧 故障排除
- **登录问题**: 使用 `/debug_token.html` 检查token状态
- **图片上传**: 检查R2存储桶权限和网络连接
- **数据库**: 使用D1控制台查看数据状态

## 🤝 贡献

欢迎提交Issue和Pull Request！

### 📋 开发规范
- 使用ESLint + Prettier保持代码风格
- 提交前运行 `npm run lint` 检查代码
- 使用语义化提交信息
- 大功能请先在Issue中讨论

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 💝 致谢

- **Cloudflare**: 提供优秀的全栈无服务器平台
- **React社区**: 提供强大的前端框架
- **Tailwind CSS**: 提供优雅的样式解决方案
- **所有贡献者**: 感谢每一位为这个项目贡献的朋友

## 📞 联系方式

- **项目地址**: [https://github.com/Misaka450/baoandkai](https://github.com/Misaka450/baoandkai)
- **演示地址**: [https://baoandkai.pages.dev](https://baoandkai.pages.dev)
- **管理后台**: [https://baoandkai.pages.dev/admin](https://baoandkai.pages.dev/admin)

---

<div align="center">
  <p>💖 用爱构建，用心记录 💖</p>
  <p><em>每一个瞬间都值得被珍藏</em></p>
</div>
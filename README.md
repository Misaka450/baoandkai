# 包包和恺恺的小窝 💕

一个温馨的小窝网站，记录包包和恺恺的美好时光。

## ✨ 功能特色

- 🏠 **温馨首页** - 展示情侣信息和纪念日倒计时
- 📸 **回忆相册** - 上传和管理美好瞬间的照片
- 📝 **碎碎念** - 记录日常的小确幸和心情
- 🍜 **美食打卡** - 记录一起品尝的美食
- 📅 **时间轴** - 按时间线展示重要时刻
- ✅ **甜蜜待办** - 一起完成的小目标清单
- 👨‍💻 **管理后台** - 便捷的内容管理界面

## 🚀 技术栈

- **前端**: React + Vite + Tailwind CSS
- **后端**: Cloudflare Pages Functions
- **数据库**: Cloudflare D1 (SQLite)
- **存储**: Cloudflare R2
- **部署**: GitHub Actions + Cloudflare Pages

## 📦 快速开始

### 开发环境

1. **克隆项目**
   ```bash
   git clone [你的仓库地址]
   cd 包包和恺恺的小窝
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **本地开发**
   ```bash
   npm run dev
   ```

### 生产部署

1. **构建项目**
   ```bash
   npm run build
   ```

2. **部署到Cloudflare**
   ```bash
   npm run deploy
   ```

## 🔧 环境配置

### Cloudflare配置

在 `wrangler.toml` 中配置你的资源：

```toml
name = "baoandkai-xiaowo"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "your-database-name"
database_id = "your-database-id"

[[r2_buckets]]
binding = "ouralbum"
bucket_name = "your-bucket-name"
```

### 数据库初始化

运行数据库迁移：

```bash
npm run db:migrate
```

## 📱 功能详解

### 相册功能
- 📁 创建和管理相册
- 🖼️ 批量上传照片
- 🎯 拖拽排序
- 🔍 图片预览
- 📱 响应式设计

### 时间轴功能
- 📅 时间线展示
- 🏷️ 事件分类
- 🖼️ 支持图片
- 🎯 搜索过滤

### 美食打卡
- 🍽️ 餐厅信息记录
- ⭐ 评分系统
- 📍 地理位置
- 🖼️ 美食照片

## 🎯 使用技巧

1. **首次使用**: 使用管理员账号登录后台，设置基本信息
2. **上传照片**: 建议使用压缩后的图片，加载更快
3. **数据备份**: 定期导出数据库备份
4. **移动端**: 支持手机拍照直接上传

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 💝 致谢

感谢Cloudflare提供的优秀服务，让这个温馨的小窝能够稳定运行。

---

**小窝地址**: [你的域名]
**管理后台**: [你的域名]/admin
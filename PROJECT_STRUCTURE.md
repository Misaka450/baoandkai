# 🏗️ 项目结构整理指南

## 📂 当前项目结构

```
baoandkai/
├── 📁 public/                    # 静态资源
├── 📁 src/                       # 源代码
│   ├── 📁 components/           # 通用组件
│   ├── 📁 pages/                # 页面组件
│   ├── 📁 contexts/             # React上下文
│   ├── 📁 hooks/                # 自定义Hooks
│   ├── 📁 utils/                # 工具函数
│   ├── 📁 config/               # 配置文件
│   ├── 📁 services/             # API服务
│   ├── 📁 styles/               # 样式文件
│   └── 📁 assets/               # 图片等资源
├── 📁 functions/                # Cloudflare Functions
├── 📁 migrations/               # 数据库迁移
└── 📁 docs/                     # 项目文档
```

## 🎯 整理步骤

### 1️⃣ 统一组件规范
- [ ] 创建统一的LoadingSpinner组件
- [ ] 创建统一的ErrorBoundary组件
- [ ] 创建统一的Modal组件
- [ ] 统一按钮样式

### 2️⃣ 代码重构
- [ ] 提取重复逻辑到hooks
- [ ] 统一API调用方式
- [ ] 优化错误处理
- [ ] 添加TypeScript支持

### 3️⃣ 性能优化
- [ ] 实现图片懒加载
- [ ] 添加代码分割
- [ ] 优化打包体积
- [ ] 添加缓存策略

### 4️⃣ 开发体验
- [ ] 添加开发文档
- [ ] 创建组件示例
- [ ] 添加单元测试
- [ ] 配置ESLint规则

## 📋 文件命名规范

### 组件文件
- 组件: `PascalCase.jsx`
- 样式: `PascalCase.module.css`
- 测试: `PascalCase.test.jsx`

### 工具文件
- 工具函数: `camelCase.js`
- 配置文件: `kebab-case.js`
- 常量文件: `UPPER_SNAKE_CASE.js`

### 页面文件
- 页面: `PascalCase.jsx`
- 路由: `kebab-case.jsx`

## 🔧 开发规范

### 代码风格
- 使用ES6+语法
- 统一的缩进（2个空格）
- 添加JSDoc注释
- 避免魔法数字

### 组件设计
- 单一职责原则
- Props类型检查
- 可复用性优先
- 渐进式增强

### 性能最佳实践
- 避免不必要的重渲染
- 使用React.memo优化
- 合理使用useCallback
- 图片优化和懒加载
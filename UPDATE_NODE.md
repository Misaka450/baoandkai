# 更新Node.js到v18+（Windows系统）

## 方法1：使用官方安装程序（推荐）

1. **下载Node.js v18或更高版本**
   - 访问：https://nodejs.org/
   - 下载LTS版本（推荐v20.x.x）
   - 运行下载的安装程序
   - 按照向导完成安装（会自动覆盖旧版本）

2. **验证安装**
   ```bash
   node --version
   npm --version
   ```

## 方法2：使用nvm-windows（推荐开发者）

1. **下载nvm-windows**
   - 访问：https://github.com/coreybutler/nvm-windows/releases
   - 下载最新版本的nvm-setup.exe
   - 运行安装程序

2. **使用nvm管理Node.js版本**
   ```bash
   # 安装最新LTS版本
   nvm install lts
   
   # 切换到最新版本
   nvm use lts
   
   # 验证版本
   node --version
   ```

## 方法3：使用Chocolatey（如果已安装）

```bash
# 更新Node.js
choco upgrade nodejs

# 验证版本
node --version
```

## 更新后操作

完成Node.js更新后，在您的项目目录执行：

```bash
# 清理node_modules和package-lock.json
rm -rf node_modules package-lock.json

# 重新安装依赖
npm install

# 升级到wrangler v4
npm install wrangler@latest --save-dev

# 验证wrangler版本
npx wrangler --version
```

## 注意事项

- 更新Node.js前建议备份项目
- 更新后可能需要重新安装全局包
- 某些旧项目可能需要调整配置

完成Node.js更新后，我们将能够使用wrangler v4的新功能，包括：
- 更好的D1数据库集成
- 改进的配置格式
- 更快的部署速度
- 更好的错误处理
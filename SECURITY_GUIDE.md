# 安全配置指南

## 错误边界组件使用说明

### ErrorBoundary 组件

项目已添加统一的错误边界组件，位于 `src/components/common/ErrorBoundary.jsx`

#### 基本用法

```jsx
import ErrorBoundary from '@/components/common/ErrorBoundary';

// 包裹需要错误保护的组件
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// 使用自定义降级UI
<ErrorBoundary fallback={<div>自定义错误页面</div>}>
  <YourComponent />
</ErrorBoundary>
```

#### 高阶组件用法

```jsx
import { withErrorBoundary } from '@/components/common/ErrorBoundary';

const ProtectedComponent = withErrorBoundary(YourComponent, <div>错误页面</div>);
```

#### Hook 用法

```jsx
import { useErrorBoundary } from '@/components/common/ErrorBoundary';

function YourComponent() {
  const { error, handleError, resetError } = useErrorBoundary();
  
  // 手动捕获错误
  const riskyOperation = () => {
    try {
      // 可能出错的操作
    } catch (error) {
      handleError(error);
    }
  };
}
```

## 环境变量配置

### 需要配置的环境变量

在 Cloudflare Pages 的环境变量设置中配置以下变量：

| 变量名 | 说明 | 建议值 |
|--------|------|--------|
| `ADMIN_TOKEN` | 管理员认证token | 随机UUID (`crypto.randomUUID()`) |
| `DEFAULT_PASSWORD_HASH` | 默认密码哈希值（可选） | bcrypt哈希值 |

### 生成安全的 ADMIN_TOKEN

```javascript
// 在浏览器控制台生成安全的token
console.log(crypto.randomUUID());
// 输出示例: "123e4567-e89b-12d3-a456-426614174000"
```

### 生成密码哈希值

```bash
# 使用Node.js生成bcrypt哈希值
node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
```

## 安全最佳实践

1. **不要硬编码敏感信息**
   - 所有敏感信息都应通过环境变量配置
   - 避免在代码中直接写入密码、token等

2. **使用随机token**
   - 管理员token应使用随机生成的UUID
   - 定期更换重要token

3. **错误处理**
   - 使用ErrorBoundary组件捕获界面错误
   - 生产环境不应显示详细错误信息

4. **环境分离**
   - 开发、测试、生产环境使用不同的配置
   - 敏感信息不应提交到版本控制系统

## 部署说明

1. 在 Cloudflare Pages 项目中设置环境变量
2. 确保 `ADMIN_TOKEN` 已配置为随机值
3. 部署后测试登录功能是否正常

## 故障排除

如果登录出现问题：

1. 检查环境变量是否正确设置
2. 验证token格式是否正确
3. 查看浏览器控制台和网络请求

## 文件变更总结

- ✅ 添加错误边界组件: `src/components/common/ErrorBoundary.jsx`
- ✅ 移除硬编码token: `.env.production`
- ✅ 更新登录逻辑: `functions/api/auth/login.js`
- ✅ 安全化密码更新接口: `functions/api/auth/update-password-hash.js`
- ✅ 更新配置说明: `wrangler.toml`
- ✅ 添加安全指南: `SECURITY_GUIDE.md`

所有修改均已确保向后兼容，不会影响现有功能。
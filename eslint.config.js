import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'

/**
 * ESLint 9 扁平配置
 *
 * 说明：
 * - 首次引入 Lint，采取"高价值规则优先"策略：
 *   no-explicit-any 暂不启用（存量代码 any 较多，避免一次性大改引入风险）；
 * - react-hooks 规则是重点：能在编译期发现 useEffect 依赖缺失、
 *   条件调用 Hook 等隐蔽 bug；
 * - server 目录按 Node.js 环境检查，前端按浏览器环境检查。
 */
export default tseslint.config(
  // 忽略构建产物与依赖目录
  {
    ignores: [
      'dist/**',
      'server/dist/**',
      'release/**',
      '**/node_modules/**',
      'src/data/province-city-paths/**', // 生成的纯数据文件，无检查价值
    ],
  },
  // 基础推荐规则（前端 + 后端通用）
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // 渐进治理：存量代码 any 较多（约 70 处），先降为警告，随迭代逐步消除
      '@typescript-eslint/no-explicit-any': 'warn',
      // 未使用变量同样是存量较多（约 30 处），先降为警告渐进清理
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-require-imports': 'error',
      // 空 catch 是常见合法模式（如"尝试解析 JSON，失败则忽略"），不报错
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    // 前端代码：浏览器全局环境 + React Hooks 规则
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules,
      // 渐进治理：以下三条是 React Compiler 系规则，存量代码中属常见模式
      // （渲染期取随机数/时间、effect 内同步 setState），修复需要重构数据流，
      // 先降为警告随迭代逐步消除
      'react-hooks/purity': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      // 组件文件允许导出工具函数，宽松处理
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // 后端代码：Node.js 全局环境
    files: ['server/src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
  },
)

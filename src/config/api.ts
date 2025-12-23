/**
 * API 配置
 */

// 根据环境自动选择API端点
const isProduction: boolean = import.meta.env.PROD

export const API_BASE: string = isProduction
    ? '/api'  // 生产环境使用相对路径（Cloudflare Pages Functions）
    : '/api'  // 开发环境也使用相对路径，通过vite代理

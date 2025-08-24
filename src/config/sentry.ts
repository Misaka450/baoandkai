import * as Sentry from '@sentry/react'

// Sentry错误监控配置
export const initSentry = (): void => {
  if (import.meta.env.PROD) {
    // 只在生产环境初始化Sentry
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN, // 从环境变量获取DSN
      environment: import.meta.env.MODE,
      // 性能监控配置
      integrations: [],
      // 性能采样率
      tracesSampleRate: 0.1,
      // Session Replay采样率
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    })
  }
}

// 错误边界组件包装器
export const withSentryErrorBoundary = (Component: React.ComponentType): React.ComponentType => {
  return Sentry.withErrorBoundary(Component, {
    // 错误降级UI
    fallback: () => React.createElement('div', { className: 'p-4 text-red-600' }, '页面加载失败，请刷新重试'),
    // 错误发生时触发
    onError: (error) => {
      console.error('组件错误:', error)
    },
  })
}
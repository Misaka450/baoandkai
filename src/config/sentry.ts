// Sentry错误监控配置 - 彻底按需动态加载，避免首屏静态打包与带宽占用
export const initSentry = async (): Promise<void> => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    const Sentry = await import('@sentry/react')
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    })
  }
}

/**
 * 捕获并上报异常（生产环境下异步按需唤醒 Sentry，开发环境输出控制台）
 */
export const captureError = (error: unknown, extra?: Record<string, unknown>): void => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    import('@sentry/react')
      .then((Sentry) => {
        Sentry.captureException(error, { extra })
      })
      .catch(() => {})
  } else if (import.meta.env.DEV) {
    console.warn('[Error Captured]', error, extra)
  }
}

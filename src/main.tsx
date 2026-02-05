import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// 延迟加载 Sentry（不阻塞首屏渲染）
if (import.meta.env.PROD) {
  // 使用 requestIdleCallback 在浏览器空闲时初始化 Sentry
  const initSentryLazy = () => {
    import('./config/sentry').then(({ initSentry }) => initSentry())
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(initSentryLazy, { timeout: 2000 })
  } else {
    // 降级方案：延迟 2 秒执行
    setTimeout(initSentryLazy, 2000)
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5分钟内数据被视为新鲜，不会重新请求
      gcTime: 30 * 60 * 1000,   // 30分钟后清理缓存
    },
  },
})

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  </React.StrictMode>,
)
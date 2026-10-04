import React from 'react'
import Icon from '../icons/Icons'
import * as Sentry from '@sentry/react'

interface RouteErrorBoundaryProps {
  children: React.ReactNode
}

interface RouteErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

// 路由级错误边界 - 单个页面崩溃不影响全局
class RouteErrorBoundary extends React.Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('页面错误:', error, errorInfo)
    if (import.meta.env.PROD) {
      Sentry.captureException(error, {
        contexts: { react: { componentStack: errorInfo.componentStack } }
      })
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 text-slate-700">
          <div className="glass-card rounded-[2rem] p-8 max-w-md w-full border border-white/60 shadow-xl text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#FFEDF3] text-morandi-rose border border-rose-100/60 rounded-full mb-4 shadow-inner">
              <Icon name="warning" size={26} />
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-2 tracking-tight">页面出了点小问题</h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              这个页面暂时遇到了一点波折，但其他美好依然陪伴着你。
            </p>
            {import.meta.env.DEV && this.state.error && (
              <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-3 mb-5 text-left">
                <p className="text-xs text-rose-600 font-mono break-all">{this.state.error.message}</p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.resetError}
                className="px-6 py-2.5 bg-primary text-white rounded-full font-bold text-sm shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                重试
              </button>
              <button
                onClick={() => window.location.href = "/"}
                className="px-6 py-2.5 bg-stone-100 text-stone-700 rounded-full font-bold text-sm hover:bg-stone-200 active:scale-95 transition-all"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default RouteErrorBoundary

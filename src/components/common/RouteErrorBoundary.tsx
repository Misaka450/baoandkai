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
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 rounded-full mb-4">
              <Icon name="warning" size={28} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">页面出了点问题</h2>
            <p className="text-gray-500 mb-6">
              这个页面遇到了错误，但其他页面仍然正常。
            </p>
            {import.meta.env.DEV && this.state.error && (
              <div className="bg-red-50 rounded-lg p-3 mb-4 text-left">
                <p className="text-xs text-red-600 font-mono break-all">{this.state.error.message}</p>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.resetError}
                className="px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium"
              >
                重试
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
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

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
}

/**
 * 全局错误边界组件
 * 捕获子组件树中的JavaScript错误，并显示备用UI
 */
class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        }
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.setState({ errorInfo })
        // 可以在这里添加错误上报逻辑
        console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    handleRetry = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        })
    }

    render(): ReactNode {
        if (this.state.hasError) {
            // 如果提供了自定义fallback，使用它
            if (this.props.fallback) {
                return this.props.fallback
            }

            // 默认错误UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 max-w-lg mx-4 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                        <div className="text-center">
                            {/* 错误图标 */}
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-100 to-rose-100 rounded-full mb-6">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>

                            <h2 className="text-2xl font-light text-stone-800 mb-3">
                                哎呀，出错了
                            </h2>
                            <p className="text-stone-600 font-light mb-6">
                                页面遇到了一些问题，请尝试刷新页面或稍后再试
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button
                                    onClick={this.handleRetry}
                                    className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-light hover:from-rose-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                                >
                                    重试
                                </button>
                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="px-6 py-3 bg-stone-100 text-stone-700 rounded-xl font-light hover:bg-stone-200 transition-all duration-300"
                                >
                                    返回首页
                                </button>
                            </div>

                            {/* 开发模式显示错误详情 */}
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="mt-6 text-left">
                                    <summary className="text-sm text-stone-500 cursor-pointer hover:text-stone-700">
                                        错误详情（仅开发模式可见）
                                    </summary>
                                    <div className="mt-2 p-4 bg-stone-50 rounded-xl text-xs font-mono text-red-600 overflow-auto max-h-48">
                                        <p className="font-bold">{this.state.error.toString()}</p>
                                        {this.state.errorInfo && (
                                            <pre className="mt-2 whitespace-pre-wrap">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        )}
                                    </div>
                                </details>
                            )}
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary

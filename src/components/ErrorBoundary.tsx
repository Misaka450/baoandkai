import React, { Component, ErrorInfo, ReactNode } from 'react'
import Icon from './icons/Icons'

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
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
                    <div className="premium-card max-w-lg w-full !p-12 text-center animate-fade-in relative overflow-hidden">
                        {/* 装饰性背景 */}
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none rotate-12">
                            <Icon name="favorite" size={120} />
                        </div>

                        <div className="mb-10 relative inline-block">
                            <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full animate-pulse"></div>
                            <div className="relative w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-primary transform rotate-12 transition-transform hover:rotate-0">
                                <Icon name="report_problem" size={40} />
                            </div>
                        </div>

                        <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tighter">
                            出了点小意外
                        </h2>
                        <p className="text-slate-400 font-medium mb-10 leading-relaxed px-4">
                            记忆长廊暂时关闭维护中...<br />请尝试刷新，或稍后再来探索。
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                            <button
                                onClick={this.handleRetry}
                                className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200"
                            >
                                进行重试
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="px-10 py-4 bg-white text-slate-400 border border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all"
                            >
                                返回首页
                            </button>
                        </div>

                        {this.state.error && (
                            <div className="mt-12 text-left">
                                <details className="group">
                                    <summary className="text-[10px] font-black text-slate-300 cursor-pointer uppercase tracking-widest hover:text-primary transition-colors">
                                        TECHNICAL DETAILS (点击展开)
                                    </summary>
                                    <div className="mt-4 p-6 bg-slate-50 rounded-2xl text-[10px] font-mono text-slate-500 overflow-auto max-h-48 border border-slate-100 italic leading-relaxed select-text">
                                        <p className="font-bold text-red-400 mb-2">{this.state.error.toString()}</p>
                                        {this.state.errorInfo && (
                                            <pre className="whitespace-pre-wrap opacity-60">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        )}
                                    </div>
                                </details>
                            </div>
                        )}
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary

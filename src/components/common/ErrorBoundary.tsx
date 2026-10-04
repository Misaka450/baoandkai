import React from 'react';
import Icon from '../icons/Icons';
import * as Sentry from '@sentry/react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * 错误边界组件 - 捕获并显示React组件树中的JavaScript错误
 * 使用方式：将需要错误保护的组件包裹在<ErrorBoundary>中
 * @example
 * <ErrorBoundary fallback={<div>出错了</div>}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: any) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  /**
   * 静态方法 - 当子组件抛出错误时被调用
   * @param {Error} error - 捕获的错误对象
   * @returns {Object} 更新state的对象
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 当发生错误时更新state，触发重新渲染显示降级UI
    return { hasError: true };
  }

  /**
   * 生命周期方法 - 错误发生时被调用
   * @param {Error} error - 被抛出的错误
   * @param {Object} errorInfo - 包含组件栈信息的对象
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // 你可以在这里记录错误信息到错误报告服务
    console.error('组件错误:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // 可选：发送错误信息到监控服务
    this.reportError(error, errorInfo);
  }

  /**
   * 报告错误到监控服务（集成Sentry）
   * @param {Error} error - 错误对象
   * @param {Object} errorInfo - 错误信息
   */
  reportError(error: Error, errorInfo: React.ErrorInfo) {
    // 集成Sentry错误监控
    if (import.meta.env.PROD) {
      Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      });
    } else {
      console.error('开发环境错误:', error, errorInfo);
    }
  }

  /**
   * 重置错误状态并重新渲染
   */
  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
  }

  /**
   * 返回首页
   */
  goHome = () => {
    window.location.href = '/';
  }

  /**
   * 重新加载页面
   */
  reloadPage = () => {
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      // 自定义降级UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误页面 - 适配莫兰迪温暖调性
      return (
        <div className="min-h-screen bg-background-light flex items-center justify-center p-4 relative overflow-hidden text-slate-700">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-rose-200/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-amber-200/20 blur-3xl pointer-events-none" />

          <div className="glass-card rounded-[2.5rem] shadow-2xl p-6 sm:p-10 max-w-lg w-full mx-4 border border-white/60 relative z-10 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#FFEDF3] text-morandi-rose border border-rose-100 flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Icon name="warning" size={30} />
              </div>

              <h1 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">
                哎呀，出错了！
              </h1>

              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                页面加载时遇到了一点小麻烦，别担心，回忆一直都在 ❤️
              </p>

              {/* 开发环境显示详细错误信息 */}
              {import.meta.env.DEV && this.state.error && (
                <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4 mb-6 text-left">
                  <h3 className="font-bold text-rose-800 text-xs mb-1">错误详情：</h3>
                  <p className="text-xs text-rose-600 font-mono break-all leading-relaxed mb-2">{this.state.error.toString()}</p>

                  {this.state.errorInfo && this.state.errorInfo.componentStack && (
                    <details className="text-[11px] text-slate-400">
                      <summary className="cursor-pointer hover:text-slate-600">组件堆栈跟踪</summary>
                      <pre className="mt-2 overflow-auto max-h-36 text-[10px] font-mono p-2 bg-white/60 rounded-xl">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.resetError}
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-primary text-white rounded-full font-bold text-sm shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <Icon name="refresh" size={16} className="mr-1.5" />
                  重试
                </button>

                <button
                  onClick={this.reloadPage}
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-stone-100 text-stone-700 rounded-full font-bold text-sm hover:bg-stone-200 active:scale-95 transition-all"
                >
                  重新加载
                </button>

                <button
                  onClick={this.goHome}
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-morandi-rose to-rose-400 text-white rounded-full font-bold text-sm shadow-md hover:scale-105 active:scale-95 transition-all"
                >
                  <Icon name="home" size={16} className="mr-1.5" />
                  返回首页
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 正常情况下渲染子组件
    return this.props.children;
  }
}

// 高阶组件：包装组件提供错误边界保护
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
): React.ComponentType<P> => {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
};

// 自定义hook：在函数组件中捕获错误
export const useErrorBoundary = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    console.error('useErrorBoundary捕获错误:', error);
    setError(error);
    
    // 集成Sentry错误监控
    if (import.meta.env.PROD) {
      Sentry.captureException(error);
    }
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, resetError };
};

export default ErrorBoundary;

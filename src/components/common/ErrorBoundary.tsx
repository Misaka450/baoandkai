import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
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

      // 默认错误页面
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full mx-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                哎呀，出错了！
              </h1>
              
              <p className="text-gray-600 mb-6">
                页面加载时遇到了问题。这可能是因为网络连接问题或代码更新导致的。
              </p>

              {/* 开发环境显示详细错误信息 */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-semibold text-gray-900 mb-2">错误详情：</h3>
                  <p className="text-sm text-red-600 mb-2">{this.state.error.toString()}</p>
                  
                  {this.state.errorInfo && this.state.errorInfo.componentStack && (
                    <details className="text-xs text-gray-500">
                      <summary>组件堆栈跟踪</summary>
                      <pre className="mt-2 overflow-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={this.resetError}
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重试
                </button>
                
                <button
                  onClick={this.reloadPage}
                  className="inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  重新加载页面
                </button>
                
                <button
                  onClick={this.goHome}
                  className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Home className="w-4 h-4 mr-2" />
                  返回首页
                </button>
              </div>

              <p className="text-sm text-gray-500 mt-6">
                如果问题持续存在，请联系技术支持。
              </p>
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
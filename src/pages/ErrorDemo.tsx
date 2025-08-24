import React, { useState } from 'react';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import Layout from '@/components/Layout';
import { AlertTriangle, Code, Play, Shield } from 'lucide-react';

// 定义ErrorProneComponent的props接口
interface ErrorProneComponentProps {
  shouldThrow: boolean;
}

// 会抛出错误的演示组件
const ErrorProneComponent: React.FC<ErrorProneComponentProps> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('这是一个演示错误！');
  }
  return (
    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
      <div className="flex items-center">
        <Shield className="w-5 h-5 mr-2" />
        <span>组件正常运行中</span>
      </div>
    </div>
  );
};

// 错误边界演示组件
const ErrorBoundaryDemo: React.FC = () => {
  const [shouldThrow, setShouldThrow] = useState(false);

  return (
    <ErrorBoundary>
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShouldThrow(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <Play className="w-4 h-4 mr-2" />
            触发错误
          </button>
          
          <button
            onClick={() => setShouldThrow(false)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            恢复正常
          </button>
        </div>
        
        <ErrorProneComponent shouldThrow={shouldThrow} />
      </div>
    </ErrorBoundary>
  );
};

const ErrorDemo: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-blue-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            错误边界演示
          </h1>
          
          <p className="text-gray-600">
            这个页面展示了如何使用ErrorBoundary组件来捕获和处理React组件中的错误
          </p>
        </div>

        {/* 功能演示区域 */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* 实时演示 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Play className="w-5 h-5 mr-2 text-blue-600" />
              实时演示
            </h2>
            
            <p className="text-gray-600 mb-4">
              点击下面的按钮来触发组件错误，观察ErrorBoundary如何捕获并显示友好的错误页面
            </p>
            
            <ErrorBoundaryDemo />
          </div>

          {/* 代码示例 */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Code className="w-5 h-5 mr-2 text-gray-600" />
              代码示例
            </h2>
            
            <div className="bg-black rounded-lg p-4 overflow-x-auto">
              <code className="text-white text-sm">
                <pre>{`// 基本用法
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// 自定义降级UI
<ErrorBoundary fallback={<div>自定义错误页面</div>}>
  <YourComponent />
</ErrorBoundary>

// 高阶组件用法
const ProtectedComponent = withErrorBoundary(YourComponent);

// Hook用法
const { error, handleError } = useErrorBoundary();`}</pre>
              </code>
            </div>
          </div>
        </div>

        {/* 功能特性 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            ErrorBoundary 特性
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div className="ml-3">
                <h3 className="font-medium text-gray-900">错误隔离</h3>
                <p className="text-gray-600 text-sm">
                  单个组件的错误不会导致整个应用崩溃
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-green-600" />
                </div>
              </div>
              <div className="ml-3">
                <h3 className="font-medium text-gray-900">友好界面</h3>
                <p className="text-gray-600 text-sm">
                  提供用户友好的错误页面和恢复选项
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Code className="w-4 h-4 text-purple-600" />
                </div>
              </div>
              <div className="ml-3">
                <h3 className="font-medium text-gray-900">多种用法</h3>
                <p className="text-gray-600 text-sm">
                  支持组件、高阶组件、Hook三种使用方式
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-orange-600" />
                </div>
              </div>
              <div className="ml-3">
                <h3 className="font-medium text-gray-900">生产就绪</h3>
                <p className="text-gray-600 text-sm">
                  生产环境自动隐藏详细错误信息
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 使用建议 */}
        <div className="bg-blue-50 rounded-2xl p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">使用建议</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• 在路由级别包裹ErrorBoundary来捕获页面级错误</li>
            <li>• 在关键业务组件周围添加错误边界</li>
            <li>• 使用自定义fallback提供特定场景的错误处理</li>
            <li>• 在生产环境中集成错误监控服务</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default ErrorDemo;
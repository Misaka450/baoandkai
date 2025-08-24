import { AlertCircle, RefreshCw } from 'lucide-react'

// 定义组件属性接口
interface ErrorMessageProps {
  message?: string
  onRetry?: () => void
  className?: string
}

/**
 * 统一的错误提示组件
 * @param props - 组件属性
 * @param props.message - 错误消息
 * @param props.onRetry - 重试函数
 * @param props.className - 额外样式类
 */
export default function ErrorMessage({ 
  message = '出错了，请稍后重试', 
  onRetry,
  className = '' 
}: ErrorMessageProps) {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 p-8 text-center ${className}`}>
      <div className="rounded-full bg-red-100 p-3">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <p className="text-gray-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center space-x-2 rounded-lg bg-pink-500 px-4 py-2 text-white transition-colors hover:bg-pink-600"
        >
          <RefreshCw className="h-4 w-4" />
          <span>重试</span>
        </button>
      )}
    </div>
  )
}
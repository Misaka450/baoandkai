import { Loader2 } from 'lucide-react'

// 定义组件属性接口
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

/**
 * 统一的加载动画组件
 * @param props - 组件属性
 * @param props.size - 尺寸: 'sm' | 'md' | 'lg'
 * @param props.text - 加载文字
 * @param props.className - 额外样式类
 */
export default function LoadingSpinner({ 
  size = 'md', 
  text = '加载中...', 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-pink-500`} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  )
}
import React from 'react'

// 定义加载组件属性接口
interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * 加载旋转器组件
 * 用于显示加载状态的旋转动画
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = '加载中...', 
  size = 'md' 
}) => {
  // 根据尺寸设置不同的样式
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      {/* 旋转动画 */}
      <div 
        className={`${sizeClasses[size]} border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin`}
      />
      
      {/* 加载文字 */}
      {message && (
        <p className="text-sm text-stone-600 font-light">{message}</p>
      )}
    </div>
  )
}

export default LoadingSpinner
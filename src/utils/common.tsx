// 公共工具函数 - TypeScript版本
import React from 'react'

// 防抖函数 - 避免频繁请求
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: ReturnType<typeof setTimeout> | null = null
    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            if (timeout) {
                clearTimeout(timeout)
            }
            func(...args)
        }
        if (timeout) {
            clearTimeout(timeout)
        }
        timeout = setTimeout(later, wait)
    }
}

// 日期格式化
export const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

// 优先级类型
export type Priority = 'high' | 'medium' | 'low'

// 优先级映射
export const mapPriority = (priority: number): Priority => {
    if (priority >= 3) return 'high'
    if (priority <= 1) return 'low'
    return 'medium'
}

// 优先级颜色
export const priorityColors: Record<Priority, string> = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200'
}

// 加载状态组件属性接口
interface LoadingSpinnerProps {
    message?: string
}

// 加载状态组件
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = '加载中...' }) => {
    return (
        <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            {message && <span className="ml-3 text-gray-600">{message}</span>}
        </div>
    )
}

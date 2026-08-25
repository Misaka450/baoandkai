import { HTMLAttributes, ReactNode } from 'react'
import { CARD_VARIANTS, CardVariant } from '../../../constants/styles'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  variant?: CardVariant
}

export default function Card({
  children,
  padding = 'md',
  hover = false,
  variant,
  className = '',
  ...props
}: CardProps) {
  // 基础样式：统一莫兰迪风格圆角和柔和阴影
  const baseStyles = 'bg-white rounded-2xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden'

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  // 悬停效果：平滑浮起与加深阴影
  const hoverStyles = hover ? 'hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-200' : ''

  // 卡片变体样式
  const variantStyles = variant ? CARD_VARIANTS[variant].container : ''

  return (
    <div className={`${variantStyles || baseStyles} ${paddings[padding]} ${hoverStyles} ${className}`} {...props}>
      {children}
    </div>
  )
}

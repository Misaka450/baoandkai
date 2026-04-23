import { HTMLAttributes, ReactNode } from 'react'
import { DESIGN_TOKENS, CARD_VARIANTS, CardVariant } from '../../../constants/styles'

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
  // 基础样式：统一圆角和阴影
  const baseStyles = `bg-white rounded-[${DESIGN_TOKENS.borderRadius.card}] border border-slate-200/80 shadow-[${DESIGN_TOKENS.shadow.card}] overflow-hidden`

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  // 悬停效果：统一阴影
  const hoverStyles = hover ? `hover:shadow-[${DESIGN_TOKENS.shadow.hover}] hover:-translate-y-0.5 transition-all duration-200` : ''

  // 卡片变体样式
  const variantStyles = variant ? CARD_VARIANTS[variant].container : ''

  return (
    <div className={`${variantStyles || baseStyles} ${paddings[padding]} ${hoverStyles} ${className}`} {...props}>
      {children}
    </div>
  )
}

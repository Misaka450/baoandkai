import { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

export default function Card({
  children,
  padding = 'md',
  hover = false,
  className = '',
  ...props
}: CardProps) {
  const baseStyles = 'bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden'
  
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const hoverStyles = hover ? 'hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5 transition-all duration-200' : ''

  return (
    <div className={`${baseStyles} ${paddings[padding]} ${hoverStyles} ${className}`} {...props}>
      {children}
    </div>
  )
}

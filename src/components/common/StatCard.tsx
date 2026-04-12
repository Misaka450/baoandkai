import { memo } from 'react'
import { motion } from 'framer-motion'
import Icon, { type IconName } from '../icons/Icons'

interface StatCardProps {
  value: number | string
  label: string
  icon: IconName
  color: string
  text: string
  hoverScale?: number
  delay?: number
  className?: string
  showDecoration?: boolean
  decorationSize?: number
  size?: 'small' | 'normal' | 'large'
}

function StatCard({
  value,
  label,
  icon,
  color,
  text,
  hoverScale = 1.05,
  delay = 0,
  className = '',
  showDecoration = false,
  decorationSize = 48,
  size = 'normal'
}: StatCardProps) {
  const sizeStyles = {
    small: 'px-4 py-2 rounded-xl',
    normal: 'px-6 py-3 rounded-[1.5rem]',
    large: 'px-8 py-4 rounded-[2rem]'
  }

  return (
    <motion.div
      className={`${color} ${sizeStyles[size]} flex flex-col items-center justify-center shadow-sm border-4 border-white relative overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: hoverScale }}
    >
      {showDecoration && (
        <div className={`absolute -top-2 -right-2 opacity-[0.08] group-hover/item:opacity-20 transition-opacity rotate-12 ${text}`}>
          <Icon name={icon} size={decorationSize * 0.7} />
        </div>
      )}
      <div className="text-center">
        <div className={`text-3xl md:text-4xl font-black ${text} drop-shadow-sm leading-none mb-1`}>{value}</div>
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
      </div>
    </motion.div>
  )
}

export default memo(StatCard)

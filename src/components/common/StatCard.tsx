import { motion } from 'framer-motion'
import Icon, { type IconName } from '../icons/Icons'

interface StatCardProps {
  /** 统计值 */
  value: number | string
  /** 标签文字 */
  label: string
  /** 图标名称 */
  icon: IconName
  /** 背景颜色类名 */
  color: string
  /** 文字颜色类名 */
  text: string
  /** 悬停缩放比例，默认 1.05 */
  hoverScale?: number
  /** 动画延迟时间 */
  delay?: number
  /** 额外类名 */
  className?: string
  /** 是否显示装饰图标（右上角） */
  showDecoration?: boolean
  /** 装饰图标大小 */
  decorationSize?: number
  /** 卡片尺寸，默认 normal */
  size?: 'small' | 'normal' | 'large'
}

/**
 * 通用统计卡片组件
 * 用于展示统计数据，带有图标、颜色、动画效果
 */
export default function StatCard({
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
  // 根据尺寸定义样式
  const sizeStyles = {
    small: 'px-4 py-2 rounded-xl',
    normal: 'px-6 py-3 rounded-[1.5rem]',
    large: 'px-8 py-4 rounded-[2rem]'
  }

  return (
    <motion.div
      className={`${color} ${sizeStyles[size]} flex items-center gap-3 shadow-sm border-4 border-white relative overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: hoverScale }}
    >
      {/* 装饰图标 - 降低透明度，减小尺寸，避免喧宾夺主 */}
      {showDecoration && (
        <div className={`absolute -top-2 -right-2 opacity-[0.08] group-hover/item:opacity-20 transition-opacity rotate-12 ${text}`}>
          <Icon name={icon} size={decorationSize * 0.7} />
        </div>
      )}
      {/* 主图标 - 稍微增大 */}
      <Icon name={icon} size={20} className={text} />
      {/* 数字和标签 - 增大数字字体 */}
      <div className="text-left">
        <div className={`text-3xl md:text-4xl font-black ${text} drop-shadow-sm leading-none`}>{value}</div>
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</div>
      </div>
    </motion.div>
  )
}

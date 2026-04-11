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
  decorationSize = 48
}: StatCardProps) {
  return (
    <motion.div
      className={`${color} px-6 py-3 rounded-[1.5rem] flex items-center gap-3 shadow-sm border-4 border-white relative overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: hoverScale }}
    >
      {showDecoration && (
        <div className={`absolute -top-4 -right-4 opacity-10 group-hover/item:opacity-30 transition-opacity rotate-12 ${text}`}>
          <Icon name={icon} size={decorationSize} />
        </div>
      )}
      <Icon name={icon} size={18} className={text} />
      <div className="text-left">
        <div className={`text-2xl font-black ${text} drop-shadow-sm`}>{value}</div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
      </div>
    </motion.div>
  )
}

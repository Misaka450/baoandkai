import { useState } from 'react'
import { motion } from 'framer-motion'
import type { MapCheckin } from '../../types'
import Icon from '../icons/Icons'
import LazyImage from '../LazyImage'
import { getThumbnailUrl } from '../../utils/imageUtils'

interface TimelineProps {
    checkins: MapCheckin[]
    onCheckinClick?: (checkin: MapCheckin) => void
}

export default function Timeline({ checkins, onCheckinClick }: TimelineProps) {
    const [expandedId, setExpandedId] = useState<number | string | null>(null)

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr)
            return {
                full: date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
                short: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                day: date.getDate()
            }
        } catch {
            return { full: dateStr, short: dateStr, year: 0, month: 0, day: 0 }
        }
    }

    // 按年份分组
    const groupedByYear = checkins.reduce((acc, checkin) => {
        const { year } = formatDate(checkin.date)
        if (!acc[year]) {
            acc[year] = []
        }
        acc[year].push(checkin)
        return acc
    }, {} as Record<number, MapCheckin[]>)

    const sortedYears = Object.keys(groupedByYear).map(Number).sort((a, b) => b - a)

    return (
        <div className="space-y-12">
            {sortedYears.map(year => (
                <div key={year}>
                    {/* 年份标题 */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                                <Icon name="calendar_today" size={24} className="text-primary" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-800">{year}年</h2>
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent" />
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                            {groupedByYear[year].length} 次足迹
                        </span>
                    </div>

                    {/* 时间线 */}
                    <div className="relative">
                        {/* 时间轴线 */}
                        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" />

                        <div className="space-y-6">
                            {groupedByYear[year].map((checkin, idx) => {
                                const dateInfo = formatDate(checkin.date)
                                const isExpanded = expandedId === checkin.id

                                return (
                                    <motion.div
                                        key={checkin.id}
                                        className="relative pl-16"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                    >
                                        {/* 时间点 */}
                                        <div className="absolute left-4 top-0 w-4 h-4 rounded-full border-4 border-white shadow-lg"
                                            style={{
                                                background: isExpanded 
                                                    ? 'linear-gradient(135deg, #FF8BB1 0%, #FF6B9A 100%)'
                                                    : 'linear-gradient(135deg, #FFE0E9 0%, #FFC0D5 100%)'
                                            }}
                                        />

                                        {/* 卡片 */}
                                        <motion.div
                                            className={`premium-card !p-0 overflow-hidden cursor-pointer transition-all duration-300 ${
                                                isExpanded ? 'ring-2 ring-primary shadow-xl' : 'hover:shadow-lg'
                                            }`}
                                            onClick={() => onCheckinClick?.(checkin)}
                                            whileHover={{ y: -2 }}
                                        >
                                            <div className="flex">
                                                {/* 日期区域 */}
                                                <div className="w-24 bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex flex-col items-center justify-center border-r border-slate-100">
                                                    <span className="text-xs font-bold text-slate-400 uppercase">
                                                        {dateInfo.month}.{dateInfo.day}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-300 uppercase mt-1">
                                                        {['日', '一', '二', '三', '四', '五', '六'][new Date(checkin.date).getDay()]}
                                                    </span>
                                                </div>

                                                {/* 内容区域 */}
                                                <div className="flex-1 p-4">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <h3 className="font-black text-lg text-slate-800 mb-1">
                                                                {checkin.title}
                                                            </h3>
                                                            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                                                                <Icon name="location_on" size={12} className="text-primary/40" />
                                                                <span>{checkin.province}{checkin.city ? ` · ${checkin.city}` : ''}</span>
                                                            </div>
                                                            {checkin.description && (
                                                                <p className={`text-slate-400 text-xs leading-relaxed ${
                                                                    isExpanded ? '' : 'line-clamp-2'
                                                                }`}>
                                                                    {checkin.description}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* 缩略图 */}
                                                        {checkin.images && checkin.images.length > 0 && (
                                                            <div className="flex-shrink-0">
                                                                <div className="w-20 h-20 rounded-xl overflow-hidden shadow-sm">
                                                                    <LazyImage
                                                                        src={getThumbnailUrl(checkin.images[0], 200)}
                                                                        alt={checkin.title}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

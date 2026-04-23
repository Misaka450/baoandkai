import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { MapCheckin } from '../../types'
import Icon from '../icons/Icons'

interface AnnualReportProps {
    checkins: MapCheckin[]
    year: number
    onClose: () => void
}

export default function AnnualReport({ checkins, year, onClose }: AnnualReportProps) {
    const stats = useMemo(() => {
        if (checkins.length === 0) return null

        // 基础统计
        const provinces = new Set(checkins.map(c => c.province))
        const cities = new Set(checkins.map(c => `${c.province}-${c.city || ''}`))

        // 最爱目的地（打卡次数最多的城市）
        const cityCounts: Record<string, number> = {}
        checkins.forEach(c => {
            const key = c.city || c.province
            cityCounts[key] = (cityCounts[key] || 0) + 1
        })
        const favoriteCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0]

        // 第一次和最后一次旅行
        const sortedCheckins = [...checkins].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        const firstTrip = sortedCheckins[0]
        const lastTrip = sortedCheckins[sortedCheckins.length - 1]

        // 月度分布
        const monthCounts = new Array(12).fill(0)
        checkins.forEach(c => {
            const month = new Date(c.date).getMonth()
            monthCounts[month]++
        })
        const busiestMonth = monthCounts.reduce((max, count, idx) => 
            count > max.count ? { month: idx, count } : max, { month: 0, count: 0 }
        )

        return {
            provinces: provinces.size,
            cities: cities.size,
            totalCheckins: checkins.length,
            favoriteCity: favoriteCity ? { name: favoriteCity[0], count: favoriteCity[1] } : null,
            firstTrip,
            lastTrip,
            monthCounts,
            busiestMonth: { month: busiestMonth.month + 1, count: busiestMonth.count }
        }
    }, [checkins])

    if (!stats) return null

    const monthNames = ['1 月', '2 月', '3 月', '4 月', '5 月', '6 月', '7 月', '8 月', '9 月', '10 月', '11 月', '12 月']

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* 背景遮罩 */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* 报告卡片 */}
            <motion.div
                className="relative z-10 bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                transition={{ type: 'spring', duration: 0.5 }}
            >
                {/* 头部 */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-primary/10 via-primary/5 to-white px-8 py-6 border-b border-slate-100/50 flex items-center justify-between rounded-t-[2.5rem]">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                            <Icon name="auto_awesome" size={28} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800">{year}年度旅行报告</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Annual Travel Report</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white transition-all shadow-sm"
                    >
                        <Icon name="close" size={20} />
                    </button>
                </div>

                {/* 内容 */}
                <div className="p-8 space-y-8">
                    {/* 核心数据 */}
                    <div className="grid grid-cols-3 gap-4">
                        <motion.div
                            className="bg-gradient-to-br from-[#FFEDF3] to-[#FFE0E9] p-6 rounded-3xl text-center"
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="text-4xl font-black text-[#FF8BB1] mb-2">{stats.provinces}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">去过的省份</div>
                        </motion.div>
                        <motion.div
                            className="bg-gradient-to-br from-[#EBF7FF] to-[#E0F0FF] p-6 rounded-3xl text-center"
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="text-4xl font-black text-[#6BBFFF] mb-2">{stats.cities}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">去过的城市</div>
                        </motion.div>
                        <motion.div
                            className="bg-gradient-to-br from-[#F0FFF4] to-[#E0FFE9] p-6 rounded-3xl text-center"
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="text-4xl font-black text-[#6BCB77] mb-2">{stats.totalCheckins}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">总足迹数</div>
                        </motion.div>
                    </div>

                    {/* 最爱目的地 */}
                    {stats.favoriteCity && (
                        <motion.div
                            className="premium-card !p-6"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                                    <Icon name="favorite" size={20} className="text-yellow-600" />
                                </div>
                                <h3 className="text-lg font-black text-slate-800">最爱目的地</h3>
                            </div>
                            <div className="flex items-end gap-3">
                                <span className="text-3xl font-black text-slate-800">{stats.favoriteCity.name}</span>
                                <span className="text-sm font-bold text-slate-400 mb-1">打卡 {stats.favoriteCity.count} 次</span>
                            </div>
                        </motion.div>
                    )}

                    {/* 月度分布 */}
                    <motion.div
                        className="premium-card !p-6"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Icon name="trending_up" size={20} className="text-primary" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800">月度足迹分布</h3>
                        </div>
                        <div className="grid grid-cols-12 gap-2">
                            {stats.monthCounts.map((count, idx) => (
                                <div key={idx} className="text-center">
                                    <div 
                                        className={`w-full rounded-lg mb-2 transition-all ${
                                            count > 0 
                                                ? 'bg-gradient-to-t from-primary/40 to-primary/20 hover:from-primary/60 hover:to-primary/40' 
                                                : 'bg-slate-100'
                                        }`}
                                        style={{ height: `${Math.max(20, count * 10)}px` }}
                                    />
                                    <span className="text-[10px] font-bold text-slate-400">{monthNames[idx]}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* 第一次和最后一次旅行 */}
                    <div className="grid grid-cols-2 gap-4">
                        <motion.div
                            className="premium-card !p-5"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                    <Icon name="flight_takeoff" size={16} className="text-green-600" />
                                </div>
                                <h4 className="font-bold text-slate-600 text-sm">第一次旅行</h4>
                            </div>
                            <p className="text-sm font-bold text-slate-800 mb-1">{stats.firstTrip?.title || '暂无记录'}</p>
                            <p className="text-xs text-slate-400">{stats.firstTrip ? new Date(stats.firstTrip.date).toLocaleDateString('zh-CN') : '-'}</p>
                        </motion.div>

                        <motion.div
                            className="premium-card !p-5"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Icon name="flight_land" size={16} className="text-blue-600" />
                                </div>
                                <h4 className="font-bold text-slate-600 text-sm">最后一次旅行</h4>
                            </div>
                            <p className="text-sm font-bold text-slate-800 mb-1">{stats.lastTrip?.title || '暂无记录'}</p>
                            <p className="text-xs text-slate-400">{stats.lastTrip ? new Date(stats.lastTrip.date).toLocaleDateString('zh-CN') : '-'}</p>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { MapCheckin } from '../../types'
import Icon from '../icons/Icons'

interface TravelStatsProps {
    checkins: MapCheckin[]
    onProvinceClick?: (province: string) => void
}

export default function TravelStats({ checkins, onProvinceClick }: TravelStatsProps) {
    const stats = useMemo(() => {
        if (checkins.length === 0) return null

        // 省份统计
        const provinceCounts: Record<string, number> = {}
        checkins.forEach(c => {
            provinceCounts[c.province] = (provinceCounts[c.province] || 0) + 1
        })
        const sortedProvinces = Object.entries(provinceCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)

        // 城市统计
        const cityCounts: Record<string, { count: number; province: string }> = {}
        checkins.forEach(c => {
            const key = c.city || c.province
            if (!cityCounts[key]) {
                cityCounts[key] = { count: 0, province: c.province }
            }
            cityCounts[key].count++
        })
        const sortedCities = Object.entries(cityCounts)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10)

        // 总统计
        const totalProvinces = new Set(checkins.map(c => c.province)).size
        const totalCities = new Set(checkins.map(c => c.city || c.province)).size

        return {
            sortedProvinces,
            sortedCities,
            totalProvinces,
            totalCities,
            totalCheckins: checkins.length
        }
    }, [checkins])

    if (!stats) return null

    return (
        <div className="space-y-6">
            {/* 核心统计 */}
            <div className="grid grid-cols-2 gap-4">
                <motion.div
                    className="premium-card !p-5"
                    whileHover={{ y: -2 }}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-[#FFEDF3] flex items-center justify-center">
                            <Icon name="map" size={18} className="text-[#FF8BB1]" />
                        </div>
                        <span className="text-sm font-bold text-slate-400">省份</span>
                    </div>
                    <div className="text-3xl font-black text-slate-800">{stats.totalProvinces}</div>
                </motion.div>

                <motion.div
                    className="premium-card !p-5"
                    whileHover={{ y: -2 }}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-[#EBF7FF] flex items-center justify-center">
                            <Icon name="location_on" size={18} className="text-[#6BBFFF]" />
                        </div>
                        <span className="text-sm font-bold text-slate-400">城市</span>
                    </div>
                    <div className="text-3xl font-black text-slate-800">{stats.totalCities}</div>
                </motion.div>
            </div>

            {/* 省份 TOP10 */}
            <motion.div
                className="premium-card !p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon name="emoji_events" size={18} className="text-primary" />
                    </div>
                    <h3 className="text-lg font-black text-slate-800">省份 TOP 10</h3>
                </div>

                <div className="space-y-3">
                    {stats.sortedProvinces.map(([province, count], idx) => {
                        const percentage = Math.round((count / stats.totalCheckins) * 100)
                        return (
                            <motion.div
                                key={province}
                                className="flex items-center gap-3 cursor-pointer group"
                                onClick={() => onProvinceClick?.(province)}
                                whileHover={{ x: 4 }}
                            >
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                    idx === 1 ? 'bg-gray-100 text-gray-700' :
                                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                                    'bg-slate-50 text-slate-400'
                                }`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">
                                            {province}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400">{count}次 · {percentage}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-primary/40 to-primary"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ delay: idx * 0.05, duration: 0.5 }}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </motion.div>

            {/* 城市 TOP10 */}
            <motion.div
                className="premium-card !p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon name="location_city" size={18} className="text-primary" />
                    </div>
                    <h3 className="text-lg font-black text-slate-800">城市 TOP 10</h3>
                </div>

                <div className="space-y-3">
                    {stats.sortedCities.map(([city, data], idx) => {
                        const percentage = Math.round((data.count / stats.totalCheckins) * 100)
                        return (
                            <motion.div
                                key={city}
                                className="flex items-center gap-3"
                                whileHover={{ x: 4 }}
                            >
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                    idx === 1 ? 'bg-gray-100 text-gray-700' :
                                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                                    'bg-slate-50 text-slate-400'
                                }`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <div>
                                            <span className="text-sm font-bold text-slate-700">{city}</span>
                                            <span className="text-xs text-slate-400 ml-2">{data.province}</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400">{data.count}次 · {percentage}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-[#6BBFFF]/40 to-[#6BBFFF]"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ delay: idx * 0.05, duration: 0.5 }}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </motion.div>
        </div>
    )
}

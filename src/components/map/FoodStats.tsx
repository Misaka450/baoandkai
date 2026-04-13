import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { FoodCheckin } from '../../types'
import Icon from '../icons/Icons'

interface FoodStatsProps {
    checkins: FoodCheckin[]
}

interface CuisineStat {
    name: string
    count: number
    avgRating: number
    color: string
}

interface RestaurantStat {
    name: string
    count: number
    avgRating: number
    cuisine: string
}

export default function FoodStats({ checkins }: FoodStatsProps) {
    const stats = useMemo(() => {
        if (checkins.length === 0) return null

        // 菜系统计
        const cuisineMap: Record<string, { count: number; totalRating: number }> = {}
        checkins.forEach(c => {
            const cuisine = c.cuisine || '其他'
            if (!cuisineMap[cuisine]) {
                cuisineMap[cuisine] = { count: 0, totalRating: 0 }
            }
            cuisineMap[cuisine].count++
            if (c.overall_rating) {
                cuisineMap[cuisine].totalRating += c.overall_rating
            }
        })

        const cuisineStats: CuisineStat[] = Object.entries(cuisineMap)
            .map(([name, data]) => ({
                name,
                count: data.count,
                avgRating: data.count > 0 ? data.totalRating / data.count : 0,
                color: getCuisineColor(name)
            }))
            .sort((a, b) => b.count - a.count)

        // 餐厅统计 - 访问次数最多的餐厅
        const restaurantMap: Record<string, { count: number; totalRating: number; cuisine: string }> = {}
        checkins.forEach(c => {
            const name = c.restaurant_name || '未知餐厅'
            if (!restaurantMap[name]) {
                restaurantMap[name] = { count: 0, totalRating: 0, cuisine: c.cuisine || '其他' }
            }
            restaurantMap[name].count++
            if (c.overall_rating) {
                restaurantMap[name].totalRating += c.overall_rating
            }
        })

        const topRestaurants: RestaurantStat[] = Object.entries(restaurantMap)
            .map(([name, data]) => ({
                name,
                count: data.count,
                avgRating: data.count > 0 ? data.totalRating / data.count : 0,
                cuisine: data.cuisine
            }))
            .filter(r => r.count >= 1)
            .sort((a, b) => {
                if (b.count !== a.count) return b.count - a.count
                return b.avgRating - a.avgRating
            })
            .slice(0, 5)

        // 评分统计
        const avgOverall = checkins.reduce((sum, c) => sum + (c.overall_rating || 0), 0) / (checkins.filter(c => c.overall_rating).length || 1)
        const avgTaste = checkins.reduce((sum, c) => sum + (c.taste_rating || 0), 0) / (checkins.filter(c => c.taste_rating).length || 1)
        const avgEnvironment = checkins.reduce((sum, c) => sum + (c.environment_rating || 0), 0) / (checkins.filter(c => c.environment_rating).length || 1)
        const avgService = checkins.reduce((sum, c) => sum + (c.service_rating || 0), 0) / (checkins.filter(c => c.service_rating).length || 1)

        return {
            totalCheckins: checkins.length,
            totalRestaurants: Object.keys(restaurantMap).length,
            avgOverall: avgOverall.toFixed(1),
            avgTaste: avgTaste.toFixed(1),
            avgEnvironment: avgEnvironment.toFixed(1),
            avgService: avgService.toFixed(1),
            cuisineStats,
            topRestaurants
        }
    }, [checkins])

    if (!stats) return null

    const cuisineColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']

    const getCuisineColor = (cuisine: string): string => {
        const idx = stats.cuisineStats.findIndex(c => c.name === cuisine)
        const colorIdx = idx >= 0 ? idx : 0
        const color = cuisineColors[colorIdx % cuisineColors.length]
        return color ?? '#FF6B6B'
    }

    const { cuisineStats } = stats

    return (
        <div className="space-y-8">
            {/* 核心统计 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                    className="premium-card !p-5"
                    whileHover={{ y: -2 }}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-[#FFEDF3] flex items-center justify-center">
                            <Icon name="restaurant" size={18} className="text-[#FF8BB1]" />
                        </div>
                        <span className="text-sm font-bold text-slate-400">打卡</span>
                    </div>
                    <div className="text-3xl font-black text-slate-800">{stats.totalCheckins}</div>
                </motion.div>

                <motion.div
                    className="premium-card !p-5"
                    whileHover={{ y: -2 }}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-[#EBF7FF] flex items-center justify-center">
                            <Icon name="location_on" size={18} className="text-[#6BBFFF]" />
                        </div>
                        <span className="text-sm font-bold text-slate-400">餐厅</span>
                    </div>
                    <div className="text-3xl font-black text-slate-800">{stats.totalRestaurants}</div>
                </motion.div>

                <motion.div
                    className="premium-card !p-5"
                    whileHover={{ y: -2 }}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-[#FFF3E0] flex items-center justify-center">
                            <Icon name="favorite" size={18} className="text-[#FF9800]" />
                        </div>
                        <span className="text-sm font-bold text-slate-400">综合评分</span>
                    </div>
                    <div className="text-3xl font-black text-slate-800">{stats.avgOverall}</div>
                </motion.div>

                <motion.div
                    className="premium-card !p-5"
                    whileHover={{ y: -2 }}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-[#F0FFF4] flex items-center justify-center">
                            <Icon name="local_fire_department" size={18} className="text-[#6BCB77]" />
                        </div>
                        <span className="text-sm font-bold text-slate-400">最爱菜系</span>
                    </div>
                    <div className="text-xl font-black text-slate-800 truncate">
                        {stats.cuisineStats[0]?.name || '-'}
                    </div>
                </motion.div>
            </div>

            {/* 口味分析 */}
            <motion.div
                className="premium-card !p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon name="auto_awesome" size={18} className="text-primary" />
                    </div>
                    <h3 className="text-lg font-black text-slate-800">口味分析</h3>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: '味道', value: stats.avgTaste, color: '#FF6B6B' },
                        { label: '环境', value: stats.avgEnvironment, color: '#4ECDC4' },
                        { label: '服务', value: stats.avgService, color: '#45B7D1' }
                    ].map(item => (
                        <div key={item.label} className="text-center p-4 bg-slate-50 rounded-2xl">
                            <div className="text-2xl font-black mb-1" style={{ color: item.color }}>{item.value}</div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.label}</div>
                        </div>
                    ))}
                </div>

                {/* 菜系分布 */}
                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-600 mb-3">菜系分布</h4>
                    {cuisineStats.slice(0, 6).map((cuisine, idx) => {
                        const percentage = Math.round((cuisine.count / stats.totalCheckins) * 100)
                        return (
                            <motion.div
                                key={cuisine.name}
                                className="flex items-center gap-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <div
                                    className="w-3 h-3 rounded-full shrink-0"
                                    style={{ backgroundColor: cuisine.color }}
                                />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-bold text-slate-700">{cuisine.name}</span>
                                        <span className="text-xs font-bold text-slate-400">{cuisine.count}次 · {percentage}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: cuisine.color }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ delay: idx * 0.05 + 0.2, duration: 0.5 }}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </motion.div>

            {/* 收藏榜单 */}
            <motion.div
                className="premium-card !p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center">
                        <Icon name="star" size={18} className="text-yellow-500" />
                    </div>
                    <h3 className="text-lg font-black text-slate-800">收藏榜单</h3>
                </div>

                <div className="space-y-4">
                    {stats.topRestaurants.map((restaurant, idx) => (
                        <motion.div
                            key={restaurant.name}
                            className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + idx * 0.05 }}
                        >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
                                idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                idx === 1 ? 'bg-gray-100 text-gray-700' :
                                idx === 2 ? 'bg-orange-100 text-orange-700' :
                                'bg-slate-100 text-slate-500'
                            }`}>
                                {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-slate-800 truncate">{restaurant.name}</span>
                                    <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-bold uppercase tracking-widest">
                                        {restaurant.cuisine}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                    <span>打卡 {restaurant.count} 次</span>
                                    <span>评分 {restaurant.avgRating.toFixed(1)}</span>
                                </div>
                            </div>
                            <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full ${
                                            i < Math.round(restaurant.avgRating) ? 'bg-primary' : 'bg-slate-200'
                                        }`}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}

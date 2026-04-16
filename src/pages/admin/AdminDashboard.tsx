import { useQuery } from '@tanstack/react-query'
import { statsService, StatsData } from '../../services/apiService'
import Icon from '../../components/icons/Icons'
import StatCard from '../../components/common/StatCard'

/**
 * 管理后台数据看板
 * 展示站点核心数据总览、活跃度趋势、分类分布
 */
export default function AdminDashboard() {
    const { data: statsResponse, isLoading, error } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: () => statsService.getDashboard(),
        staleTime: 2 * 60 * 1000,
    })

    const stats = statsResponse?.data

    if (isLoading) return <DashboardSkeleton />
    if (error) return <div className="text-center py-20 text-red-400">数据加载失败，请刷新重试</div>
    if (!stats) return null

    return (
        <div className="space-y-8">
            {/* 核心数据总览 */}
            <section>
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Icon name="dashboard" size={20} className="text-primary" />
                    数据总览
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    <StatCard value={stats.overview.photos} label="照片" icon="photo_library" color="bg-blue-50" text="text-blue-500" delay={0} />
                    <StatCard value={stats.overview.albums} label="相册" icon="photo_album" color="bg-purple-50" text="text-purple-500" delay={0.05} />
                    <StatCard value={stats.overview.checkins} label="打卡" icon="location_on" color="bg-green-50" text="text-green-500" delay={0.1} />
                    <StatCard value={stats.overview.timeline} label="时间轴" icon="schedule" color="bg-orange-50" text="text-orange-500" delay={0.15} />
                    <StatCard value={stats.overview.todos} label="待办" icon="checklist" color="bg-cyan-50" text="text-cyan-500" delay={0.2} />
                    <StatCard value={stats.overview.capsules} label="胶囊" icon="event" color="bg-pink-50" text="text-pink-500" delay={0.25} />
                </div>
            </section>

            {/* 快捷统计条 */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <QuickStat
                    icon="trending_up"
                    label="近7天新增照片"
                    value={stats.overview.recentPhotos}
                    color="bg-gradient-to-r from-blue-500 to-blue-400"
                />
                <QuickStat
                    icon="check_circle"
                    label="待办完成率"
                    value={stats.overview.todos > 0 ? `${Math.round((stats.overview.todosCompleted / stats.overview.todos) * 100)}%` : '0%'}
                    sub={`${stats.overview.todosCompleted}/${stats.overview.todos}`}
                    color="bg-gradient-to-r from-green-500 to-emerald-400"
                />
                <QuickStat
                    icon="lock_open"
                    label="时光胶囊解锁"
                    value={stats.overview.capsules > 0 ? `${Math.round((stats.overview.capsulesUnlocked / stats.overview.capsules) * 100)}%` : '0%'}
                    sub={`${stats.overview.capsulesUnlocked}/${stats.overview.capsules}`}
                    color="bg-gradient-to-r from-pink-500 to-rose-400"
                />
            </section>

            {/* 活跃度趋势 + 分布 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 月度活跃度趋势图 */}
                <section className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Icon name="show_chart" size={18} className="text-primary" />
                        月度活跃度趋势
                    </h3>
                    <ActivityChart data={stats.activityTrend} />
                </section>

                {/* 右侧分布信息 */}
                <div className="space-y-6">
                    {/* 菜系分布 */}
                    {stats.cuisineDistribution.length > 0 && (
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h3 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <Icon name="restaurant" size={18} className="text-orange-400" />
                                菜系分布
                            </h3>
                            <DistributionList items={stats.cuisineDistribution} field="cuisine" colorMap={cuisineColors} />
                        </section>
                    )}

                    {/* 省份分布 */}
                    {stats.provinceDistribution.length > 0 && (
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h3 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <Icon name="map" size={18} className="text-green-400" />
                                足迹分布
                            </h3>
                            <DistributionList items={stats.provinceDistribution} field="province" colorMap={provinceColors} />
                        </section>
                    )}
                </div>
            </div>
        </div>
    )
}

// 快捷统计卡片
function QuickStat({ icon, label, value, sub, color }: {
    icon: string; label: string; value: string | number; sub?: string; color: string
}) {
    return (
        <div className={`${color} rounded-2xl p-5 text-white shadow-sm flex items-center gap-4`}>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name={icon as any} size={24} />
            </div>
            <div>
                <div className="text-2xl font-black leading-tight">{value}</div>
                <div className="text-white/70 text-xs font-medium">{label}</div>
                {sub && <div className="text-white/50 text-[10px] mt-0.5">{sub}</div>}
            </div>
        </div>
    )
}

// 月度活跃度柱状图（纯CSS实现，无需图表库）
function ActivityChart({ data }: { data: Record<string, { timeline: number; food: number; map: number; total: number }> }) {
    const months = Object.keys(data).sort()
    if (months.length === 0) {
        return <div className="text-center text-slate-400 py-10 text-sm">暂无活跃度数据</div>
    }

    const maxTotal = Math.max(...months.map(m => data[m].total), 1)

    // 月份标签格式化：2026-01 → 1月
    const formatMonth = (m: string) => {
        const parts = m.split('-')
        return `${parseInt(parts[1])}月`
    }

    return (
        <div className="space-y-3">
            {/* 图例 */}
            <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-400 inline-block"></span>时间轴</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-400 inline-block"></span>美食</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-400 inline-block"></span>足迹</span>
            </div>

            {/* 柱状图 */}
            <div className="flex items-end gap-1.5 h-40">
                {months.map(month => {
                    const d = data[month]
                    const totalH = (d.total / maxTotal) * 100
                    const timelineH = d.timeline > 0 ? (d.timeline / d.total) * totalH : 0
                    const foodH = d.food > 0 ? (d.food / d.total) * totalH : 0
                    const mapH = d.map > 0 ? (d.map / d.total) * totalH : 0

                    return (
                        <div key={month} className="flex-1 flex flex-col items-center gap-1 min-w-0 group relative">
                            {/* 悬浮提示 */}
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                {formatMonth(month)}: {d.total}条
                            </div>

                            <div className="w-full flex flex-col justify-end" style={{ height: `${Math.max(totalH, 4)}%` }}>
                                {mapH > 0 && <div className="w-full bg-blue-400 rounded-t-sm" style={{ height: `${mapH}%` }}></div>}
                                {foodH > 0 && <div className="w-full bg-green-400" style={{ height: `${foodH}%` }}></div>}
                                {timelineH > 0 && <div className="w-full bg-orange-400 rounded-b-sm" style={{ height: `${timelineH}%` }}></div>}
                            </div>

                            <span className="text-[10px] text-slate-400 truncate w-full text-center">{formatMonth(month)}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// 分布列表
function DistributionList({ items, field, colorMap }: {
    items: { cuisine?: string; province?: string; category?: string; count: number }[]
    field: 'cuisine' | 'province' | 'category'
    colorMap: Record<string, string>
}) {
    const maxCount = Math.max(...items.map(i => i.count), 1)
    const topItems = items.slice(0, 8)

    return (
        <div className="space-y-3">
            {topItems.map((item, idx) => {
                const name = item[field] || '其他'
                const percent = Math.round((item.count / maxCount) * 100)
                const color = colorMap[name] || defaultColors[idx % defaultColors.length]

                return (
                    <div key={idx} className="flex items-center gap-3">
                        <span className="text-xs text-slate-600 w-16 truncate flex-shrink-0 font-medium">{name}</span>
                        <div className="flex-1 h-5 bg-slate-50 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${color}`}
                                style={{ width: `${percent}%` }}
                            ></div>
                        </div>
                        <span className="text-xs text-slate-400 w-8 text-right flex-shrink-0">{item.count}</span>
                    </div>
                )
            })}
        </div>
    )
}

// 骨架屏
function DashboardSkeleton() {
    return (
        <div className="space-y-8 animate-pulse">
            <div>
                <div className="h-6 w-24 bg-slate-100 rounded-lg mb-4"></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-24 bg-slate-100 rounded-2xl"></div>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-slate-100 rounded-2xl"></div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-60 bg-slate-100 rounded-2xl"></div>
                <div className="h-60 bg-slate-100 rounded-2xl"></div>
            </div>
        </div>
    )
}

// 颜色映射
const cuisineColors: Record<string, string> = {
    '火锅': 'bg-red-400', '甜点': 'bg-pink-400', '烧烤': 'bg-orange-400',
    '面食': 'bg-yellow-400', '日料': 'bg-cyan-400', '韩料': 'bg-blue-400',
    '西餐': 'bg-purple-400', '中餐': 'bg-red-500', '小吃': 'bg-amber-400',
    '饮品': 'bg-teal-400',
}

const provinceColors: Record<string, string> = {
    '北京': 'bg-red-400', '上海': 'bg-blue-400', '广东': 'bg-green-400',
    '浙江': 'bg-cyan-400', '江苏': 'bg-purple-400', '四川': 'bg-orange-400',
    '湖南': 'bg-pink-400', '福建': 'bg-teal-400', '山东': 'bg-yellow-400',
}

const defaultColors = [
    'bg-primary', 'bg-blue-400', 'bg-green-400', 'bg-orange-400',
    'bg-purple-400', 'bg-pink-400', 'bg-cyan-400', 'bg-amber-400',
]

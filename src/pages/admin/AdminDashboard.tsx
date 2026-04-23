import { useQuery } from '@tanstack/react-query'
import { statsService } from '../../services/apiService'
import Icon, { IconName } from '../../components/icons/Icons'

export default function AdminDashboard() {
    const { data: statsResponse, isLoading, error } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: () => statsService.getDashboard(),
        staleTime: 2 * 60 * 1000,
    })

    const stats = statsResponse?.data

    if (isLoading) return <DashboardSkeleton />
    if (error) return <div className="text-center py-20 text-[#C9ADA7]">数据加载失败，请刷新重试</div>
    if (!stats) return null

    const completionRate = stats.overview.todos > 0
        ? Math.round((stats.overview.todosCompleted / stats.overview.todos) * 100)
        : 0

    const unlockRate = stats.overview.capsules > 0
        ? Math.round((stats.overview.capsulesUnlocked / stats.overview.capsules) * 100)
        : 0

    return (
        <div className="space-y-8">
            {/* 核心数据总览 - 莫兰迪配色卡片 */}
            <section>
                <SectionTitle icon="dashboard" text="数据总览" />
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    <DataCard value={stats.overview.photos} label="照片" icon="photo_library" color="#6BBFFF" delay={0} />
                    <DataCard value={stats.overview.albums} label="相册" icon="photo_album" color="#AAA1C8" delay={0.05} />
                    <DataCard value={stats.overview.checkins} label="打卡" icon="location_on" color="#6BCB77" delay={0.1} />
                    <DataCard value={stats.overview.timeline} label="时间轴" icon="schedule" color="#FFB344" delay={0.15} />
                    <DataCard value={stats.overview.todos} label="待办" icon="checklist" color="#9A9EAB" delay={0.2} />
                    <DataCard value={stats.overview.capsules} label="胶囊" icon="event" color="#FF8BB1" delay={0.25} />
                </div>
            </section>

            {/* 快捷统计条 */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard
                    icon="trending_up"
                    label="近7天新增照片"
                    value={stats.overview.recentPhotos}
                    gradient="from-[#6BBFFF] to-[#9A9EAB]"
                />
                <MetricCard
                    icon="check_circle"
                    label="待办完成率"
                    value={`${completionRate}%`}
                    sub={`${stats.overview.todosCompleted}/${stats.overview.todos}`}
                    gradient="from-[#6BCB77] to-[#B7B7A4]"
                />
                <MetricCard
                    icon="lock_open"
                    label="时光胶囊解锁"
                    value={`${unlockRate}%`}
                    sub={`${stats.overview.capsulesUnlocked}/${stats.overview.capsules}`}
                    gradient="from-[#FF8BB1] to-[#DEB3AD]"
                />
            </section>

            {/* 活跃度趋势 + 分布 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 月度活跃度趋势图 */}
                <section className="lg:col-span-2 [background:F7F3F0] rounded-2xl p-6 border border-[#E8E0DB]">
                    <SectionTitle icon="show_chart" text="月度活跃度趋势" />
                    <ActivityChart data={stats.activityTrend} />
                </section>

                {/* 右侧分布信息 */}
                <div className="space-y-6">
                    {stats.cuisineDistribution.length > 0 && (
                        <section className="[background:F7F3F0] rounded-2xl p-6 border border-[#E8E0DB]">
                            <SectionTitle icon="restaurant" text="菜系分布" color="#FFB344" />
                            <DistributionList
                                items={stats.cuisineDistribution}
                                field="cuisine"
                                colorMap={cuisineColors}
                            />
                        </section>
                    )}

                    {stats.provinceDistribution.length > 0 && (
                        <section className="[background:F7F3F0] rounded-2xl p-6 border border-[#E8E0DB]">
                            <SectionTitle icon="map" text="足迹分布" color="#6BCB77" />
                            <DistributionList
                                items={stats.provinceDistribution}
                                field="province"
                                colorMap={provinceColors}
                            />
                        </section>
                    )}
                </div>
            </div>
        </div>
    )
}

// 区块标题
function SectionTitle({ icon, text, color = '#C9ADA7' }: { icon: IconName; text: string; color?: string }) {
    return (
        <h3 className="text-base font-bold text-[#4A4E69] mb-4 flex items-center gap-2">
            <Icon name={icon} size={18} style={{ color }} />
            {text}
        </h3>
    )
}

// 数据卡片 - 使用莫兰迪色系
function DataCard({ value, label, icon, color, delay }: {
    value: number; label: string; icon: string; color: string; delay: number
}) {
    return (
        <div
            className="[background:F7F3F0] rounded-2xl p-5 border border-[#E8E0DB] flex items-center gap-4 opacity-0"
            style={{
                animation: `fadeInUp 0.4s ease-out ${delay}s forwards`,
                background: '#F7F3F0',
            }}
        >
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${color}20` }}
            >
                <Icon name={icon as IconName} size={22} style={{ color }} />
            </div>
            <div className="min-w-0">
                <div className="text-2xl font-black text-[#4A4E69] leading-tight">{value}</div>
                <div className="text-xs text-[#9A9EAB] font-medium mt-0.5">{label}</div>
            </div>
        </div>
    )
}

// 指标卡片
function MetricCard({ icon, label, value, sub, gradient }: {
    icon: string; label: string; value: string | number; sub?: string; gradient: string
}) {
    const [fromColor = '#6BBFFF', toColor = '#9A9EAB'] = gradient
        .replace('from-[', '')
        .replace(']', '')
        .replace(' to-[', '|')
        .split('|')

    return (
        <div
            className="rounded-2xl p-5 flex items-center gap-4 text-white border border-white/10"
            style={{ background: `linear-gradient(135deg, ${fromColor}CC, ${toColor}CC)` }}
        >
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon name={icon as IconName} size={24} />
            </div>
            <div>
                <div className="text-2xl font-black leading-tight">{value}</div>
                <div className="text-white/80 text-xs font-medium">{label}</div>
                {sub && <div className="text-white/50 text-[10px] mt-0.5">{sub}</div>}
            </div>
        </div>
    )
}

// 月度活跃度柱状图 - 莫兰迪配色
function ActivityChart({ data }: { data: Record<string, { timeline: number; food: number; map: number; total: number }> }) {
    const months = Object.keys(data).sort()
    if (months.length === 0) {
        return <div className="text-center text-[#9A9EAB] py-10 text-sm">暂无活跃度数据</div>
    }

    const maxTotal = Math.max(...months.map(m => data[m]?.total || 0), 1)

    const formatMonth = (m: string) => {
        const [yearPart = '', monthPart = ''] = m.split('-')
        return `${parseInt(monthPart || yearPart || '0', 10)}月`
    }

    return (
        <div className="space-y-3">
            {/* 图例 - 莫兰迪色 */}
            <div className="flex items-center gap-4 text-xs text-[#9A9EAB]">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#FFB344] inline-block"></span>时间轴</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#6BCB77] inline-block"></span>美食</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#6BBFFF] inline-block"></span>足迹</span>
            </div>

            {/* 柱状图 */}
            <div className="flex items-end gap-1.5 h-40">
                {months.map(month => {
                    const d = data[month]
                    if (!d) return null
                    const totalH = (d.total / maxTotal) * 100
                    const timelineH = d.timeline > 0 ? (d.timeline / d.total) * totalH : 0
                    const foodH = d.food > 0 ? (d.food / d.total) * totalH : 0
                    const mapH = d.map > 0 ? (d.map / d.total) * totalH : 0

                    return (
                        <div key={month} className="flex-1 flex flex-col items-center gap-1 min-w-0 group relative">
                            {/* 悬浮提示 */}
                            <div
                                className="absolute -top-16 left-1/2 -translate-x-1/2 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none"
                                style={{ backgroundColor: '#4A4E69' }}
                            >
                                {formatMonth(month)}: {d.total}条
                            </div>

                            <div className="w-full flex flex-col justify-end" style={{ height: `${Math.max(totalH, 4)}%` }}>
                                {mapH > 0 && <div className="w-full rounded-t-sm" style={{ height: `${mapH}%`, backgroundColor: '#6BBFFF' }}></div>}
                                {foodH > 0 && <div className="w-full" style={{ height: `${foodH}%`, backgroundColor: '#6BCB77' }}></div>}
                                {timelineH > 0 && <div className="w-full rounded-b-sm" style={{ height: `${timelineH}%`, backgroundColor: '#FFB344' }}></div>}
                            </div>

                            <span className="text-[10px] text-[#9A9EAB] truncate w-full text-center">{formatMonth(month)}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// 分布列表 - 莫兰迪配色
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
                const barColor = colorMap[name] || defaultColors[idx % defaultColors.length]

                return (
                    <div key={idx} className="flex items-center gap-3">
                        <span className="text-xs text-[#4A4E69] w-14 truncate flex-shrink-0 font-medium">{name}</span>
                        <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ backgroundColor: '#EDE8E4' }}>
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${percent}%`, backgroundColor: barColor }}
                            ></div>
                        </div>
                        <span className="text-xs text-[#9A9EAB] w-8 text-right flex-shrink-0">{item.count}</span>
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
                <div className="h-6 w-24 rounded-lg mb-4" style={{ backgroundColor: '#EDE8E4' }}></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl" style={{ backgroundColor: '#F7F3F0' }}></div>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 rounded-2xl" style={{ backgroundColor: '#F7F3F0' }}></div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-60 rounded-2xl" style={{ backgroundColor: '#F7F3F0' }}></div>
                <div className="h-60 rounded-2xl" style={{ backgroundColor: '#F7F3F0' }}></div>
            </div>
        </div>
    )
}

// 颜色映射 - 莫兰迪色系
const cuisineColors: Record<string, string> = {
    '火锅': '#DEB3AD', '甜点': '#FF8BB1', '烧烤': '#FFB344',
    '面食': '#D6CFC7', '日料': '#6BBFFF', '韩料': '#AAA1C8',
    '西餐': '#9A9EAB', '中餐': '#DEB3AD', '小吃': '#D6CFC7',
    '饮品': '#B7B7A4',
}

const provinceColors: Record<string, string> = {
    '北京': '#DEB3AD', '上海': '#6BBFFF', '广东': '#6BCB77',
    '浙江': '#6BBFFF', '江苏': '#AAA1C8', '四川': '#FFB344',
    '湖南': '#FF8BB1', '福建': '#B7B7A4', '山东': '#D6CFC7',
}

const defaultColors = [
    '#C9ADA7', '#6BBFFF', '#6BCB77', '#FFB344',
    '#AAA1C8', '#FF8BB1', '#9A9EAB', '#B7B7A4',
]

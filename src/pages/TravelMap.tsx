import { useState, useMemo, lazy, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { mapService } from '../services/apiService'
import type { MapCheckin } from '../types'
import type { ProvinceData } from '../data/chinaMapData'
import TimeFilter from '../components/map/TimeFilter'
import Icon, { type IconName } from '../components/icons/Icons'
import StatCard from '../components/common/StatCard'
import { Skeleton } from '../components/Skeleton'

const ChinaMap = lazy(() => import('../components/map/ChinaMap'))
const ProvinceDetailLoader = lazy(() => import('../components/map/ProvinceDetailLoader'))
const CheckinCard = lazy(() => import('../components/map/CheckinCard'))
const Timeline = lazy(() => import('../components/map/Timeline'))
const TravelStats = lazy(() => import('../components/map/TravelStats'))
const PhotoWall = lazy(() => import('../components/map/PhotoWall'))
const Slideshow = lazy(() => import('../components/map/Slideshow'))
const MemoryLane = lazy(() => import('../components/map/MemoryLane'))
const AnnualReport = lazy(() => import('../components/map/AnnualReport'))

type ViewMode = 'country' | 'province' | 'timeline' | 'stats' | 'photos' | 'memories'

// 定义视图模式按钮数据（类型安全）
interface ViewModeItem {
    id: ViewMode
    label: string
    icon: IconName
}

// 定义统计数据（类型安全）
interface StatItem {
    value: number
    label: string
    icon: IconName
    color: string
    text: string
}

export default function TravelMap() {
    const [viewMode, setViewMode] = useState<ViewMode>('country')
    const [selectedProvinceName, setSelectedProvinceName] = useState<string | null>(null)
    const [selectedCityName, setSelectedCityName] = useState<string | null>(null)
    const [checkinCardData, setCheckinCardData] = useState<{ city: string; checkins: MapCheckin[] } | null>(null)
    const [selectedYear, setSelectedYear] = useState<string | null>(null)
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
    const [showHeatmap, setShowHeatmap] = useState(false)
    const [showRoute, setShowRoute] = useState(true)
    const [showSlideshow, setShowSlideshow] = useState(false)
    const [showAnnualReport, setShowAnnualReport] = useState(false)

    const { data: mapData, isLoading, refetch } = useQuery({
        queryKey: ['mapCheckins'],
        queryFn: async () => {
            const response = await mapService.getAll()
            return response.data
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
        refetchInterval: false,
    })

    // 按时间筛选
    const allCheckins = mapData?.data || []
    const checkins = useMemo(() => {
        if (!selectedYear && !selectedMonth) return allCheckins
        
        return allCheckins.filter(checkin => {
            const date = new Date(checkin.date)
            const year = date.getFullYear().toString()
            const month = (date.getMonth() + 1).toString().padStart(2, '0')
            
            if (selectedYear && year !== selectedYear) return false
            if (selectedMonth && month !== selectedMonth) return false
            return true
        })
    }, [allCheckins, selectedYear, selectedMonth])

    // 提取所有日期用于筛选器
    const allDates = useMemo(() => {
        return allCheckins.map(c => c.date)
    }, [allCheckins])

    // 统计数据
    const stats = useMemo(() => {
        const provinceSet = new Set<string>()
        const citySet = new Set<string>()
        checkins.forEach(c => {
            provinceSet.add(c.province)
            if (c.city) citySet.add(c.city)
        })
        return {
            totalCheckins: checkins.length,
            provinces: provinceSet.size,
            cities: citySet.size
        }
    }, [checkins])

    // 选中省份的打卡记录
    const provinceCheckins = useMemo(() => {
        if (!selectedProvinceName) return []
        return checkins.filter(c => c.province === selectedProvinceName)
    }, [checkins, selectedProvinceName])

    const handleProvinceClick = (province: ProvinceData) => {
        setSelectedProvinceName(province.name)
        setViewMode('province')
    }

    const handleBack = () => {
        setViewMode('country')
        setSelectedProvinceName(null)
        setSelectedCityName(null)
    }

    const handleCityClick = (cityName: string, cityCheckins: MapCheckin[]) => {
        setCheckinCardData({ city: cityName, checkins: cityCheckins })
    }

    // 时间轴→地图联动：点击时间轴记录跳转到对应省份地图
    const handleNavigateToMap = (province: string, city?: string) => {
        setSelectedProvinceName(province)
        setSelectedCityName(city || null)
        setViewMode('province')
    }

    // 地图→时间轴联动：点击城市后跳转到时间轴视图
    const handleNavigateToTimeline = (province: string, city?: string) => {
        setSelectedProvinceName(province)
        setSelectedCityName(city || null)
        setCheckinCardData(null)
        setViewMode('timeline')
    }

    // 清除联动状态
    const clearLinkage = () => {
        setSelectedCityName(null)
    }

    // 视图模式按钮数据（类型安全）
    const viewModeItems: ViewModeItem[] = [
        { id: 'country', label: '地图', icon: 'map' },
        { id: 'timeline', label: '时间轴', icon: 'timeline' },
        { id: 'stats', label: '统计', icon: 'bar_chart' },
        { id: 'photos', label: '照片墙', icon: 'photo_library' },
        { id: 'memories', label: '回忆', icon: 'favorite' },
    ]

    // 统计数据（类型安全）
    const statItems: StatItem[] = [
        { value: stats.provinces, label: '省份', icon: 'map', color: 'bg-[#FFEDF3]', text: 'text-[#FF8BB1]' },
        { value: stats.cities, label: '城市', icon: 'location_on', color: 'bg-[#EBF7FF]', text: 'text-[#6BBFFF]' },
        { value: stats.totalCheckins, label: '足迹', icon: 'auto_awesome', color: 'bg-[#F0FFF4]', text: 'text-[#6BCB77]' },
    ]

    if (isLoading) return (
        <div className="min-h-screen pt-40 max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
                <Skeleton className="h-12 w-64 mx-auto mb-4" />
                <Skeleton className="h-4 w-48 mx-auto" />
            </div>
            <Skeleton className="h-[400px] w-full rounded-[2rem]" />
        </div>
    )

    const sectionFallback = (
        <div className="h-[320px] flex items-center justify-center">
            <div className="w-full space-y-4">
                <Skeleton className="h-8 w-48 mx-auto" />
                <Skeleton className="h-[240px] w-full rounded-[2rem]" />
            </div>
        </div>
    )

    return (
        <div className="min-h-screen text-slate-700 transition-colors duration-300">
            <main className="max-w-6xl mx-auto px-6 pb-32 pt-40 relative">
                {/* 标题 */}
                <header className="text-center mb-16 animate-fade-in">
                    <h1 className="text-5xl md:text-6xl font-black text-gradient tracking-tight mb-6">足迹地图</h1>
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest leading-relaxed">
                        Every place we've been, every memory we've made
                    </p>

                    {/* 视图切换导航 - 移动端优化 */}
                    <nav className="flex flex-wrap justify-center gap-2 md:gap-3 mt-10">
                        {viewModeItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setViewMode(item.id)}
                                className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm transition-all ${
                                    viewMode === item.id
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                                        : 'bg-white/60 text-slate-600 hover:bg-white hover:shadow-md'
                                }`}
                            >
                                <Icon name={item.icon} size={16} />
                                <span className="hidden sm:inline">{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* 统计数据 */}
                    {stats.totalCheckins > 0 && (
                        <div className="flex justify-center gap-6 mt-10">
                            {statItems.map((stat, idx) => (
                                <StatCard
                                    key={stat.label}
                                    value={stat.value}
                                    label={stat.label}
                                    icon={stat.icon}
                                    color={stat.color}
                                    text={stat.text}
                                    delay={idx * 0.1}
                                />
                            ))}
                        </div>
                    )}

                    {/* 功能按钮 - 移动端优化 */}
                    {checkins.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mt-6 md:mt-8">
                            <button
                                onClick={() => setShowAnnualReport(true)}
                                className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-gradient-to-r from-primary/10 to-primary/20 hover:from-primary/20 hover:to-primary/30 rounded-lg md:rounded-xl font-bold text-xs md:text-sm text-primary transition-all shadow-sm"
                            >
                                <Icon name="auto_awesome" size={16} />
                                <span className="hidden sm:inline">年度报告</span>
                            </button>
                            <button
                                onClick={() => setShowSlideshow(true)}
                                className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 bg-gradient-to-r from-primary/10 to-primary/20 hover:from-primary/20 hover:to-primary/30 rounded-lg md:rounded-xl font-bold text-xs md:text-sm text-primary transition-all shadow-sm"
                            >
                                <Icon name="slideshow" size={16} />
                                <span className="hidden sm:inline">幻灯片</span>
                            </button>
                            <button
                                onClick={() => setShowHeatmap(!showHeatmap)}
                                className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl font-bold text-xs md:text-sm transition-all shadow-sm ${
                                    showHeatmap
                                        ? 'bg-gradient-to-r from-orange-100 to-red-100 text-red-600'
                                        : 'bg-gradient-to-r from-primary/10 to-primary/20 hover:from-primary/20 hover:to-primary/30 text-primary'
                                }`}
                            >
                                <Icon name="whatshot" size={16} />
                                <span className="hidden sm:inline">热力图 {showHeatmap ? '已开启' : '已关闭'}</span>
                            </button>
                            <button
                                onClick={() => setShowRoute(!showRoute)}
                                className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl font-bold text-xs md:text-sm transition-all shadow-sm ${
                                    showRoute
                                        ? 'bg-gradient-to-r from-emerald-100 to-emerald-100 text-emerald-600'
                                        : 'bg-gradient-to-r from-primary/10 to-primary/20 hover:from-primary/20 hover:to-primary/30 text-primary'
                                }`}
                            >
                                <Icon name="route" size={16} />
                                <span className="hidden sm:inline">路线 {showRoute ? '已开启' : '已关闭'}</span>
                            </button>
                        </div>
                    )}

                    {/* 联动状态面包屑指示器 */}
                    {selectedCityName && (viewMode === 'province' || viewMode === 'timeline') && (
                        <motion.div
                            className="flex items-center justify-center gap-2 mt-4"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="flex items-center gap-1.5 px-4 py-2 bg-primary/5 rounded-full text-xs font-bold text-primary">
                                <Icon name="location_on" size={14} />
                                <span>{selectedProvinceName}{selectedCityName ? ` · ${selectedCityName}` : ''}</span>
                                <button
                                    onClick={clearLinkage}
                                    className="ml-1 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                                >
                                    <Icon name="close" size={10} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </header>

                {/* 时间筛选器 */}
                {(viewMode === 'country' || viewMode === 'timeline' || viewMode === 'photos') && allCheckins.length > 0 && (
                    <TimeFilter
                        selectedYear={selectedYear}
                        selectedMonth={selectedMonth}
                        onYearChange={setSelectedYear}
                        onMonthChange={setSelectedMonth}
                        onReset={() => {
                            setSelectedYear(null)
                            setSelectedMonth(null)
                        }}
                        dates={allDates}
                    />
                )}

                {/* 地图区域 */}
                {viewMode === 'country' && (
                    <div className="premium-card !p-6 md:!p-10 !bg-white/40 backdrop-blur-sm animate-slide-up">
                        <motion.div
                            key="country"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <Suspense fallback={sectionFallback}>
                                <ChinaMap
                                    checkins={checkins}
                                    onProvinceClick={handleProvinceClick}
                                    showHeatmap={showHeatmap}
                                    showRoute={showRoute}
                                />
                            </Suspense>
                        </motion.div>
                    </div>
                )}

                {viewMode === 'province' && selectedProvinceName && (
                    <motion.div
                        className="premium-card !p-6 md:!p-10 !bg-white/40 backdrop-blur-sm animate-slide-up"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Suspense fallback={sectionFallback}>
                            <ProvinceDetailLoader
                                provinceName={selectedProvinceName}
                                checkins={provinceCheckins}
                                onBack={handleBack}
                                onCityClick={handleCityClick}
                                onNavigateToTimeline={handleNavigateToTimeline}
                            />
                        </Suspense>
                    </motion.div>
                )}

                {/* 时间线视图 */}
                {viewMode === 'timeline' && (
                    <motion.div
                        className="premium-card !p-8 !bg-white/40 backdrop-blur-sm animate-slide-up"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Suspense fallback={sectionFallback}>
                            <Timeline
                                checkins={checkins}
                                onCheckinClick={(checkin) => setCheckinCardData({ city: checkin.city || checkin.province, checkins: [checkin] })}
                                onNavigateToMap={handleNavigateToMap}
                            />
                        </Suspense>
                    </motion.div>
                )}

                {/* 统计视图 */}
                {viewMode === 'stats' && (
                    <motion.div
                        className="max-w-4xl mx-auto animate-slide-up"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Suspense fallback={sectionFallback}>
                            <TravelStats
                                checkins={checkins}
                                onProvinceClick={(province) => {
                                    setSelectedProvinceName(province)
                                    setViewMode('province')
                                }}
                            />
                        </Suspense>
                    </motion.div>
                )}

                {/* 照片墙视图 */}
                {viewMode === 'photos' && (
                    <motion.div
                        className="premium-card !p-8 !bg-white/40 backdrop-blur-sm animate-slide-up"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Suspense fallback={sectionFallback}>
                            <PhotoWall
                                checkins={checkins}
                                onPhotoClick={(checkin) => setCheckinCardData({ city: checkin.city || checkin.province, checkins: [checkin] })}
                            />
                        </Suspense>
                    </motion.div>
                )}

                {/* 回忆视图 */}
                {viewMode === 'memories' && (
                    <motion.div
                        className="animate-slide-up"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Suspense fallback={sectionFallback}>
                            <MemoryLane checkins={allCheckins} />
                        </Suspense>
                    </motion.div>
                )}

                {/* 打卡详情弹窗 */}
                <AnimatePresence>
                    {checkinCardData && (
                        <Suspense fallback={null}>
                            <CheckinCard
                                checkins={checkinCardData.checkins}
                                cityName={checkinCardData.city}
                                onClose={() => setCheckinCardData(null)}
                                onRefresh={refetch}
                                onNavigateToTimeline={handleNavigateToTimeline}
                            />
                        </Suspense>
                    )}
                </AnimatePresence>

                {/* 幻灯片弹窗 */}
                <AnimatePresence>
                    {showSlideshow && (
                        <Suspense fallback={null}>
                            <Slideshow
                                checkins={allCheckins}
                                onClose={() => setShowSlideshow(false)}
                            />
                        </Suspense>
                    )}
                </AnimatePresence>

                {/* 年度报告弹窗 */}
                <AnimatePresence>
                    {showAnnualReport && (
                        <Suspense fallback={null}>
                            <AnnualReport
                                checkins={allCheckins}
                                year={new Date().getFullYear()}
                                onClose={() => setShowAnnualReport(false)}
                            />
                        </Suspense>
                    )}
                </AnimatePresence>

                {/* 全国视图下的打卡时间线 */}
                {viewMode === 'country' && checkins.length > 0 && (
                    <section className="mt-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center gap-4 mb-8">
                            <span className="bg-slate-900 text-white w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200">
                                <Icon name="schedule" size={20} />
                            </span>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">最近足迹</h2>
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Recent footprints</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {checkins.slice(0, 6).map((checkin, idx) => (
                                <motion.div
                                    key={checkin.id}
                                    className="premium-card !p-0 overflow-hidden group hover:-translate-y-1 transition-all duration-500 cursor-pointer"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.08 }}
                                    onClick={() => setCheckinCardData({ city: checkin.city || checkin.province, checkins: [checkin] })}
                                >
                                    {checkin.images && checkin.images.length > 0 ? (
                                        <div className="h-40 overflow-hidden">
                                            <img
                                                src={checkin.images[0]}
                                                alt={checkin.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-40 bg-gradient-to-br from-morandi-pink/20 to-morandi-blue/20 flex items-center justify-center">
                                            <Icon name="landscape" size={48} className="text-slate-200" />
                                        </div>
                                    )}
                                    <div className="p-5">
                                        <h3 className="font-black text-lg text-slate-800 mb-1 truncate group-hover:text-primary transition-colors">{checkin.title}</h3>
                                        <div className="flex items-center gap-1.5 text-slate-400 mb-2">
                                            <Icon name="location_on" size={12} className="text-primary/40" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{checkin.province}{checkin.city ? ` · ${checkin.city}` : ''}</span>
                                        </div>
                                        {checkin.description && (
                                            <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">{checkin.description}</p>
                                        )}
                                        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-3">{checkin.date}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 空状态 */}
                {checkins.length === 0 && (
                    <div className="text-center mt-16 py-20">
                        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
                            <Icon name="map" size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-400 mb-2">还没有足迹</h3>
                        <p className="text-slate-300 text-sm">在管理后台添加你们的第一个打卡地点吧 ✈️</p>
                    </div>
                )}
            </main>
        </div>
    )
}

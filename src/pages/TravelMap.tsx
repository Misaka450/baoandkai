import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { mapService } from '../services/apiService'
import type { MapCheckin } from '../types'
import type { ProvinceData } from '../data/chinaMapData'
import { provinces } from '../data/chinaMapData'
import ChinaMap from '../components/map/ChinaMap'
import ProvinceDetail from '../components/map/ProvinceDetail'
import CheckinCard from '../components/map/CheckinCard'
import TimeFilter from '../components/map/TimeFilter'
import Timeline from '../components/map/Timeline'
import TravelStats from '../components/map/TravelStats'
import PhotoWall from '../components/map/PhotoWall'
import Slideshow from '../components/map/Slideshow'
import MemoryLane from '../components/map/MemoryLane'
import AnnualReport from '../components/map/AnnualReport'
import Icon from '../components/icons/Icons'
import { Skeleton } from '../components/Skeleton'

type ViewMode = 'country' | 'province' | 'timeline' | 'stats' | 'photos' | 'memories'

export default function TravelMap() {
    const [viewMode, setViewMode] = useState<ViewMode>('country')
    const [selectedProvince, setSelectedProvince] = useState<ProvinceData | null>(null)
    const [checkinCardData, setCheckinCardData] = useState<{ city: string; checkins: MapCheckin[] } | null>(null)
    const [selectedYear, setSelectedYear] = useState<string | null>(null)
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
    const [showHeatmap, setShowHeatmap] = useState(false)
    const [showSlideshow, setShowSlideshow] = useState(false)
    const [showAnnualReport, setShowAnnualReport] = useState(false)

    const { data: mapData, isLoading, refetch } = useQuery({
        queryKey: ['mapCheckins'],
        queryFn: async () => {
            const response = await mapService.getAll()
            return response.data
        },
        staleTime: Infinity,
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
        if (!selectedProvince) return []
        return checkins.filter(c => c.province === selectedProvince.name)
    }, [checkins, selectedProvince])

    const handleProvinceClick = (province: ProvinceData) => {
        setSelectedProvince(province)
        setViewMode('province')
    }

    const handleBack = () => {
        setViewMode('country')
        setSelectedProvince(null)
    }

    const handleCityClick = (cityName: string, cityCheckins: MapCheckin[]) => {
        setCheckinCardData({ city: cityName, checkins: cityCheckins })
    }

    if (isLoading) return (
        <div className="min-h-screen pt-40 max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
                <Skeleton className="h-12 w-64 mx-auto mb-4" />
                <Skeleton className="h-4 w-48 mx-auto" />
            </div>
            <Skeleton className="h-[400px] w-full rounded-[2rem]" />
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

                    {/* 视图切换导航 */}
                    <nav className="flex flex-wrap justify-center gap-3 mt-10">
                        {[
                            { id: 'country', label: '地图', icon: 'map' },
                            { id: 'timeline', label: '时间轴', icon: 'timeline' },
                            { id: 'stats', label: '统计', icon: 'bar_chart' },
                            { id: 'photos', label: '照片墙', icon: 'photo_library' },
                            { id: 'memories', label: '回忆', icon: 'favorite' },
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => setViewMode(item.id as ViewMode)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
                                    viewMode === item.id
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                                        : 'bg-white/60 text-slate-600 hover:bg-white hover:shadow-md'
                                }`}
                            >
                                <Icon name={item.icon as any} size={18} />
                                {item.label}
                            </button>
                        ))}
                    </nav>

                    {/* 统计数据 */}
                    {stats.totalCheckins > 0 && (
                        <div className="flex justify-center gap-6 mt-10">
                            {[
                                { value: stats.provinces, label: '省份', icon: 'map', color: 'bg-[#FFEDF3]', text: 'text-[#FF8BB1]' },
                                { value: stats.cities, label: '城市', icon: 'location_on', color: 'bg-[#EBF7FF]', text: 'text-[#6BBFFF]' },
                                { value: stats.totalCheckins, label: '足迹', icon: 'auto_awesome', color: 'bg-[#F0FFF4]', text: 'text-[#6BCB77]' },
                            ].map((stat) => (
                                <motion.div
                                    key={stat.label}
                                    className={`${stat.color} px-6 py-3 rounded-[1.5rem] flex items-center gap-3 shadow-sm border-4 border-white`}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <Icon name={stat.icon as any} size={18} className={stat.text} />
                                    <div className="text-left">
                                        <div className={`text-2xl font-black ${stat.text}`}>{stat.value}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* 功能按钮 */}
                    {checkins.length > 0 && (
                        <div className="flex justify-center gap-3 mt-8">
                            <button
                                onClick={() => setShowAnnualReport(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary/10 to-primary/20 hover:from-primary/20 hover:to-primary/30 rounded-xl font-bold text-sm text-primary transition-all shadow-sm"
                            >
                                <Icon name="auto_awesome" size={18} />
                                年度报告
                            </button>
                            <button
                                onClick={() => setShowSlideshow(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary/10 to-primary/20 hover:from-primary/20 hover:to-primary/30 rounded-xl font-bold text-sm text-primary transition-all shadow-sm"
                            >
                                <Icon name="slideshow" size={18} />
                                幻灯片
                            </button>
                            <button
                                onClick={() => setShowHeatmap(!showHeatmap)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
                                    showHeatmap
                                        ? 'bg-gradient-to-r from-orange-100 to-red-100 text-red-600'
                                        : 'bg-gradient-to-r from-primary/10 to-primary/20 hover:from-primary/20 hover:to-primary/30 text-primary'
                                }`}
                            >
                                <Icon name="whatshot" size={18} />
                                热力图 {showHeatmap ? '已开启' : '已关闭'}
                            </button>
                        </div>
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
                        <AnimatePresence mode="wait">
                            {viewMode === 'country' ? (
                                <motion.div
                                    key="country"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <ChinaMap
                                        checkins={checkins}
                                        onProvinceClick={handleProvinceClick}
                                        showHeatmap={showHeatmap}
                                    />
                                </motion.div>
                            ) : selectedProvince ? (
                                <ProvinceDetail
                                    key="province"
                                    province={selectedProvince}
                                    checkins={provinceCheckins}
                                    onBack={handleBack}
                                    onCityClick={handleCityClick}
                                />
                            ) : null}
                        </AnimatePresence>
                    </div>
                )}

                {/* 时间线视图 */}
                {viewMode === 'timeline' && (
                    <motion.div
                        className="premium-card !p-8 !bg-white/40 backdrop-blur-sm animate-slide-up"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Timeline
                            checkins={checkins}
                            onCheckinClick={(checkin) => setCheckinCardData({ city: checkin.city || checkin.province, checkins: [checkin] })}
                        />
                    </motion.div>
                )}

                {/* 统计视图 */}
                {viewMode === 'stats' && (
                    <motion.div
                        className="max-w-4xl mx-auto animate-slide-up"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <TravelStats
                            checkins={checkins}
                            onProvinceClick={(province) => {
                                const provinceData = provinces.find(p => p.name === province)
                                if (provinceData) {
                                    handleProvinceClick(provinceData)
                                }
                            }}
                        />
                    </motion.div>
                )}

                {/* 照片墙视图 */}
                {viewMode === 'photos' && (
                    <motion.div
                        className="premium-card !p-8 !bg-white/40 backdrop-blur-sm animate-slide-up"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <PhotoWall
                            checkins={checkins}
                            onPhotoClick={(checkin) => setCheckinCardData({ city: checkin.city || checkin.province, checkins: [checkin] })}
                        />
                    </motion.div>
                )}

                {/* 回忆视图 */}
                {viewMode === 'memories' && (
                    <motion.div
                        className="animate-slide-up"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <MemoryLane checkins={allCheckins} />
                    </motion.div>
                )}

                {/* 打卡详情弹窗 */}
                <AnimatePresence>
                    {checkinCardData && (
                        <CheckinCard
                            checkins={checkinCardData.checkins}
                            cityName={checkinCardData.city}
                            onClose={() => setCheckinCardData(null)}
                            onRefresh={refetch}
                        />
                    )}
                </AnimatePresence>

                {/* 幻灯片弹窗 */}
                <AnimatePresence>
                    {showSlideshow && (
                        <Slideshow
                            checkins={allCheckins}
                            onClose={() => setShowSlideshow(false)}
                        />
                    )}
                </AnimatePresence>

                {/* 年度报告弹窗 */}
                <AnimatePresence>
                    {showAnnualReport && (
                        <AnnualReport
                            checkins={allCheckins}
                            year={new Date().getFullYear()}
                            onClose={() => setShowAnnualReport(false)}
                        />
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

            {/* 打卡详情弹窗 */}
            {checkinCardData && (
                <CheckinCard
                    checkins={checkinCardData.checkins}
                    cityName={checkinCardData.city}
                    onClose={() => setCheckinCardData(null)}
                />
            )}
        </div>
    )
}

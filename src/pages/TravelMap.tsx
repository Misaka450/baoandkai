import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { mapService } from '../services/apiService'
import type { MapCheckin } from '../types'
import type { ProvinceData } from '../data/chinaMapData'
import ChinaMap from '../components/map/ChinaMap'
import ProvinceDetail from '../components/map/ProvinceDetail'
import CheckinCard from '../components/map/CheckinCard'
import Icon from '../components/icons/Icons'
import { Skeleton } from '../components/Skeleton'

type ViewMode = 'country' | 'province'

export default function TravelMap() {
    const [viewMode, setViewMode] = useState<ViewMode>('country')
    const [selectedProvince, setSelectedProvince] = useState<ProvinceData | null>(null)
    const [checkinCardData, setCheckinCardData] = useState<{ city: string; checkins: MapCheckin[] } | null>(null)

    const { data: mapData, isLoading } = useQuery({
        queryKey: ['mapCheckins'],
        queryFn: async () => {
            const response = await mapService.getAll()
            return response.data
        },
        staleTime: Infinity,
    })

    const checkins = mapData?.data || []

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
                </header>

                {/* 地图区域 */}
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
                        <p className="text-slate-300 text-sm">在管理后台添加你们的第一个打卡吧 ✈️</p>
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

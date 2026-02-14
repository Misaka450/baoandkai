import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ProvinceData } from '../../data/chinaMapData'
import { getCityPathsForProvince } from '../../data/provinceCityPaths'
import type { MapCheckin } from '../../types'
import Icon from '../icons/Icons'

interface ProvinceDetailProps {
    province: ProvinceData
    checkins: MapCheckin[]
    onBack: () => void
    onCityClick: (cityName: string, cityCheckins: MapCheckin[]) => void
}

export default function ProvinceDetail({ province, checkins, onBack, onCityClick }: ProvinceDetailProps) {
    const [hoveredCity, setHoveredCity] = useState<string | null>(null)

    const cityPaths = getCityPathsForProvince(province.name)

    // 按城市分组打卡
    const cityCheckinMap = useMemo(() => {
        const map: Record<string, MapCheckin[]> = {}
        checkins.forEach(c => {
            const cityName = c.city
            if (cityName) {
                if (!map[cityName]) map[cityName] = []
                map[cityName].push(c)
            }
        })
        return map
    }, [checkins])

    const checkedCities = new Set(Object.keys(cityCheckinMap))

    // 根据城市 path 数据计算 viewBox（自动适应省份大小）
    const viewBox = useMemo(() => {
        if (cityPaths.length === 0) {
            // fallback: 使用省份中心
            const s = 200
            return `${province.center[0] - s / 2} ${province.center[1] - s / 2} ${s} ${s}`
        }
        // 从所有城市中心计算包围盒
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        for (const city of cityPaths) {
            // 解析 path 中的坐标来确定边界
            const coords = city.path.match(/[ML]([\d.]+),([\d.]+)/g)
            if (coords) {
                for (const coord of coords) {
                    const match = coord.match(/[ML]([\d.]+),([\d.]+)/)
                    if (match) {
                        const x = parseFloat(match[1])
                        const y = parseFloat(match[2])
                        if (x < minX) minX = x
                        if (y < minY) minY = y
                        if (x > maxX) maxX = x
                        if (y > maxY) maxY = y
                    }
                }
            }
        }
        // 添加 padding
        const pad = 8
        return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`
    }, [cityPaths, province.center])

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
        >
            {/* 头部 */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors group"
                >
                    <Icon name="west" size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold">返回全国</span>
                </button>
                <div className="text-right">
                    <h3 className="text-2xl font-black text-slate-800">{province.name}</h3>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                        {checkins.length} 个打卡 · {checkedCities.size} 个城市
                    </p>
                </div>
            </div>

            {/* 省份地图 + 城市区域 */}
            <div className="relative premium-card !p-8 !bg-white/40 backdrop-blur-sm overflow-hidden">
                <svg
                    viewBox={viewBox}
                    className="w-full h-auto max-h-[400px]"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* 背景：省份轮廓 */}
                    <path
                        d={province.path}
                        fill="#EDE8E3"
                        stroke="#D6CFC7"
                        strokeWidth={0.5}
                    />

                    {/* 城市区域 */}
                    {cityPaths.map((city, idx) => {
                        const hasCheckins = checkedCities.has(city.name)
                        const isHovered = hoveredCity === city.name

                        return (
                            <g key={city.name}>
                                {/* 城市区域 path */}
                                <motion.path
                                    d={city.path}
                                    fill={
                                        isHovered
                                            ? (hasCheckins ? '#B8999380' : '#D6CFC780')
                                            : (hasCheckins ? '#C9ADA740' : '#F5F0EC')
                                    }
                                    stroke={hasCheckins ? '#B89993' : '#D6CFC7'}
                                    strokeWidth={isHovered ? 0.8 : 0.3}
                                    className="cursor-pointer"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.015, duration: 0.3 }}
                                    onClick={() => {
                                        if (hasCheckins) {
                                            onCityClick(city.name, cityCheckinMap[city.name] || [])
                                        }
                                    }}
                                    onMouseEnter={() => setHoveredCity(city.name)}
                                    onMouseLeave={() => setHoveredCity(null)}
                                />

                                {/* 城市名称标签 */}
                                {(isHovered || hasCheckins) && (
                                    <text
                                        x={city.center[0]}
                                        y={city.center[1]}
                                        textAnchor="middle"
                                        dominantBaseline="central"
                                        fill={hasCheckins ? '#6B5B55' : '#9A9EAB'}
                                        fontSize={isHovered ? '4' : '3'}
                                        fontWeight={hasCheckins ? '700' : '500'}
                                        className="pointer-events-none select-none"
                                        style={{ textShadow: '0 0 3px rgba(255,255,255,0.8)' }}
                                    >
                                        {city.name.replace(/市$|地区$|自治[州县]$/, '')}
                                    </text>
                                )}

                                {/* 已打卡城市的脉冲标记 */}
                                {hasCheckins && (
                                    <motion.circle
                                        cx={city.center[0]}
                                        cy={city.center[1]}
                                        r={2}
                                        fill="#C9ADA7"
                                        stroke="white"
                                        strokeWidth={0.5}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: idx * 0.02, type: 'spring' }}
                                    />
                                )}
                            </g>
                        )
                    })}
                </svg>
            </div>

            {/* 该省份的打卡列表 */}
            {checkins.length > 0 && (
                <div className="mt-8">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">打卡记录</h4>
                    <div className="space-y-3">
                        {checkins.map((checkin, idx) => (
                            <motion.div
                                key={checkin.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="premium-card !p-4 flex items-center gap-4 cursor-pointer hover:-translate-y-0.5 transition-all"
                                onClick={() => {
                                    if (checkin.city) {
                                        onCityClick(checkin.city, [checkin])
                                    }
                                }}
                            >
                                {checkin.images && checkin.images.length > 0 ? (
                                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                                        <img src={checkin.images[0]} alt={checkin.title} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-14 h-14 rounded-xl bg-background-light flex items-center justify-center flex-shrink-0">
                                        <Icon name="location_on" size={20} className="text-primary/50" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-700 truncate">{checkin.title}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {checkin.city && `${checkin.city} · `}{checkin.date}
                                    </p>
                                </div>
                                <Icon name="east" size={16} className="text-slate-300 flex-shrink-0" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    )
}

import { useState, useMemo, memo } from 'react'
import { provinces, CHINA_MAP_VIEWBOX, type ProvinceData } from '../../data/chinaMapData'
import type { MapCheckin } from '../../types'
import MapPin from './MapPin'

interface ChinaMapProps {
    checkins: MapCheckin[]
    onProvinceClick: (province: ProvinceData) => void
}

// 提取省份路径组件以利用 memo
const ProvincePath = memo(({
    province,
    fill,
    stroke,
    strokeWidth,
    onClick,
    onMouseEnter,
    onMouseMove,
    onMouseLeave
}: {
    province: ProvinceData
    fill: string
    stroke: string
    strokeWidth: number
    onClick: () => void
    onMouseEnter: (e: React.MouseEvent) => void
    onMouseMove: (e: React.MouseEvent) => void
    onMouseLeave: () => void
}) => (
    <path
        d={province.path}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        className="cursor-pointer transition-colors duration-200"
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
    />
))

ProvincePath.displayName = 'ProvincePath'

export default function ChinaMap({ checkins, onProvinceClick }: ChinaMapProps) {
    const [hoveredProvince, setHoveredProvince] = useState<string | null>(null)
    const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string; count: number } | null>(null)

    // 统计每个省份的打卡数量
    const provinceCheckinCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        checkins.forEach(c => {
            counts[c.province] = (counts[c.province] || 0) + 1
        })
        return counts
    }, [checkins])

    const checkedProvinces = useMemo(() => new Set(Object.keys(provinceCheckinCounts)), [provinceCheckinCounts])

    const handleMouseEnter = (province: ProvinceData, e: React.MouseEvent) => {
        setHoveredProvince(province.id)
        updateTooltip(province, e)
    }

    const handleMouseMove = (province: ProvinceData, e: React.MouseEvent) => {
        updateTooltip(province, e)
    }

    const updateTooltip = (province: ProvinceData, e: React.MouseEvent) => {
        const svg = (e.currentTarget as SVGElement).closest('svg')
        if (!svg) return

        const rect = svg.getBoundingClientRect()
        setTooltip({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top - 10,
            name: province.name,
            count: provinceCheckinCounts[province.name] || 0
        })
    }

    const handleMouseLeave = () => {
        setHoveredProvince(null)
        setTooltip(null)
    }

    const getProvinceFill = (province: ProvinceData) => {
        const isChecked = checkedProvinces.has(province.name)
        const isHovered = hoveredProvince === province.id

        if (isChecked && isHovered) return '#C9ADA7'  // primary darker
        if (isChecked) return '#DEB3AD'  // morandi-rose
        if (isHovered) return '#D6CFC7'  // morandi-yellow hover
        return '#F0ECE8'  // light base
    }

    const getProvinceStroke = (province: ProvinceData) => {
        const isChecked = checkedProvinces.has(province.name)
        if (isChecked) return '#B7A39E'
        return '#D6CFC7'
    }

    return (
        <div className="relative w-full">
            <svg
                viewBox={CHINA_MAP_VIEWBOX}
                className="w-full h-auto"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* 背景 */}
                <rect width="900" height="700" fill="transparent" />

                {/* 省份路径 */}
                {provinces.map(province => (
                    <ProvincePath
                        key={province.id}
                        province={province}
                        fill={getProvinceFill(province)}
                        stroke={getProvinceStroke(province)}
                        strokeWidth={hoveredProvince === province.id ? 2 : 1}
                        onClick={() => onProvinceClick(province)}
                        onMouseEnter={(e) => handleMouseEnter(province, e)}
                        onMouseMove={(e) => handleMouseMove(province, e)}
                        onMouseLeave={handleMouseLeave}
                    />
                ))}

                {/* 有打卡的省份标记点 - 使用 MapPin */}
                {provinces.filter(p => checkedProvinces.has(p.name)).map((province, idx) => (
                    <MapPin
                        key={`pin-${province.id}`}
                        x={province.center[0]}
                        y={province.center[1]}
                        color="#C9ADA7"
                        delay={idx * 0.05}
                    />
                ))}

                {/* 省份名称标签 - 只在较大省份显示 */}
                {provinces.filter(p =>
                    ['新疆', '西藏', '内蒙古', '青海', '四川', '黑龙江'].includes(p.name)
                ).map(province => (
                    <text
                        key={`label-${province.id}`}
                        x={province.center[0]}
                        y={province.center[1] + (checkedProvinces.has(province.name) ? -15 : 0)}
                        textAnchor="middle"
                        className="pointer-events-none select-none"
                        fill="#9A9EAB"
                        fontSize="11"
                        fontWeight="600"
                    >
                        {province.name}
                    </text>
                ))}
            </svg>

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="absolute pointer-events-none z-20 bg-white/95 backdrop-blur-md shadow-lg rounded-2xl px-4 py-2.5 border border-white/80"
                    style={{
                        left: tooltip.x,
                        top: tooltip.y,
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    <p className="text-sm font-bold text-slate-700">{tooltip.name}</p>
                    {tooltip.count > 0 ? (
                        <p className="text-[10px] font-bold text-primary tracking-widest uppercase">{tooltip.count} 个打卡</p>
                    ) : (
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">暂未打卡</p>
                    )}
                </div>
            )}
        </div>
    )
}

import { useState, useMemo, memo, useRef, useCallback } from 'react'
import { provinces, CHINA_MAP_VIEWBOX, type ProvinceData } from '../../data/chinaMapData'
import type { MapCheckin } from '../../types'
import MapPin from './MapPin'
import RouteLines from './RouteLines'
import Icon from '../icons/Icons'

interface ChinaMapProps {
    checkins: MapCheckin[]
    onProvinceClick: (province: ProvinceData) => void
    showHeatmap?: boolean
    showRoute?: boolean
}

// 提取省份路径组件以利用 memo
const ProvincePath = memo(({
    province,
    fill,
    stroke,
    strokeWidth,
    onClick,
    onMouseEnter,
    onMouseLeave
}: {
    province: ProvinceData
    fill: string
    stroke: string
    strokeWidth: number
    onClick: (province: ProvinceData) => void
    onMouseEnter: (province: ProvinceData, e: React.MouseEvent) => void
    onMouseLeave: () => void
}) => {
    // 使用 useCallback 包装局部事件处理，避免每次渲染创建新函数
    const handleClick = useCallback(() => onClick(province), [onClick, province])
    const handleMouseEnter = useCallback((e: React.MouseEvent) => onMouseEnter(province, e), [onMouseEnter, province])

    return (
        <path
            d={province.path}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            className="cursor-pointer transition-colors duration-200"
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={onMouseLeave}
        />
    )
}, (prev, next) => {
    // 自定义比较函数，只在关键属性变化时重渲染
    return prev.fill === next.fill &&
        prev.stroke === next.stroke &&
        prev.strokeWidth === next.strokeWidth &&
        prev.province.id === next.province.id
})

ProvincePath.displayName = 'ProvincePath'

export default function ChinaMap({ checkins, onProvinceClick, showHeatmap = false, showRoute = true }: ChinaMapProps) {
    const [hoveredProvince, setHoveredProvince] = useState<string | null>(null)
    const [tooltipData, setTooltipData] = useState<{ name: string; count: number } | null>(null)
    const [scale, setScale] = useState(1)
    const [translate, setTranslate] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const dragStart = useRef({ x: 0, y: 0 })
    const tooltipRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const svgRef = useRef<SVGSVGElement>(null)

    // 统计每个省份的打卡数量
    const provinceCheckinCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        checkins.forEach(c => {
            counts[c.province] = (counts[c.province] || 0) + 1
        })
        return counts
    }, [checkins])

    const maxCount = useMemo(() => {
        return Math.max(...Object.values(provinceCheckinCounts), 1)
    }, [provinceCheckinCounts])

    const checkedProvinces = useMemo(() => new Set(Object.keys(provinceCheckinCounts)), [provinceCheckinCounts])

    // 缩放控制
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        setScale(prev => Math.min(Math.max(prev + delta, 1), 3))
    }, [])

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true)
        dragStart.current = { x: e.clientX - translate.x, y: e.clientY - translate.y }
    }, [translate])

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        // 拖拽逻辑
        if (isDragging) {
            e.preventDefault()
            setTranslate({
                x: e.clientX - dragStart.current.x,
                y: e.clientY - dragStart.current.y
            })
        }
        // tooltip 位置更新
        if (tooltipRef.current && tooltipData) {
            updateTooltipPosition(e)
        }
    }, [isDragging])

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
    }, [])

    const handleReset = useCallback(() => {
        setScale(1)
        setTranslate({ x: 0, y: 0 })
    }, [])

    // 热力图颜色生成
    const getHeatmapColor = useCallback((province: ProvinceData) => {
        const count = provinceCheckinCounts[province.name] || 0
        if (count === 0) return '#F0ECE8'

        const ratio = count / maxCount
        
        // 从浅黄到橙到红的渐变
        if (ratio < 0.33) {
            const t = ratio / 0.33
            return `rgb(${255}, ${Math.round(255 - t * 100)}, ${Math.round(200 - t * 100)})`
        } else if (ratio < 0.66) {
            const t = (ratio - 0.33) / 0.33
            return `rgb(${255}, ${Math.round(155 - t * 50)}, ${Math.round(100 - t * 50)})`
        } else {
            const t = (ratio - 0.66) / 0.34
            return `rgb(${255}, ${Math.round(105 - t * 30)}, ${Math.round(50 - t * 20)})`
        }
    }, [provinceCheckinCounts, maxCount])

    // 使用 useCallback 保持引用稳定
    const handleProvinceMouseEnter = useCallback((province: ProvinceData, e: React.MouseEvent) => {
        setHoveredProvince(province.id)
        setTooltipData({
            name: province.name,
            count: provinceCheckinCounts[province.name] || 0
        })

        // 初始位置设置，避免闪烁
        updateTooltipPosition(e)
    }, [provinceCheckinCounts])

    const handleMouseLeave = useCallback(() => {
        setHoveredProvince(null)
        setTooltipData(null)
    }, [])

    // 直接操作 DOM 更新位置，避免触发 React 重渲染
    const updateTooltipPosition = (e: React.MouseEvent) => {
        if (!tooltipRef.current || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top - 10

        tooltipRef.current.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`
    }

    const getProvinceFill = useCallback((province: ProvinceData, isHovered: boolean) => {
        const isChecked = checkedProvinces.has(province.name)

        if (isChecked && isHovered) return '#C9ADA7'  // primary darker
        if (isChecked) return '#DEB3AD'  // morandi-rose
        if (isHovered) return '#D6CFC7'  // morandi-yellow hover
        return '#F0ECE8'  // light base
    }, [checkedProvinces])

    const getProvinceStroke = useCallback((province: ProvinceData) => {
        const isChecked = checkedProvinces.has(province.name)
        if (isChecked) return '#B7A39E'
        return '#D6CFC7'
    }, [checkedProvinces])

    return (
        <div
            ref={containerRef}
            className="relative w-full overflow-hidden"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
            {/* 缩放控制按钮 */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
                <button
                    onClick={() => setScale(prev => Math.min(prev + 0.2, 3))}
                    className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-primary transition-all"
                    title="放大"
                >
                    <Icon name="zoom_in" size={20} />
                </button>
                <button
                    onClick={() => setScale(prev => Math.max(prev - 0.2, 1))}
                    className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-primary transition-all"
                    title="缩小"
                >
                    <Icon name="zoom_out" size={20} />
                </button>
                <button
                    onClick={handleReset}
                    className="w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-slate-600 hover:bg-white hover:text-primary transition-all"
                    title="复位"
                >
                    <Icon name="restart_alt" size={20} />
                </button>
            </div>

            {/* 缩放百分比显示 */}
            <div className="absolute left-4 top-4 z-20 bg-white/90 backdrop-blur-sm shadow-lg rounded-xl px-4 py-2 text-sm font-bold text-slate-600">
                {Math.round(scale * 100)}%
            </div>

            <svg
                ref={svgRef}
                viewBox={CHINA_MAP_VIEWBOX}
                className="w-full h-auto transition-transform duration-100"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                    transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                    transformOrigin: 'center center'
                }}
            >
                {/* 背景 */}
                <rect width="900" height="700" fill="transparent" />

                {/* 省份路径 */}
                <g>
                    {provinces.map(province => (
                        <ProvincePath
                            key={province.id}
                            province={province}
                            fill={showHeatmap ? getHeatmapColor(province) : getProvinceFill(province, hoveredProvince === province.id)}
                            stroke={getProvinceStroke(province)}
                            strokeWidth={hoveredProvince === province.id ? 2 : 1}
                            onClick={onProvinceClick}
                            onMouseEnter={handleProvinceMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        />
                    ))}
                </g>

                {/* 路线连线 */}
                <RouteLines checkins={checkins} showRoute={showRoute} />

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

                {/* 省份名称标签 - 显示所有有打卡的省份 */}
                {provinces.filter(p => checkedProvinces.has(p.name)).map(province => (
                    <text
                        key={`label-${province.id}`}
                        x={province.center[0]}
                        y={province.center[1] - 15}
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

            {/* Tooltip - 使用 opacity 控制显示隐藏以保留 DOM 引用 */}
            <div
                ref={tooltipRef}
                className="absolute pointer-events-none z-20 bg-white/95 backdrop-blur-md shadow-lg rounded-2xl px-4 py-2.5 border border-white/80 transition-opacity duration-150 will-change-transform"
                style={{
                    left: 0,
                    top: 0,
                    opacity: tooltipData ? 1 : 0,
                    // 初始位置移出屏幕以免闪烁
                    transform: 'translate(-1000px, -1000px)'
                }}
            >
                {tooltipData && (
                    <>
                        <p className="text-sm font-bold text-slate-700">{tooltipData.name}</p>
                        {tooltipData.count > 0 ? (
                            <p className="text-[10px] font-bold text-primary tracking-widest uppercase">{tooltipData.count} 个打卡</p>
                        ) : (
                            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">暂未打卡</p>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

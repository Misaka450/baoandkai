import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import type { MapCheckin } from '../../types'
import { provinces } from '../../data/chinaMapData'

interface RouteLinesProps {
    checkins: MapCheckin[]
    showRoute?: boolean
}

interface Point {
    x: number
    y: number
    checkin: MapCheckin
}

// 根据日期判断季节
function getSeason(dateStr: string): 'spring' | 'summer' | 'autumn' | 'winter' {
    const month = new Date(dateStr).getMonth() + 1
    if (month >= 3 && month <= 5) return 'spring'
    if (month >= 6 && month <= 8) return 'summer'
    if (month >= 9 && month <= 11) return 'autumn'
    return 'winter'
}

const seasonColors = {
    spring: '#8BC34A',
    summer: '#FF9800',
    autumn: '#FF5722',
    winter: '#2196F3'
}

const seasonEmojis = {
    spring: '🌸',
    summer: '☀️',
    autumn: '🍂',
    winter: '❄️'
}

function RouteLines({ checkins, showRoute = true }: RouteLinesProps) {
    // 按日期排序并获取有效坐标的点
    const points = useMemo(() => {
        if (!showRoute || checkins.length < 2) return []

        const sortedCheckins = [...checkins]
            .filter(c => c.date)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        const result: Point[] = []
        for (const checkin of sortedCheckins) {
            const provinceData = provinces.find(p => p.name === checkin.province)
            if (provinceData) {
                result.push({
                    x: provinceData.center[0],
                    y: provinceData.center[1],
                    checkin
                })
            }
        }
        return result
    }, [checkins, showRoute])

    if (points.length < 2) return null

    // 生成平滑的曲线路径
    const pathData = useMemo(() => {
        if (points.length < 2) return ''

        const first = points[0]
        if (!first) return ''

        let path = `M ${first.x} ${first.y}`

        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1]
            const curr = points[i]
            if (!prev || !curr) continue

            // 使用二次贝塞尔曲线使路径更平滑
            const midX = (prev.x + curr.x) / 2
            const midY = (prev.y + curr.y) / 2
            path += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`
        }

        // 最后一段
        const last = points[points.length - 1]
        if (last) {
            path += ` L ${last.x} ${last.y}`
        }

        return path
    }, [points])

    // 路径总长度
    const pathLength = useMemo(() => {
        return points.length * 100
    }, [points.length])

    return (
        <g className="route-lines">
            {/* 渐变定义 */}
            <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    {points.map((point, i) => {
                        const season = point ? getSeason(point.checkin.date) : 'spring'
                        return (
                            <stop
                                key={i}
                                offset={`${(i / (points.length - 1)) * 100}%`}
                                stopColor={seasonColors[season]}
                            />
                        )
                    })}
                </linearGradient>

                {/* 箭头标记 */}
                <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                >
                    <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#C9ADA7"
                        opacity="0.6"
                    />
                </marker>
            </defs>

            {/* 路线阴影 */}
            <motion.path
                d={pathData}
                fill="none"
                stroke="rgba(0,0,0,0.1)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
            />

            {/* 主路线 */}
            <motion.path
                d={pathData}
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={`${pathLength} ${pathLength}`}
                initial={{ strokeDashoffset: pathLength }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 2.5, ease: "easeInOut" }}
                markerEnd="url(#arrowhead)"
                opacity="0.8"
            />

            {/* 季节节点 */}
            {points.map((point, i) => (
                <motion.g
                    key={`${point.checkin.id}-${i}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.3 }}
                >
                    {/* 外圈 */}
                    <circle
                        cx={point.x}
                        cy={point.y}
                        r={12}
                        fill={seasonColors[getSeason(point.checkin.date)]}
                        opacity="0.2"
                    />
                    {/* 内圈 */}
                    <circle
                        cx={point.x}
                        cy={point.y}
                        r={6}
                        fill={seasonColors[getSeason(point.checkin.date)]}
                        stroke="white"
                        strokeWidth="2"
                    />
                    {/* 季节图标 */}
                    <text
                        x={point.x}
                        y={point.y + 20}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#666"
                    >
                        {seasonEmojis[getSeason(point.checkin.date)]}
                    </text>
                </motion.g>
            ))}
        </g>
    )
}

export default memo(RouteLines)

// 导出季节工具函数供其他组件使用
export { getSeason, seasonColors, seasonEmojis }

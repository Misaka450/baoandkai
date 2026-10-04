import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { MapCheckin } from '../../types'
import { provinces, CHINA_MAP_VIEWBOX, type ProvinceData } from '../../data/chinaMapData'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import Icon from '../icons/Icons'
import LazyImage from '../common/LazyImage'

interface TravelPlaybackProps {
    checkins: MapCheckin[]
    onClose: () => void
}

interface PlaybackPoint {
    x: number
    y: number
    checkin: MapCheckin
    provinceData: ProvinceData
}

// 季节工具方法
function getSeasonInfo(dateStr: string): { name: string; emoji: string; color: string } {
    try {
        const month = new Date(dateStr).getMonth() + 1
        if (month >= 3 && month <= 5) return { name: '春暖', emoji: '🌸', color: '#8BC34A' }
        if (month >= 6 && month <= 8) return { name: '盛夏', emoji: '☀️', color: '#FF9800' }
        if (month >= 9 && month <= 11) return { name: '金秋', emoji: '🍂', color: '#FF5722' }
        return { name: '初冬', emoji: '❄️', color: '#64B5F6' }
    } catch {
        return { name: '漫游', emoji: '✨', color: '#E0A96D' }
    }
}

// 格式化日期：YYYY.MM.DD
function formatPlaybackDate(dateStr: string): string {
    try {
        const d = new Date(dateStr)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}.${month}.${day}`
    } catch {
        return dateStr
    }
}

// 二次贝塞尔曲线控制点（产生微微上扬或弧度优雅的航线）
function getFlightCurve(
    p1: { x: number; y: number },
    p2: { x: number; y: number }
): { control: { x: number; y: number }; path: string; distance: number } {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const distance = Math.hypot(dx, dy)
    const midX = (p1.x + p2.x) / 2
    const midY = (p1.y + p2.y) / 2

    // 向上拱起的法向量
    const nx = -dy / (distance || 1)
    const ny = dx / (distance || 1)
    // 弯曲高度根据距离调整，最高不超过 80
    const curveAmount = Math.min(Math.max(distance * 0.18, 25), 75)
    
    // 航线保持向上方自然微弯
    const sign = ny > 0 ? -1 : 1
    const cx = midX + nx * curveAmount * 0.4
    const cy = midY - Math.abs(ny * curveAmount * 0.8) - 15

    return {
        control: { x: cx, y: cy },
        path: `M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}`,
        distance
    }
}

// 计算二次贝塞尔曲线上的点与切线角度
function getQuadraticBezierPointAndAngle(
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    t: number
): { x: number; y: number; angle: number } {
    const clampedT = Math.max(0, Math.min(1, t))
    const inv = 1 - clampedT

    // B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
    const x = inv * inv * p0.x + 2 * inv * clampedT * p1.x + clampedT * clampedT * p2.x
    const y = inv * inv * p0.y + 2 * inv * clampedT * p1.y + clampedT * clampedT * p2.y

    // 一阶导数 B'(t) = 2(1-t)(P1 - P0) + 2t(P2 - P1)
    const dx = 2 * inv * (p1.x - p0.x) + 2 * clampedT * (p2.x - p1.x)
    const dy = 2 * inv * (p1.y - p0.y) + 2 * clampedT * (p2.y - p1.y)

    // 切线航向角（转为角度）
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI

    return { x, y, angle }
}

export default function TravelPlayback({ checkins, onClose }: TravelPlaybackProps) {
    useBodyScrollLock(true)

    // 播放速率倍率 0.5x, 1x, 2x
    const [speed, setSpeed] = useState<number>(1)
    const [isPlaying, setIsPlaying] = useState<boolean>(true)
    const [isCompleted, setIsCompleted] = useState<boolean>(false)

    // 当前停驻/聚焦的站点索引
    const [currentIndex, setCurrentIndex] = useState<number>(0)
    // 航行动画阶段：'docked'（停驻观赏回忆）| 'flying'（飞机航行中）
    const [stage, setStage] = useState<'docked' | 'flying'>('docked')
    // 飞行进度 0 ~ 1
    const [flightProgress, setFlightProgress] = useState<number>(0)

    const timerRef = useRef<number | null>(null)
    const animationFrameRef = useRef<number | null>(null)

    // 预构建省份映射表
    const provinceMap = useMemo(() => new Map(provinces.map(p => [p.name, p])), [])

    // 1. 过滤有效且包含 province 的打卡记录，按 checkin.date 升序排列
    const validPoints = useMemo<PlaybackPoint[]>(() => {
        if (!checkins || checkins.length === 0) return []

        const sorted = [...checkins]
            .filter(c => c && c.province && c.date)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        const list: PlaybackPoint[] = []
        for (const item of sorted) {
            const pData = provinceMap.get(item.province)
            if (pData) {
                list.push({
                    x: pData.center[0],
                    y: pData.center[1],
                    checkin: item,
                    provinceData: pData
                })
            }
        }
        return list
    }, [checkins, provinceMap])

    const totalPoints = validPoints.length
    const currentPoint = validPoints[currentIndex]

    // 触觉反馈安全封装
    const triggerHaptic = useCallback(() => {
        try {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate(10)
            }
        } catch {
            // ignore vibrate errors
        }
    }, [])

    // 清理动画和定时器
    const clearTimers = useCallback(() => {
        if (timerRef.current !== null) {
            window.clearTimeout(timerRef.current)
            timerRef.current = null
        }
        if (animationFrameRef.current !== null) {
            window.cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
        }
    }, [])

    // 跳转到指定站点
    const jumpToStation = useCallback((targetIndex: number) => {
        clearTimers()
        const nextIdx = Math.max(0, Math.min(targetIndex, totalPoints - 1))
        setCurrentIndex(nextIdx)
        setStage('docked')
        setFlightProgress(0)
        setIsCompleted(false)
        triggerHaptic()
    }, [clearTimers, totalPoints, triggerHaptic])

    // 重置并重新开始漫游
    const restartPlayback = useCallback(() => {
        jumpToStation(0)
        setIsPlaying(true)
    }, [jumpToStation])

    // 动画推进主循环
    useEffect(() => {
        clearTimers()

        if (!isPlaying || totalPoints < 2 || isCompleted) {
            return
        }

        // 当前处于停驻观赏回忆阶段
        if (stage === 'docked') {
            // 观赏停留时长，基础 3200ms / speed
            const stayDuration = Math.max(1200, 3200 / speed)
            timerRef.current = window.setTimeout(() => {
                if (currentIndex < totalPoints - 1) {
                    setStage('flying')
                    setFlightProgress(0)
                } else {
                    // 已达最后一站，完结结算
                    setIsCompleted(true)
                    setIsPlaying(false)
                }
            }, stayDuration)
        } else if (stage === 'flying') {
            // 正在飞往下一站 (currentIndex -> currentIndex + 1)
            const p1 = validPoints[currentIndex]
            const p2 = validPoints[currentIndex + 1]
            if (!p1 || !p2) {
                setStage('docked')
                return
            }

            const { distance } = getFlightCurve(p1, p2)
            // 飞行时长根据距离动态计算：基础 1600ms + 距离补正，受播放速率缩放
            const baseFlightTime = (1400 + Math.min(distance * 3, 1400)) / speed
            const startTime = performance.now()

            const animateFlight = (now: number) => {
                const elapsed = now - startTime
                const progress = Math.min(elapsed / baseFlightTime, 1)

                // 缓动函数 easeInOutCubic
                const eased = progress < 0.5
                    ? 4 * progress * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2

                setFlightProgress(eased)

                if (progress < 1) {
                    animationFrameRef.current = window.requestAnimationFrame(animateFlight)
                } else {
                    // 抵达下一站
                    setFlightProgress(1)
                    setCurrentIndex(prev => prev + 1)
                    setStage('docked')
                    triggerHaptic()
                }
            }

            animationFrameRef.current = window.requestAnimationFrame(animateFlight)
        }

        return () => {
            clearTimers()
        }
    }, [isPlaying, stage, currentIndex, totalPoints, speed, isCompleted, validPoints, clearTimers, triggerHaptic])

    // 键盘快捷键监听：空格暂停/播放，左右方向键切站，Esc退出
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault()
                onClose()
            } else if (e.key === ' ') {
                e.preventDefault()
                if (isCompleted) {
                    restartPlayback()
                } else {
                    setIsPlaying(prev => !prev)
                }
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault()
                if (currentIndex > 0) {
                    jumpToStation(currentIndex - 1)
                }
            } else if (e.key === 'ArrowRight') {
                e.preventDefault()
                if (currentIndex < totalPoints - 1) {
                    jumpToStation(currentIndex + 1)
                } else {
                    setIsCompleted(true)
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onClose, isCompleted, currentIndex, totalPoints, jumpToStation, restartPlayback])

    // 历史走过的所有省份 ID 集合
    const visitedProvinceIds = useMemo(() => {
        const ids = new Set<string>()
        const count = isCompleted ? totalPoints : (stage === 'docked' ? currentIndex + 1 : currentIndex + 1)
        for (let i = 0; i < Math.min(count, totalPoints); i++) {
            const p = validPoints[i]
            if (p) ids.add(p.provinceData.id)
        }
        return ids
    }, [validPoints, currentIndex, stage, isCompleted, totalPoints])

    // 历史所有已完成航线的 path 列表
    const completedRoutes = useMemo(() => {
        const routes: Array<{ path: string; key: string }> = []
        const maxIdx = isCompleted ? totalPoints - 1 : currentIndex
        for (let i = 0; i < maxIdx; i++) {
            const p1 = validPoints[i]
            const p2 = validPoints[i + 1]
            if (p1 && p2) {
                const { path } = getFlightCurve(p1, p2)
                routes.push({ path, key: `${i}-${i + 1}` })
            }
        }
        return routes
    }, [validPoints, currentIndex, isCompleted, totalPoints])

    // 当前飞行段的曲线与飞机当前坐标、姿态
    const currentFlightInfo = useMemo(() => {
        if (stage !== 'flying' || currentIndex >= totalPoints - 1 || isCompleted) {
            return null
        }
        const p1 = validPoints[currentIndex]
        const p2 = validPoints[currentIndex + 1]
        if (!p1 || !p2) return null

        const { control, path } = getFlightCurve(p1, p2)
        const plane = getQuadraticBezierPointAndAngle(p1, control, p2, flightProgress)

        return {
            path,
            plane
        }
    }, [stage, currentIndex, totalPoints, isCompleted, validPoints, flightProgress])

    // 旅途圆满达成统计数据
    const grandFinaleStats = useMemo(() => {
        if (validPoints.length === 0) return null

        const provinceSet = new Set(validPoints.map(p => p.checkin.province))
        const citySet = new Set(validPoints.map(p => p.checkin.city || p.checkin.province))

        let daysCount = 1
        try {
            const firstPoint = validPoints[0]
            const lastPoint = validPoints[validPoints.length - 1]
            if (firstPoint && lastPoint) {
                const firstTime = new Date(firstPoint.checkin.date).getTime()
                const lastTime = new Date(lastPoint.checkin.date).getTime()
                const diffDays = Math.ceil(Math.abs(lastTime - firstTime) / (1000 * 60 * 60 * 24))
                daysCount = Math.max(diffDays, 1)
            }
        } catch {
            daysCount = 1
        }

        return {
            provincesCount: provinceSet.size,
            citiesCount: citySet.size,
            daysCount,
            totalStations: validPoints.length
        }
    }, [validPoints])

    // 如果打卡站点少于 1 个，给出温馨提示
    if (totalPoints < 1) {
        return createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl text-white">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-slate-900/80 border border-slate-700/60 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-2xl"
                >
                    <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto mb-5 text-2xl">
                        ✈️
                    </div>
                    <h3 className="text-xl font-bold mb-2">时光航线静待启程</h3>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        目前还没有包含省份位置信息的足迹打卡记录哦。和心爱的人去更多地方看看，留下一张张温馨打卡吧！
                    </p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-rose-400 text-white font-medium shadow-lg hover:shadow-primary/30 transition-all cursor-pointer"
                    >
                        我知道啦
                    </button>
                </motion.div>
            </div>,
            document.body
        )
    }

    const currentSeason = currentPoint ? getSeasonInfo(currentPoint.checkin.date) : null
    const firstImage = currentPoint?.checkin.images && currentPoint.checkin.images.length > 0 ? currentPoint.checkin.images[0] : null

    return createPortal(
        <div className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden bg-slate-950 text-slate-100 select-none">
            {/* 深色莫兰迪星空渐变与柔和径向星晕 */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950" />
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-indigo-500/10 rounded-full blur-[140px]" />
                <div className="absolute bottom-10 -left-20 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[130px]" />
                <div className="absolute top-1/3 -right-20 w-[450px] h-[450px] bg-amber-400/10 rounded-full blur-[120px]" />
                {/* 细腻微粒星光纹理 */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.06]" />
            </div>

            {/* 顶部工具栏 */}
            <header className="relative z-20 flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4 border-b border-white/5 bg-slate-950/40 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-primary/30 to-amber-300/30 border border-white/10 flex items-center justify-center text-lg shadow-inner">
                        ✈️
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="font-bold text-sm sm:text-base tracking-wide bg-gradient-to-r from-amber-200 via-rose-200 to-indigo-200 bg-clip-text text-transparent">
                                旅途时光漫游
                            </h2>
                            <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest text-slate-400 font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                                Flight Route Playback
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                            <span>第 <strong className="text-amber-300 font-bold">{currentIndex + 1}</strong> 站</span>
                            <span className="opacity-40">/</span>
                            <span>共 {totalPoints} 站</span>
                        </p>
                    </div>
                </div>

                {/* 右上角操作区 */}
                <div className="flex items-center gap-2">
                    {/* 快捷键提示 (仅大屏显示) */}
                    <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">Space</kbd>
                        <span>播放</span>
                        <span className="opacity-30">·</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">←/→</kbd>
                        <span>切站</span>
                        <span className="opacity-30">·</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">Esc</kbd>
                        <span>退出</span>
                    </div>

                    <button
                        onClick={onClose}
                        title="关闭 (Esc)"
                        aria-label="关闭漫游"
                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/10 backdrop-blur-md"
                    >
                        <Icon name="close" size={18} />
                    </button>
                </div>
            </header>

            {/* 中央舞台：ChinaMap SVG 与 动态航线/飞机 */}
            <main className="relative z-10 flex-1 flex items-center justify-center p-2 sm:p-4 overflow-hidden min-h-0">
                <div className="relative w-full h-full max-w-5xl max-h-[72vh] flex items-center justify-center">
                    <svg
                        viewBox={CHINA_MAP_VIEWBOX}
                        className="w-full h-full object-contain filter drop-shadow-[0_10px_35px_rgba(0,0,0,0.5)]"
                    >
                        <defs>
                            {/* 航线发光渐变 */}
                            <linearGradient id="flightLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.9" />
                                <stop offset="50%" stopColor="#F472B6" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.9" />
                            </linearGradient>

                            {/* 历史航线渐变 */}
                            <linearGradient id="historyLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#D97706" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#EC4899" stopOpacity="0.4" />
                            </linearGradient>

                            {/* 站点脉冲光晕滤镜 */}
                            <filter id="glowEffect" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* 1. 底图：中国所有省份轮廓 */}
                        <g className="provinces-layer">
                            {provinces.map(prov => {
                                const isVisited = visitedProvinceIds.has(prov.id)
                                return (
                                    <path
                                        key={prov.id}
                                        d={prov.path}
                                        fill={isVisited ? 'rgba(217, 119, 6, 0.22)' : 'rgba(30, 41, 59, 0.45)'}
                                        stroke={isVisited ? 'rgba(251, 191, 36, 0.55)' : 'rgba(71, 85, 105, 0.35)'}
                                        strokeWidth={isVisited ? 1.2 : 0.8}
                                        className="transition-colors duration-700 ease-out"
                                    />
                                )
                            })}
                        </g>

                        {/* 2. 走过的历史航线连线（淡金/莫兰迪粉虚线） */}
                        <g className="history-routes">
                            {completedRoutes.map(route => (
                                <motion.path
                                    key={route.key}
                                    d={route.path}
                                    fill="none"
                                    stroke="url(#historyLineGrad)"
                                    strokeWidth={isCompleted ? 2.5 : 1.8}
                                    strokeDasharray="4 4"
                                    className="transition-all duration-500"
                                />
                            ))}
                        </g>

                        {/* 3. 当前正在飞行的动态航线与轨迹 */}
                        {currentFlightInfo && (
                            <g className="active-flight-route">
                                {/* 完整曲线底色 */}
                                <path
                                    d={currentFlightInfo.path}
                                    fill="none"
                                    stroke="rgba(255, 255, 255, 0.15)"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                />
                                {/* 正在飞行的高光航线 */}
                                <path
                                    d={currentFlightInfo.path}
                                    fill="none"
                                    stroke="url(#flightLineGrad)"
                                    strokeWidth={3}
                                    pathLength={1}
                                    strokeDasharray="1"
                                    strokeDashoffset={1 - flightProgress}
                                    style={{
                                        filter: 'drop-shadow(0 0 6px rgba(244, 114, 182, 0.6))'
                                    }}
                                />

                                {/* 飞机图标：沿切线角度平滑朝向旋转 */}
                                <g
                                    transform={`translate(${currentFlightInfo.plane.x}, ${currentFlightInfo.plane.y}) rotate(${currentFlightInfo.plane.angle + 90})`}
                                    style={{ transformOrigin: 'center' }}
                                >
                                    {/* 飞机外围光环 */}
                                    <circle r="12" fill="rgba(251, 191, 36, 0.2)" className="animate-ping" />
                                    <circle r="7" fill="rgba(255, 255, 255, 0.9)" />
                                    {/* 精致小飞机 SVG */}
                                    <g transform="translate(-10, -10)">
                                        <path
                                            d="M10 2 L12 8 L18 10 L12 12 L12 16 L14 17 L14 18 L10 17 L6 18 L6 17 L8 16 L8 12 L2 10 L8 8 Z"
                                            fill="#F59E0B"
                                            stroke="#FFF"
                                            strokeWidth="1"
                                        />
                                    </g>
                                </g>
                            </g>
                        )}

                        {/* 4. 站点标记与脉冲光晕 */}
                        <g className="stations-layer">
                            {validPoints.map((pt, idx) => {
                                const isCurrent = idx === currentIndex && !isCompleted
                                const isPassed = idx <= currentIndex || isCompleted

                                return (
                                    <g
                                        key={idx}
                                        transform={`translate(${pt.x}, ${pt.y})`}
                                        onClick={() => jumpToStation(idx)}
                                        className="cursor-pointer group"
                                    >
                                        {/* 当前站点的雷达脉冲光晕 (Pulsing Ripple) */}
                                        {isCurrent && (
                                            <>
                                                <circle
                                                    r="18"
                                                    fill="none"
                                                    stroke="#F59E0B"
                                                    strokeWidth="1.5"
                                                    className="animate-ping opacity-75"
                                                />
                                                <circle
                                                    r="28"
                                                    fill="rgba(245, 158, 11, 0.15)"
                                                    className="animate-pulse"
                                                />
                                            </>
                                        )}

                                        {/* 站点实心圆点 */}
                                        <circle
                                            r={isCurrent ? 7 : (isPassed ? 4.5 : 3.5)}
                                            fill={isCurrent ? '#F59E0B' : (isPassed ? '#FCD34D' : '#475569')}
                                            stroke={isCurrent ? '#FFFFFF' : '#1E293B'}
                                            strokeWidth={isCurrent ? 2 : 1}
                                            filter={isCurrent ? 'url(#glowEffect)' : undefined}
                                            className="transition-all duration-300 group-hover:scale-125"
                                        />

                                        {/* 省份名/城市微型文本标签 */}
                                        {(isCurrent || isCompleted) && (
                                            <text
                                                y={isCurrent ? -14 : -9}
                                                textAnchor="middle"
                                                fill={isCurrent ? '#FDE68A' : '#CBD5E1'}
                                                fontSize={isCurrent ? 11 : 9}
                                                fontWeight={isCurrent ? 'bold' : 'normal'}
                                                className="pointer-events-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                                            >
                                                {pt.checkin.city || pt.provinceData.name}
                                            </text>
                                        )}
                                    </g>
                                )
                            })}
                        </g>
                    </svg>

                    {/* 3. 站台回忆聚焦卡片 (Spotlight Card) */}
                    <AnimatePresence mode="wait">
                        {currentPoint && !isCompleted && (
                            <motion.div
                                key={currentPoint.checkin.id || currentIndex}
                                initial={{ opacity: 0, y: 30, scale: 0.92 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                                className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 max-w-sm sm:w-80 pointer-events-auto"
                            >
                                <div className="bg-slate-900/90 border border-slate-700/70 rounded-2xl p-3.5 sm:p-4 shadow-2xl backdrop-blur-2xl text-slate-100 relative overflow-hidden group">
                                    {/* 莫兰迪顶部淡色装饰条 */}
                                    <div
                                        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r"
                                        style={{
                                            backgroundImage: `linear-gradient(to right, ${currentSeason?.color || '#F59E0B'}, #EC4899)`
                                        }}
                                    />

                                    {/* 城市与省份 + 季节标识 */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-rose-400">📍</span>
                                            <span className="font-bold text-sm sm:text-base text-slate-100">
                                                {currentPoint.provinceData.name}
                                                {currentPoint.checkin.city && currentPoint.checkin.city !== currentPoint.provinceData.name
                                                    ? ` · ${currentPoint.checkin.city}`
                                                    : ''}
                                            </span>
                                        </div>
                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-amber-200 border border-white/10 font-medium">
                                            {currentSeason?.emoji} {currentSeason?.name}
                                        </span>
                                    </div>

                                    {/* 打卡日期 */}
                                    <div className="text-[11px] text-slate-400 mb-2.5 font-mono flex items-center gap-1.5">
                                        <span>📅 {formatPlaybackDate(currentPoint.checkin.date)}</span>
                                        <span className="opacity-40">|</span>
                                        <span>第 {currentIndex + 1} 站</span>
                                    </div>

                                    {/* 拍立得照片缩略图 */}
                                    {firstImage && (
                                        <div className="mb-2.5 rounded-xl overflow-hidden bg-slate-950/80 border border-white/10 relative max-h-36 sm:max-h-40 flex items-center justify-center">
                                            <LazyImage
                                                src={firstImage}
                                                alt={currentPoint.checkin.title || '旅行回忆照片'}
                                                className="w-full h-full object-cover rounded-xl"
                                                aspectRatio="16/9"
                                                width={400}
                                            />
                                        </div>
                                    )}

                                    {/* 标题与描述 */}
                                    <div>
                                        <h4 className="font-bold text-xs sm:text-sm text-slate-200 line-clamp-1">
                                            {currentPoint.checkin.title || '漫游打卡'}
                                        </h4>
                                        {currentPoint.checkin.description && (
                                            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                                {currentPoint.checkin.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 5. 旅途圆满达成结算画面 (Grand Finale) */}
                    <AnimatePresence>
                        {isCompleted && grandFinaleStats && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.88 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ type: 'spring', damping: 22, stiffness: 220 }}
                                className="absolute inset-4 sm:inset-auto sm:max-w-md w-full bg-slate-900/95 border border-amber-400/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.25)] backdrop-blur-2xl text-center flex flex-col items-center justify-center z-30"
                            >
                                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 text-white flex items-center justify-center text-3xl mb-4 shadow-lg shadow-amber-500/20">
                                    🏆
                                </div>

                                <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-200 via-rose-200 to-amber-100 bg-clip-text text-transparent mb-1">
                                    时光漫游圆满完成
                                </h3>
                                <p className="text-xs text-amber-200/70 font-mono mb-6">
                                    MEMORIES JOURNEY COMPLETED
                                </p>

                                {/* 统计网格 */}
                                <div className="grid grid-cols-3 gap-3 w-full mb-6">
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                                        <div className="text-xl sm:text-2xl font-extrabold text-amber-300 font-mono">
                                            {grandFinaleStats.provincesCount}
                                        </div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">打卡省份</div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                                        <div className="text-xl sm:text-2xl font-extrabold text-rose-300 font-mono">
                                            {grandFinaleStats.citiesCount}
                                        </div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">漫游城市</div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                                        <div className="text-xl sm:text-2xl font-extrabold text-sky-300 font-mono">
                                            {grandFinaleStats.totalStations}
                                        </div>
                                        <div className="text-[11px] text-slate-400 mt-0.5">珍贵足迹</div>
                                    </div>
                                </div>

                                {/* 浪漫寄语 */}
                                <p className="text-sm text-slate-300 font-medium mb-6 italic leading-relaxed">
                                    “包包和恺恺的漫游脚步还在继续…… ✨”
                                </p>

                                {/* 操作按钮组 */}
                                <div className="flex items-center gap-3 w-full">
                                    <button
                                        onClick={restartPlayback}
                                        className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 font-medium text-sm transition-all border border-white/10 flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <Icon name="restart_alt" size={16} />
                                        <span>重新漫游</span>
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-rose-400 hover:opacity-90 active:scale-95 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <Icon name="check" size={16} />
                                        <span>完成漫游</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* 4. 底栏播放控制器 */}
            <footer className="relative z-20 border-t border-white/5 bg-slate-950/60 backdrop-blur-xl px-4 sm:px-8 py-3 sm:py-4">
                <div className="max-w-4xl mx-auto flex flex-col gap-2.5">
                    {/* 进度指示条与站点选择器 */}
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] font-mono text-slate-400 w-12 text-right">
                            {currentIndex + 1} / {totalPoints}
                        </span>

                        {/* 可点击跳转的 Slider 进度条 */}
                        <div className="relative flex-1 py-2 flex items-center">
                            <input
                                type="range"
                                min={0}
                                max={totalPoints - 1}
                                value={currentIndex}
                                onChange={(e) => jumpToStation(Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
                            />
                        </div>

                        {/* 当前站城市名小标签 */}
                        <span className="text-[11px] font-medium text-amber-300 w-20 truncate">
                            {currentPoint?.checkin.city || currentPoint?.provinceData.name || ''}
                        </span>
                    </div>

                    {/* 控制按钮组 */}
                    <div className="flex items-center justify-between">
                        {/* 播放速率切换：0.5x, 1.0x, 2.0x */}
                        <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-xl border border-white/5">
                            {[0.5, 1.0, 2.0].map((rate) => (
                                <button
                                    key={rate}
                                    onClick={() => setSpeed(rate)}
                                    className={`px-2.5 py-1 text-xs rounded-lg font-mono font-medium transition-all cursor-pointer ${
                                        speed === rate
                                            ? 'bg-amber-400 text-slate-950 shadow-sm'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    {rate}x
                                </button>
                            ))}
                        </div>

                        {/* 上一站 / 播放与暂停 / 下一站 */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* 上一站 */}
                            <button
                                onClick={() => jumpToStation(currentIndex - 1)}
                                disabled={currentIndex <= 0}
                                title="上一站 (←)"
                                aria-label="上一站"
                                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-slate-200 flex items-center justify-center transition-all cursor-pointer border border-white/5"
                            >
                                <Icon name="chevron_left" size={20} />
                            </button>

                            {/* 播放 / 暂停 */}
                            <button
                                onClick={() => {
                                    if (isCompleted) {
                                        restartPlayback()
                                    } else {
                                        setIsPlaying(prev => !prev)
                                    }
                                }}
                                title={isPlaying ? '暂停 (Space)' : '播放 (Space)'}
                                aria-label={isPlaying ? '暂停' : '播放'}
                                className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 hover:opacity-90 active:scale-95 text-slate-950 flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-amber-500/25"
                            >
                                <Icon name={isCompleted ? 'restart_alt' : (isPlaying ? 'pause' : 'play_arrow')} size={22} />
                            </button>

                            {/* 下一站 */}
                            <button
                                onClick={() => {
                                    if (currentIndex < totalPoints - 1) {
                                        jumpToStation(currentIndex + 1)
                                    } else {
                                        setIsCompleted(true)
                                    }
                                }}
                                disabled={currentIndex >= totalPoints - 1 && isCompleted}
                                title="下一站 (→)"
                                aria-label="下一站"
                                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-slate-200 flex items-center justify-center transition-all cursor-pointer border border-white/5"
                            >
                                <Icon name="chevron_right" size={20} />
                            </button>
                        </div>

                        {/* 重头开始 / 重新漫游按钮 */}
                        <div>
                            <button
                                onClick={restartPlayback}
                                title="重新漫游"
                                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white transition-all border border-white/5 cursor-pointer"
                            >
                                <Icon name="refresh" size={14} />
                                <span className="hidden sm:inline">重头漫游</span>
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>,
        document.body
    )
}

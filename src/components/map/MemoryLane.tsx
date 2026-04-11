import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MapCheckin } from '../../types'
import Icon from '../icons/Icons'
import LazyImage from '../LazyImage'
import { getThumbnailUrl } from '../../utils/imageUtils'

interface MemoryLaneProps {
    checkins: MapCheckin[]
}

export default function MemoryLane({ checkins }: MemoryLaneProps) {
    const [showMemory, setShowMemory] = useState(false)
    const [currentMemory, setCurrentMemory] = useState<MapCheckin | null>(null)

    // 那年今日
    const memoryToday = useMemo(() => {
        const today = new Date()
        const currentMonth = today.getMonth() + 1
        const currentDay = today.getDate()

        const memories = checkins.filter(checkin => {
            const date = new Date(checkin.date)
            return date.getMonth() + 1 === currentMonth && date.getDate() === currentDay
        })

        return memories.length > 0 ? memories[Math.floor(Math.random() * memories.length)] : null
    }, [checkins])

    // 随机回忆
    const randomMemory = useMemo(() => {
        if (checkins.length === 0) return null
        return checkins[Math.floor(Math.random() * checkins.length)]
    }, [checkins])

    const handleShowMemory = (memory: MapCheckin) => {
        setCurrentMemory(memory)
        setShowMemory(true)
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    return (
        <>
            {/* 回忆卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 那年今日 */}
                {memoryToday && (
                    <motion.div
                        className="premium-card !p-6 cursor-pointer group"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        onClick={() => handleShowMemory(memoryToday)}
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center">
                                <Icon name="history" size={24} className="text-pink-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800">那年今日</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase">On This Day</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            {memoryToday.images && memoryToday.images.length > 0 ? (
                                <div className="w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0 shadow-md">
                                    <LazyImage
                                        src={getThumbnailUrl(memoryToday.images[0], 300)}
                                        alt={memoryToday.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                            ) : (
                                <div className="w-32 h-32 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                    <Icon name="photo" size={32} className="text-slate-300" />
                                </div>
                            )}
                            <div className="flex-1">
                                <h4 className="font-black text-slate-800 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                    {memoryToday.title}
                                </h4>
                                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                                    <Icon name="location_on" size={12} className="text-primary/40" />
                                    <span className="line-clamp-1">
                                        {memoryToday.province}
                                        {memoryToday.city ? ` · ${memoryToday.city}` : ''}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-300 font-bold">
                                    {formatDate(memoryToday.date)}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-primary text-sm font-bold">
                            <span>查看回忆</span>
                            <Icon name="arrow_forward" size={16} />
                        </div>
                    </motion.div>
                )}

                {/* 随机回忆 */}
                {randomMemory && (
                    <motion.div
                        className="premium-card !p-6 cursor-pointer group"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        onClick={() => handleShowMemory(randomMemory)}
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                <Icon name="casino" size={24} className="text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800">随机回忆</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase">Random Memory</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            {randomMemory.images && randomMemory.images.length > 0 ? (
                                <div className="w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0 shadow-md">
                                    <LazyImage
                                        src={getThumbnailUrl(randomMemory.images[0], 300)}
                                        alt={randomMemory.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                            ) : (
                                <div className="w-32 h-32 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                    <Icon name="photo" size={32} className="text-slate-300" />
                                </div>
                            )}
                            <div className="flex-1">
                                <h4 className="font-black text-slate-800 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                    {randomMemory.title}
                                </h4>
                                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
                                    <Icon name="location_on" size={12} className="text-primary/40" />
                                    <span className="line-clamp-1">
                                        {randomMemory.province}
                                        {randomMemory.city ? ` · ${randomMemory.city}` : ''}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-300 font-bold">
                                    {formatDate(randomMemory.date)}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-primary text-sm font-bold">
                            <span>探索回忆</span>
                            <Icon name="arrow_forward" size={16} />
                        </div>
                    </motion.div>
                )}
            </div>

            {/* 回忆详情弹窗 */}
            <AnimatePresence>
                {showMemory && currentMemory && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMemory(false)} />
                        <motion.div
                            className="relative z-10 bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 50 }}
                            transition={{ type: 'spring', duration: 0.5 }}
                        >
                            {/* 头部 */}
                            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl px-8 py-6 border-b border-slate-100/50 flex items-center justify-between rounded-t-[2.5rem]">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                                        <Icon name="favorite" size={24} className="text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-800">美好回忆</h2>
                                        <p className="text-slate-400 text-xs font-bold uppercase">Precious Memory</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowMemory(false)}
                                    className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all"
                                >
                                    <Icon name="close" size={20} />
                                </button>
                            </div>

                            {/* 内容 */}
                            <div className="p-8">
                                {/* 照片 */}
                                {currentMemory.images && currentMemory.images.length > 0 && (
                                    <div className="mb-6 rounded-2xl overflow-hidden shadow-lg">
                                        <LazyImage
                                            src={currentMemory.images[0]}
                                            alt={currentMemory.title}
                                            className="w-full h-64 object-cover"
                                        />
                                    </div>
                                )}

                                <h3 className="text-2xl font-black text-slate-800 mb-3">
                                    {currentMemory.title}
                                </h3>

                                <div className="flex items-center gap-4 mb-4">
                                    <div className="flex items-center gap-2 text-slate-400 text-sm font-bold uppercase tracking-widest">
                                        <Icon name="location_on" size={16} className="text-primary/40" />
                                        <span>
                                            {currentMemory.province}
                                            {currentMemory.city ? ` · ${currentMemory.city}` : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 text-sm font-bold uppercase tracking-widest">
                                        <Icon name="event" size={16} className="text-primary/40" />
                                        <span>{formatDate(currentMemory.date)}</span>
                                    </div>
                                </div>

                                {currentMemory.description && (
                                    <p className="text-slate-500 text-sm leading-relaxed mb-6">
                                        {currentMemory.description}
                                    </p>
                                )}

                                {/* 更多照片 */}
                                {currentMemory.images && currentMemory.images.length > 1 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
                                            更多照片 ({currentMemory.images.length - 1})
                                        </h4>
                                        <div className="grid grid-cols-3 gap-3">
                                            {currentMemory.images.slice(1).map((img, idx) => (
                                                <div key={idx} className="aspect-square rounded-xl overflow-hidden">
                                                    <LazyImage
                                                        src={getThumbnailUrl(img, 300)}
                                                        alt={`${currentMemory.title} ${idx + 2}`}
                                                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

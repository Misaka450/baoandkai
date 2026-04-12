import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { MapCheckin } from '../../types'
import Icon from '../icons/Icons'
import LazyImage from '../LazyImage'

interface SlideshowProps {
    checkins: MapCheckin[]
    onClose: () => void
}

export default function Slideshow({ checkins, onClose }: SlideshowProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPlaying, setIsPlaying] = useState(true)
    const [isFullscreen, setIsFullscreen] = useState(false)

    // 提取所有照片
    const allPhotos = checkins.flatMap(checkin => 
        checkin.images.map((img, idx) => ({
            checkin,
            image: img,
            index: idx
        }))
    )

    const totalPhotos = allPhotos.length

    const goToNext = useCallback(() => {
        setCurrentIndex(prev => (prev + 1) % totalPhotos)
    }, [totalPhotos])

    const goToPrev = useCallback(() => {
        setCurrentIndex(prev => (prev - 1 + totalPhotos) % totalPhotos)
    }, [totalPhotos])

    const goToIndex = (index: number) => {
        setCurrentIndex(index)
    }

    // 自动播放
    useEffect(() => {
        if (!isPlaying) return

        const interval = setInterval(goToNext, 5000)
        return () => clearInterval(interval)
    }, [isPlaying, goToNext])

    // 键盘控制
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') goToNext()
            if (e.key === 'ArrowLeft') goToPrev()
            if (e.key === 'Escape') onClose()
            if (e.key === ' ') {
                e.preventDefault()
                setIsPlaying(prev => !prev)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [goToNext, goToPrev, onClose])

    const currentPhoto = allPhotos[currentIndex]
    if (!currentPhoto) return null

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${
            isFullscreen ? 'bg-black' : 'bg-black/95 backdrop-blur-xl'
        }`}>
            {/* 顶部控制栏 */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-6 bg-gradient-to-b from-black/60 to-transparent">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    >
                        <Icon name="close" size={20} />
                    </button>
                    <div className="text-white">
                        <p className="font-bold text-sm">{currentPhoto.checkin.title}</p>
                        <p className="text-xs text-white/60">
                            {currentIndex + 1} / {totalPhotos}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    >
                        <Icon name={isPlaying ? 'pause' : 'play_arrow'} size={20} />
                    </button>
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    >
                        <Icon name={isFullscreen ? 'fullscreen_exit' : 'fullscreen'} size={20} />
                    </button>
                </div>
            </div>

            {/* 照片展示 - 移动端优化 */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    className="max-w-7xl max-h-[60vh] sm:max-h-[80vh] mx-auto px-4"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5 }}
                >
                    <LazyImage
                        src={currentPhoto.image}
                        alt={currentPhoto.checkin.title}
                        className="w-full h-full object-contain"
                    />
                </motion.div>
            </AnimatePresence>

            {/* 底部信息 */}
            <div className="absolute bottom-0 left-0 right-0 z-10 p-6 bg-gradient-to-t from-black/60 to-transparent">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-2 text-white/80 mb-3">
                        <Icon name="location_on" size={16} />
                        <span className="text-sm font-bold">
                            {currentPhoto.checkin.province}
                            {currentPhoto.checkin.city ? ` · ${currentPhoto.checkin.city}` : ''}
                        </span>
                    </div>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest">
                        {new Date(currentPhoto.checkin.date).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                    {currentPhoto.checkin.description && (
                        <p className="text-white/80 text-sm mt-3 max-w-2xl mx-auto">
                            {currentPhoto.checkin.description}
                        </p>
                    )}
                </div>
            </div>

            {/* 导航按钮 - 移动端优化 */}
            <button
                onClick={goToPrev}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
            >
                <Icon name="chevron_left" size={20} />
            </button>
            <button
                onClick={goToNext}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
            >
                <Icon name="chevron_right" size={20} />
            </button>

            {/* 缩略图导航 */}
            <div className="absolute bottom-32 left-0 right-0 z-10">
                <div className="flex justify-center gap-2 overflow-x-auto px-4 pb-2">
                    {allPhotos.slice(0, 20).map((photo, idx) => (
                        <button
                            key={idx}
                            onClick={() => goToIndex(idx)}
                            className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                                idx === currentIndex 
                                    ? 'ring-2 ring-white scale-110' 
                                    : 'opacity-50 hover:opacity-100'
                            }`}
                        >
                            <LazyImage
                                src={getThumbnailUrl(photo.image, 100)}
                                alt={photo.checkin.title}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                    {totalPhotos > 20 && (
                        <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            +{totalPhotos - 20}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

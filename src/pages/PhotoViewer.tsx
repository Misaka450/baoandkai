import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { preloadImage, getThumbnailUrl, loadedImagesCache } from '../utils/imageUtils'
import { apiService } from '../services/apiService'
import type { Photo } from '../types'
import Icon from '../components/icons/Icons'

interface AlbumDetailResponse {
    id: number
    name: string
    description?: string
    cover_url?: string
    photos: Photo[]
}

export default function PhotoViewer() {
    const { albumId } = useParams<{ albumId: string }>()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const initialIndex = parseInt(searchParams.get('index') || '0', 10)
    const [currentIndex, setCurrentIndex] = useState(initialIndex)

    const [scale, setScale] = useState(1)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [isFullLoaded, setIsFullLoaded] = useState(false)
    const [hasDragged, setHasDragged] = useState(false)

    const touchStart = useRef({ x: 0, y: 0 })
    const initialPinchDistance = useRef(0)
    const initialScale = useRef(1)

    // 加载相册数据
    const { data: albumDetail } = useQuery({
        queryKey: ['album-detail', albumId],
        queryFn: async () => {
            if (!albumId) return null
            const { data, error } = await apiService.get<AlbumDetailResponse>(`/albums/${albumId}`)
            if (error) throw new Error(error)
            return data
        },
        enabled: !!albumId,
        staleTime: Infinity,
    })

    const images = albumDetail?.photos?.map(p => p.url) || []
    const currentImage = images[currentIndex]
    const thumbnailUrl = currentImage ? getThumbnailUrl(currentImage, 400) : ''

    const resetTransform = useCallback(() => {
        setScale(1)
        setPosition({ x: 0, y: 0 })
    }, [])

    // 返回相册详情
    const handleBack = () => {
        navigate(`/albums/${albumId}`)
    }

    // 上一张
    const handlePrevious = () => {
        if (images.length > 1) {
            setCurrentIndex(prev => (prev - 1 + images.length) % images.length)
            resetTransform()
        }
    }

    // 下一张
    const handleNext = () => {
        if (images.length > 1) {
            setCurrentIndex(prev => (prev + 1) % images.length)
            resetTransform()
        }
    }

    // 图片加载逻辑
    useEffect(() => {
        if (currentImage) {
            if (loadedImagesCache.has(currentImage)) {
                setIsFullLoaded(true)
            } else {
                setIsFullLoaded(false)
                preloadImage(currentImage).then(() => {
                    setIsFullLoaded(true)
                }).catch(() => {
                    setIsFullLoaded(true)
                })
            }
        }
        resetTransform()
    }, [currentIndex, currentImage, resetTransform])

    // 预加载下一张
    useEffect(() => {
        if (images.length > 1) {
            const nextIndex = (currentIndex + 1) % images.length
            if (images[nextIndex]) {
                preloadImage(images[nextIndex]).catch(() => { })
            }
        }
    }, [currentIndex, images])

    // 键盘导航
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') handleBack()
            else if (event.key === 'ArrowLeft') handlePrevious()
            else if (event.key === 'ArrowRight') handleNext()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [images.length])

    // 触摸手势
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            const touch1 = e.touches[0]
            const touch2 = e.touches[1]
            if (!touch1 || !touch2) return
            const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
            initialPinchDistance.current = distance
            initialScale.current = scale
        } else if (e.touches.length === 1) {
            const touch = e.touches[0]
            if (touch) {
                touchStart.current = { x: touch.clientX, y: touch.clientY }
                if (scale > 1) {
                    setIsDragging(true)
                    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y })
                }
            }
        }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            const touch1 = e.touches[0]
            const touch2 = e.touches[1]
            if (!touch1 || !touch2) return
            const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
            if (initialPinchDistance.current > 0) {
                const scaleChange = distance / initialPinchDistance.current
                const newScale = Math.min(5, Math.max(0.5, initialScale.current * scaleChange))
                setScale(newScale)
                setHasDragged(true)
            }
        } else if (e.touches.length === 1 && scale > 1 && isDragging) {
            const touch = e.touches[0]
            if (touch) {
                const newX = touch.clientX - dragStart.x
                const newY = touch.clientY - dragStart.y
                setPosition({ x: newX, y: newY })
                setHasDragged(true)
            }
        }
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        initialPinchDistance.current = 0
        setIsDragging(false)

        if (scale < 1) {
            resetTransform()
        }

        if (scale <= 1 && !hasDragged) {
            const touch = e.changedTouches[0]
            if (!touch) return
            const deltaX = touch.clientX - touchStart.current.x
            const deltaY = Math.abs(touch.clientY - touchStart.current.y)

            if (Math.abs(deltaX) > 50 && deltaY < 100) {
                if (deltaX > 0) handlePrevious()
                else handleNext()
            }
        }

        setTimeout(() => setHasDragged(false), 100)
    }

    if (!albumDetail || images.length === 0) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white/60 text-center">
                    <Icon name="photo_library" size={64} className="mx-auto mb-4 opacity-40" />
                    <p>加载中...</p>
                </div>
            </div>
        )
    }

    return (
        <div
            className="min-h-screen bg-slate-900 flex flex-col select-none"
        >
            <header className="flex items-center justify-between px-6 py-4 bg-black/40 relative z-20">
                <button
                    onClick={(e) => { e.stopPropagation(); handleBack(); }}
                    className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-2xl text-white hover:bg-white/20 transition-all active:scale-95"
                >
                    <Icon name="west" size={24} />
                </button>

                <div className="bg-white/10 px-4 py-2 rounded-2xl">
                    <span className="text-xs font-black text-white uppercase tracking-widest">
                        {currentIndex + 1} / {images.length}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); setScale(prev => Math.min(5, prev * 1.5)); }}
                        className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl text-white active:scale-95"
                    >
                        <Icon name="zoom_in" size={20} />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); resetTransform(); }}
                        className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl text-white active:scale-95"
                    >
                        <Icon name="restart_alt" size={20} />
                    </button>
                </div>
            </header>

            {/* 图片展示区 */}
            <div
                className="flex-1 flex items-center justify-center overflow-hidden relative touch-none"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseMove={(e) => {
                    if (isDragging) {
                        setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
                        setHasDragged(true)
                    }
                }}
                onMouseUp={() => {
                    setIsDragging(false)
                    setTimeout(() => setHasDragged(false), 100)
                }}
            >
                {/* 左右导航按钮 */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 rounded-2xl text-white z-10 hidden md:flex hover:bg-white/20 active:scale-95"
                        >
                            <Icon name="chevron_left" size={28} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleNext(); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/10 rounded-2xl text-white z-10 hidden md:flex hover:bg-white/20 active:scale-95"
                        >
                            <Icon name="chevron_right" size={28} />
                        </button>
                    </>
                )}

                {/* 图片 */}
                <div className="relative">
                    {/* 缩略图占位 */}
                    <img
                        src={thumbnailUrl}
                        alt="Thumbnail"
                        className={`max-w-[95vw] max-h-[80vh] object-contain absolute inset-0 blur-lg scale-105 transition-opacity duration-300 ${isFullLoaded ? 'opacity-0' : 'opacity-100'}`}
                        style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})` }}
                    />
                    {/* 原图 */}
                    <img
                        src={currentImage}
                        alt="Photo"
                        className={`max-w-[95vw] max-h-[80vh] object-contain transition-opacity duration-300 ${isFullLoaded ? 'opacity-100' : 'opacity-0'}`}
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
                        }}
                        onClick={() => {
                            if (!hasDragged) {
                                if (scale === 1) setScale(2.5)
                                else resetTransform()
                            }
                        }}
                        onMouseDown={(e) => {
                            if (scale > 1) {
                                setIsDragging(true)
                                setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
                            }
                        }}
                        draggable={false}
                    />
                </div>

                {/* 加载指示器 */}
                {!isFullLoaded && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-primary/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-primary uppercase">Loading</span>
                    </div>
                )}
            </div>

            {/* 底部缩略图 */}
            {images.length > 1 && (
                <div className="py-4 px-6 overflow-x-auto no-scrollbar relative z-20">
                    <div className="flex gap-3 justify-center">
                        {images.map((img, idx) => (
                            <div
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); resetTransform(); }}
                                className={`w-16 h-16 rounded-xl overflow-hidden cursor-pointer transition-all border-2 flex-shrink-0 active:scale-95 ${idx === currentIndex
                                    ? 'border-white scale-110'
                                    : 'border-transparent opacity-40 grayscale hover:opacity-70'
                                    }`}
                            >
                                <img
                                    src={getThumbnailUrl(img, 200)}
                                    alt={`thumb-${idx}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

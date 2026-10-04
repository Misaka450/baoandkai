import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { preloadImage, getThumbnailUrl, getFullImageUrl, loadedImagesCache } from '../utils/imageUtils'
import { apiService } from '../services/apiService'
import type { Photo } from '../types'
import Icon from '../components/icons/Icons'
import PolaroidModal from '../components/PolaroidModal'
import { hapticFeedback } from '../utils/haptics'

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
    const [isPolaroidOpen, setIsPolaroidOpen] = useState(false)

    // 下拉拖拽关闭状态
    const [dismissOffsetY, setDismissOffsetY] = useState(0)
    const [isDismissing, setIsDismissing] = useState(false)

    // 手势与双击追踪 refs
    const touchStart = useRef({ x: 0, y: 0, time: 0 })
    const lastTapRef = useRef({ time: 0, x: 0, y: 0 })
    const initialPinchDistance = useRef(0)
    const initialScale = useRef(1)
    const isPullingDown = useRef(false)
    const isHorizontalSwipe = useRef(false)

    // 触觉反馈安全调用
    const triggerHaptic = useCallback(() => {
        hapticFeedback('light')
    }, [])

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
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
    })

    const images = albumDetail?.photos?.map(p => p.url) || []
    const currentImage = images[currentIndex]
    const thumbnailUrl = currentImage ? getThumbnailUrl(currentImage, 400) : ''
    const optimizedFullImageUrl = currentImage ? getFullImageUrl(currentImage) : ''

    const resetTransform = useCallback(() => {
        setScale(1)
        setPosition({ x: 0, y: 0 })
        setDismissOffsetY(0)
    }, [])

    // 返回相册详情
    const handleBack = useCallback(() => {
        triggerHaptic()
        navigate(`/albums/${albumId}`)
    }, [navigate, albumId, triggerHaptic])

    // 上一张
    const handlePrevious = useCallback(() => {
        if (images.length > 1) {
            triggerHaptic()
            setCurrentIndex(prev => (prev - 1 + images.length) % images.length)
            resetTransform()
        }
    }, [images.length, resetTransform, triggerHaptic])

    // 下一张
    const handleNext = useCallback(() => {
        if (images.length > 1) {
            triggerHaptic()
            setCurrentIndex(prev => (prev + 1) % images.length)
            resetTransform()
        }
    }, [images.length, resetTransform, triggerHaptic])

    // 图片加载逻辑 - 使用优化后的大图 URL 进行预加载和缓存
    useEffect(() => {
        if (optimizedFullImageUrl) {
            if (loadedImagesCache.has(optimizedFullImageUrl)) {
                setIsFullLoaded(true)
            } else {
                setIsFullLoaded(false)
                preloadImage(optimizedFullImageUrl).then(() => {
                    setIsFullLoaded(true)
                }).catch(() => {
                    setIsFullLoaded(true)
                })
            }
        }
        resetTransform()
    }, [currentIndex, optimizedFullImageUrl, resetTransform])

    // 预加载下一张 - 使用优化后的大图 URL
    useEffect(() => {
        if (images.length > 1) {
            const nextIndex = (currentIndex + 1) % images.length
            if (images[nextIndex]) {
                preloadImage(getFullImageUrl(images[nextIndex])).catch(() => { })
            }
        }
    }, [currentIndex, images])

    // 键盘导航
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isPolaroidOpen) return
            if (event.key === 'Escape') handleBack()
            else if (event.key === 'ArrowLeft') handlePrevious()
            else if (event.key === 'ArrowRight') handleNext()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleBack, handlePrevious, handleNext, isPolaroidOpen])

    // 触摸手势 - 只用于图片区域
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            const touch1 = e.touches[0]
            const touch2 = e.touches[1]
            if (!touch1 || !touch2) return
            const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
            initialPinchDistance.current = distance
            initialScale.current = scale
            isPullingDown.current = false
            isHorizontalSwipe.current = false
        } else if (e.touches.length === 1) {
            const touch = e.touches[0]
            if (touch) {
                touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() }
                isPullingDown.current = false
                isHorizontalSwipe.current = false

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
        } else if (e.touches.length === 1) {
            const touch = e.touches[0]
            if (!touch) return

            if (scale > 1 && isDragging) {
                const newX = touch.clientX - dragStart.x
                const newY = touch.clientY - dragStart.y
                setPosition({ x: newX, y: newY })
                setHasDragged(true)
            } else if (scale === 1) {
                const deltaX = touch.clientX - touchStart.current.x
                const deltaY = touch.clientY - touchStart.current.y

                // 意图判断
                if (!isPullingDown.current && !isHorizontalSwipe.current) {
                    if (deltaY > 10 && deltaY > Math.abs(deltaX) * 1.2) {
                        isPullingDown.current = true
                    } else if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
                        isHorizontalSwipe.current = true
                    }
                }

                // 下拉拖拽处理
                if (isPullingDown.current && deltaY > 0) {
                    setDismissOffsetY(deltaY)
                    setHasDragged(true)
                    e.preventDefault()
                }
            }
        }
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        initialPinchDistance.current = 0
        setIsDragging(false)

        if (scale < 1) {
            resetTransform()
        }

        if (scale === 1 && isPullingDown.current) {
            const touch = e.changedTouches[0]
            const currentOffsetY = touch ? Math.max(0, touch.clientY - touchStart.current.y) : dismissOffsetY
            const elapsedTime = Date.now() - touchStart.current.time
            const velocityY = currentOffsetY / (elapsedTime || 1)

            // 下拉超过 90px 或明显初速度
            if (currentOffsetY > 90 || (velocityY > 0.5 && currentOffsetY > 30)) {
                hapticFeedback('medium')
                setIsDismissing(true)
                setTimeout(() => {
                    handleBack()
                }, 200)
            } else {
                setDismissOffsetY(0)
            }
            isPullingDown.current = false
            setTimeout(() => setHasDragged(false), 100)
            return
        }

        // 丝滑左右滑动手势切图
        if (scale <= 1 && !isPullingDown.current) {
            const touch = e.changedTouches[0]
            if (touch) {
                const deltaX = touch.clientX - touchStart.current.x
                const deltaY = Math.abs(touch.clientY - touchStart.current.y)

                if (Math.abs(deltaX) > 50 && deltaY < 80) {
                    if (deltaX > 0) handlePrevious()
                    else handleNext()
                }
            }
        }

        isPullingDown.current = false
        isHorizontalSwipe.current = false
        setTimeout(() => setHasDragged(false), 100)
    }

    // 双击快速缩放
    const handleImageClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        const now = Date.now()
        const timeDiff = now - lastTapRef.current.time
        const currentX = e.clientX
        const currentY = e.clientY
        const distDiff = Math.hypot(currentX - lastTapRef.current.x, currentY - lastTapRef.current.y)

        if (timeDiff < 300 && distDiff < 40) {
            lastTapRef.current = { time: 0, x: 0, y: 0 }
            triggerHaptic()
            if (scale === 1) {
                const rect = e.currentTarget.getBoundingClientRect()
                const clickX = e.clientX - rect.left - rect.width / 2
                const clickY = e.clientY - rect.top - rect.height / 2
                setScale(2.5)
                setPosition({ x: -clickX * 1.2, y: -clickY * 1.2 })
            } else {
                resetTransform()
            }
        } else {
            lastTapRef.current = { time: now, x: currentX, y: currentY }
        }
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

    // 计算下拉拖拽动态缩放与背景透明度
    const currentDragScale = scale === 1 ? Math.max(0.85, 1 - Math.min(0.15, dismissOffsetY / 800)) : 1
    const bgOpacity = Math.max(0.35, 0.95 - (dismissOffsetY / 400) * 0.6)

    return (
        <div
            className={`fixed inset-0 flex flex-col touch-none overflow-hidden ${
                isDismissing ? 'opacity-0 scale-95 transition-all duration-200' : 'transition-colors duration-150'
            }`}
            style={{
                backgroundColor: `rgba(15, 23, 42, ${bgOpacity})`,
            }}
        >
            {/* 顶部工具栏 - 使用 pointer-events 确保可点击 */}
            <header
                className={`absolute top-0 left-0 right-0 flex items-center justify-between px-3 md:px-6 py-2.5 md:py-4 bg-gradient-to-b from-black/70 via-black/40 to-transparent transition-opacity duration-200 ${
                    dismissOffsetY > 20 ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
                style={{ zIndex: 100 }}
            >
                <button
                    type="button"
                    onClick={() => {
                        hapticFeedback('light')
                        handleBack()
                    }}
                    className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg md:rounded-2xl text-white transition-all active:scale-90 shadow-sm"
                    aria-label="返回"
                >
                    <Icon name="west" size={18} className="md:w-6 md:h-6" />
                </button>

                <div className="bg-black/40 backdrop-blur-md px-2.5 md:px-4 py-1 md:py-2 rounded-lg md:rounded-2xl border border-white/10">
                    <span className="text-[9px] md:text-xs font-black text-white uppercase tracking-wider md:tracking-widest">
                        {currentIndex + 1} / {images.length}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 md:gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            hapticFeedback('light')
                            setIsPolaroidOpen(true)
                        }}
                        className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-rose-500/80 hover:bg-rose-500 rounded-lg md:rounded-xl text-white active:scale-95 transition-all shadow-md gap-1"
                        title="生成拍立得"
                    >
                        <Icon name="photo_camera" size={16} className="md:w-5 md:h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            hapticFeedback('light')
                            setScale(prev => Math.min(5, prev * 1.5))
                        }}
                        className="hidden md:flex w-10 h-10 items-center justify-center bg-white/20 rounded-xl text-white hover:bg-white/30 active:scale-95"
                    >
                        <Icon name="zoom_in" size={20} />
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            hapticFeedback('light')
                            resetTransform()
                        }}
                        className="hidden md:flex w-10 h-10 items-center justify-center bg-white/20 rounded-xl text-white hover:bg-white/30 active:scale-95"
                    >
                        <Icon name="restart_alt" size={20} />
                    </button>
                </div>
            </header>

            {/* 图片展示区 - 全屏背景 */}
            <div
                className="absolute inset-0 flex items-center justify-center touch-none select-none"
                style={{ zIndex: 1 }}
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
                            type="button"
                            onClick={handlePrevious}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/20 rounded-2xl text-white z-10 hidden md:flex hover:bg-white/30 active:scale-95"
                        >
                            <Icon name="chevron_left" size={28} />
                        </button>
                        <button
                            type="button"
                            onClick={handleNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/20 rounded-2xl text-white z-10 hidden md:flex hover:bg-white/30 active:scale-95"
                        >
                            <Icon name="chevron_right" size={28} />
                        </button>
                    </>
                )}

                {/* 图片 */}
                <div
                    className="relative flex items-center justify-center"
                    style={{
                        transform: `translate(${position.x}px, ${position.y + dismissOffsetY}px) scale(${scale * currentDragScale})`,
                        transition: (isDragging || dismissOffsetY > 0) ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        willChange: 'transform',
                    }}
                >
                    {/* 缩略图占位 (柔和微模糊占位 filter blur-md) */}
                    <img
                        src={thumbnailUrl}
                        alt="Thumbnail"
                        className={`max-w-[95vw] max-h-[80vh] object-contain absolute inset-0 filter blur-md scale-105 pointer-events-none transition-opacity duration-500 ${isFullLoaded ? 'opacity-0' : 'opacity-100'}`}
                    />
                    {/* 优化后的大图（WebP/AVIF） */}
                    <img
                        src={optimizedFullImageUrl}
                        alt="Photo"
                        className={`max-w-[95vw] max-h-[80vh] object-contain transition-opacity duration-500 ease-out ${isFullLoaded ? 'opacity-100' : 'opacity-0'}`}
                        style={{
                            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
                        }}
                        onClick={handleImageClick}
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
                    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-primary/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-primary uppercase">Loading</span>
                    </div>
                )}
            </div>

            {/* 底部缩略图 */}
            {images.length > 1 && (
                <div
                    className={`absolute bottom-0 left-0 right-0 py-3 md:py-4 px-3 md:px-6 overflow-x-auto no-scrollbar bg-gradient-to-t from-black/70 via-black/40 to-transparent transition-opacity duration-200 ${
                        dismissOffsetY > 20 ? 'opacity-0 pointer-events-none' : 'opacity-100'
                    }`}
                    style={{ zIndex: 100 }}
                >
                    <div className="flex gap-2 md:gap-3 justify-center">
                        {images.map((img, idx) => (
                            <div
                                key={idx}
                                onClick={() => {
                                    hapticFeedback('light')
                                    setCurrentIndex(idx)
                                    resetTransform()
                                }}
                                className={`w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden cursor-pointer transition-all border-2 flex-shrink-0 active:scale-95 ${idx === currentIndex
                                    ? 'border-white scale-105 md:scale-110 shadow-lg'
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

            {currentImage && (
                <PolaroidModal
                    isOpen={isPolaroidOpen}
                    onClose={() => setIsPolaroidOpen(false)}
                    imageUrl={currentImage}
                    defaultCaption={albumDetail?.photos?.[currentIndex]?.caption || albumDetail?.name}
                />
            )}
        </div>
    )
}

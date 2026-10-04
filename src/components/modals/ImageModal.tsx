import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { preloadImage, getThumbnailUrl, loadedImagesCache, getOriginalImageUrl, downloadOriginalImage } from '../../utils/imageUtils'
import Icon from '../icons/Icons'
import PolaroidModal from '../PolaroidModal'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { hapticFeedback } from '../../utils/haptics'

// 定义图片模态框组件的属性接口
interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl?: string
  images?: string[]
  currentIndex?: number
  onPrevious?: () => void
  onNext?: () => void
  onJumpTo?: (index: number) => void
}

/**
 * Premium 图片查看器
 * 升级优化：
 * 1. 渐进式加载：先显示缩略图，再平滑切换到原图
 * 2. 增强的加载状态提示
 * 3. 移动端手势优化
 */
export default function ImageModal({
  isOpen,
  onClose,
  imageUrl,
  images = [],
  currentIndex = 0,
  onPrevious,
  onNext,
  onJumpTo
}: ImageModalProps) {
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
  const containerRef = useRef<HTMLDivElement>(null)
  const thumbListRef = useRef<HTMLDivElement>(null)

  useBodyScrollLock(isOpen)

  // 触觉反馈安全调用
  const triggerHaptic = useCallback(() => {
    hapticFeedback('light')
  }, [])

  const currentImage = (images && images.length > 0) ? images[currentIndex] : imageUrl
  const thumbnailUrl = currentImage ? getThumbnailUrl(currentImage, 400) : ''

  const resetTransform = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setDismissOffsetY(0)
  }, [])

  // 切换上一张
  const handlePrevImage = useCallback(() => {
    if (onPrevious) {
      triggerHaptic()
      onPrevious()
    }
  }, [onPrevious, triggerHaptic])

  // 切换下一张
  const handleNextImage = useCallback(() => {
    if (onNext) {
      triggerHaptic()
      onNext()
    }
  }, [onNext, triggerHaptic])

  // 重置状态
  useEffect(() => {
    setDismissOffsetY(0)
    setIsDismissing(false)
  }, [isOpen])

  useEffect(() => {
    if (currentImage) {
      if (loadedImagesCache.has(currentImage)) {
        setIsFullLoaded(true)
      } else {
        setIsFullLoaded(false)
        // 预加载原图 - 使用 requestIdleCallback 避免阻塞初始渲染
        const preload = () => {
          if (!currentImage) return
          preloadImage(currentImage).then(() => {
            setIsFullLoaded(true)
          }).catch(() => {
            setIsFullLoaded(true)
          })
        }
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(preload)
        } else {
          setTimeout(preload, 100)
        }
      }
    }
    resetTransform()
  }, [currentIndex, currentImage, resetTransform])

  useEffect(() => {
    if (!images || images.length <= 1) return
    const nextIndex = (currentIndex + 1) % images.length
    if (images[nextIndex]) {
      // 预加载下一张图片
      const preloadNext = () => {
        preloadImage(images[nextIndex]!).catch(() => { })
      }
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(preloadNext)
      } else {
        setTimeout(preloadNext, 200)
      }
    }
  }, [currentIndex, images])

  useEffect(() => {
    if (thumbListRef.current && currentIndex !== undefined) {
      const activeThumb = thumbListRef.current.children[currentIndex] as HTMLElement
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [currentIndex])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isPolaroidOpen) return
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowLeft' && images.length > 1 && onPrevious) onPrevious()
      else if (event.key === 'ArrowRight' && images.length > 1 && onNext) onNext()
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, images.length, onPrevious, onNext, isPolaroidOpen])

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
      e.preventDefault()
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
      e.preventDefault()
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

        // 判断手势意图
        if (!isPullingDown.current && !isHorizontalSwipe.current) {
          if (deltaY > 10 && deltaY > Math.abs(deltaX) * 1.2) {
            isPullingDown.current = true
          } else if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
            isHorizontalSwipe.current = true
          }
        }

        // 下拉拖拽手势
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

      // 超过 90px 或有明显下拉速度 (> 0.5px/ms 且 > 30px)
      if (currentOffsetY > 90 || (velocityY > 0.5 && currentOffsetY > 30)) {
        hapticFeedback('medium')
        setIsDismissing(true)
        setTimeout(() => {
          onClose()
        }, 200)
      } else {
        // 平滑弹簧回弹复位
        setDismissOffsetY(0)
      }
      isPullingDown.current = false
      setTimeout(() => setHasDragged(false), 100)
      return
    }

    // 左右滑动手势切图 (在 scale === 1 且未发生下拉拖拽时)
    if (scale <= 1 && !isPullingDown.current) {
      const touch = e.changedTouches[0]
      if (touch) {
        const deltaX = touch.clientX - touchStart.current.x
        const deltaY = Math.abs(touch.clientY - touchStart.current.y)

        if (Math.abs(deltaX) > 50 && deltaY < 80) {
          if (deltaX > 0) handlePrevImage()
          else handleNextImage()
        }
      }
    }

    isPullingDown.current = false
    isHorizontalSwipe.current = false
    setTimeout(() => setHasDragged(false), 100)
  }

  // 双击缩放处理 (Double-tap to zoom)
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const now = Date.now()
    const timeDiff = now - lastTapRef.current.time
    const currentX = e.clientX
    const currentY = e.clientY
    const distDiff = Math.hypot(currentX - lastTapRef.current.x, currentY - lastTapRef.current.y)

    if (timeDiff < 300 && distDiff < 40) {
      // 触发双击
      lastTapRef.current = { time: 0, x: 0, y: 0 }
      triggerHaptic()
      if (scale === 1) {
        // 以点击触点为参考进行缩放和偏移
        const rect = e.currentTarget.getBoundingClientRect()
        const clickX = e.clientX - rect.left - rect.width / 2
        const clickY = e.clientY - rect.top - rect.height / 2
        setScale(2.5)
        setPosition({ x: -clickX * 1.2, y: -clickY * 1.2 })
      } else {
        resetTransform()
      }
    } else {
      // 记录第一次点击
      lastTapRef.current = { time: now, x: currentX, y: currentY }
    }
  }

  if (!isOpen) return null

  // 计算下拉拖拽动态缩放与背景透明度
  // scale 随下拉在 1 到 0.85 之间: 1 - Math.min(0.15, dismissOffsetY / 800)
  const currentDragScale = scale === 1 ? Math.max(0.85, 1 - Math.min(0.15, dismissOffsetY / 800)) : 1
  // 背景透明度从 0.95 降至 0.35 左右
  const bgOpacity = Math.max(0.35, 0.95 - (dismissOffsetY / 400) * 0.6)

  return createPortal(
    <div
      id="premium-image-modal"
      ref={containerRef}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center touch-none overflow-hidden ${
        isDismissing ? 'opacity-0 scale-95 transition-all duration-200' : 'transition-colors duration-150'
      }`}
      style={{
        backgroundColor: `rgba(15, 23, 42, ${bgOpacity})`,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        margin: 0,
        padding: 0,
      }}
      onClick={() => {
        if (!hasDragged && dismissOffsetY === 0) onClose()
        setHasDragged(false)
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >

      {/* 顶部工具栏 */}
      <div
        className={`absolute top-0 left-0 right-0 h-16 md:h-24 pt-[env(safe-area-inset-top)] flex items-center justify-between px-3 md:px-8 z-[100] bg-gradient-to-b from-black/70 via-black/40 to-transparent backdrop-blur-[2px] md:backdrop-blur-sm pointer-events-auto transition-opacity duration-200 ${
          dismissOffsetY > 20 ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="flex items-center gap-1.5 md:gap-3 pointer-events-auto">
          <div className="bg-black/40 backdrop-blur-md px-2.5 md:px-4 py-1 md:py-2 rounded-lg md:rounded-2xl border border-white/10">
            <span className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-wider md:tracking-[0.2em]">
              {images.length > 0 ? `${currentIndex + 1} / ${images.length}` : 'VIEWER'}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              hapticFeedback('light');
              if (currentImage) {
                downloadOriginalImage(currentImage);
              }
            }}
            className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center bg-blue-500/80 hover:bg-blue-500 text-white rounded-lg md:rounded-2xl transition-all border border-blue-400/50 active:scale-95 shadow-md shadow-blue-500/30 gap-1.5 md:gap-2"
            title="下载原图"
          >
            <Icon name="download" size={16} className="md:w-[18px] md:h-[18px]" />
            <span className="text-[10px] font-bold hidden md:inline">下载</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              hapticFeedback('light');
              setIsPolaroidOpen(true);
            }}
            className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center bg-rose-500/80 hover:bg-rose-500 text-white rounded-lg md:rounded-2xl transition-all border border-rose-400/50 active:scale-95 shadow-md shadow-rose-500/30 gap-1.5 md:gap-2"
            title="拍立得相片"
          >
            <Icon name="photo_camera" size={16} className="md:w-[18px] md:h-[18px]" />
            <span className="text-[10px] font-bold hidden md:inline">拍立得</span>
          </button>
          {!isFullLoaded && (
            <div className="hidden md:flex items-center gap-2 bg-primary/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-primary/20">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Loading</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 md:gap-2 pointer-events-auto">
          {/* 桌面端特有的缩放控制按钮，移动端依赖原生触屏双击与捏合手势 */}
          <button
            onClick={(e) => { e.stopPropagation(); hapticFeedback('light'); setScale(prev => Math.min(5, prev * 1.5)); }}
            className="hidden md:flex w-12 h-12 items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-2xl transition-all border border-white/10"
            title="放大"
          >
            <Icon name="zoom_in" size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); hapticFeedback('light'); setScale(prev => Math.max(0.5, prev / 1.5)); }}
            className="hidden md:flex w-12 h-12 items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-2xl transition-all border border-white/10"
            title="缩小"
          >
            <Icon name="zoom_out" size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); hapticFeedback('light'); resetTransform(); }}
            className="hidden md:flex w-12 h-12 items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-2xl transition-all border border-white/10"
            title="还原"
          >
            <Icon name="restart_alt" size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); hapticFeedback('light'); onClose(); }}
            className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-md text-white md:bg-white md:text-slate-900 rounded-full md:rounded-2xl transition-all shadow-md active:scale-90"
            title="退出"
          >
            <Icon name="close" size={18} className="md:w-5 md:h-5" />
          </button>
        </div>
      </div>

      {/* 主展示区 */}
      <div
        className="relative w-full flex-1 flex items-center justify-center overflow-visible"
        onClick={(e) => {
          if (e.target === e.currentTarget && !hasDragged && dismissOffsetY === 0) onClose()
        }}
        onMouseMove={(e) => {
          if (isDragging) {
            const newX = e.clientX - dragStart.x
            const newY = e.clientY - dragStart.y
            if (Math.abs(newX - position.x) > 3 || Math.abs(newY - position.y) > 3) setHasDragged(true)
            setPosition({ x: newX, y: newY })
          }
        }}
        onMouseUp={() => {
          setIsDragging(false)
          setTimeout(() => setHasDragged(false), 100)
        }}
        onMouseLeave={() => setIsDragging(false)}
      >
        {/* 导航按钮 */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
              className="absolute left-8 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center bg-white/5 hover:bg-white/15 text-white rounded-[1.5rem] border border-white/10 transition-all z-20 hidden md:flex"
            >
              <Icon name="chevron_left" size={32} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
              className="absolute right-8 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center bg-white/5 hover:bg-white/15 text-white rounded-[1.5rem] border border-white/10 transition-all z-20 hidden md:flex"
            >
              <Icon name="chevron_right" size={32} />
            </button>
          </>
        )}

        {/* 图片主体 */}
        <div
          className="relative flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
          style={{
            transform: `translate(${position.x}px, ${position.y + dismissOffsetY}px) scale(${scale * currentDragScale})`,
            transition: (isDragging || dismissOffsetY > 0) ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'transform',
          }}
        >
          {/* 渐进式加载支持 */}
          <div className="relative overflow-hidden group">
            {/* 缩略图占位层 (柔和微模糊占位 filter blur-md，大图就绪时淡出) */}
            <img
              src={thumbnailUrl}
              alt="Thumbnail"
              className={`max-w-[100vw] max-h-[100vh] object-contain transition-opacity duration-500 absolute inset-0 filter blur-md scale-105 pointer-events-none ${
                isFullLoaded ? 'opacity-0' : 'opacity-100'
              }`}
            />

            {/* 原图层 (加载完成后通过 opacity 400ms 平滑淡入 Cross-fade) */}
            <img
              src={currentImage}
              alt="Viewer"
              className={`max-w-[100vw] max-h-[100vh] object-contain select-none shadow-[0_40px_100px_rgba(0,0,0,0.5)] transition-opacity duration-500 ease-out ${
                isFullLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
              }}
              onLoad={() => {
                setIsFullLoaded(true)
                if (currentImage) loadedImagesCache.add(currentImage)
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
        </div>
      </div>

      {/* 底部缩略图 */}
      {images.length > 1 && (
        <div
          className={`absolute bottom-0 left-0 right-0 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-12 pt-2 md:pt-4 px-3 md:px-8 z-50 overflow-hidden overflow-x-auto no-scrollbar transition-opacity duration-200 ${
            dismissOffsetY > 20 ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div
            ref={thumbListRef}
            className="flex gap-2 md:gap-4 min-w-max justify-center items-center"
          >
            {images.map((img, idx) => (
              <div
                key={idx}
                onClick={(e) => { e.stopPropagation(); hapticFeedback('light'); onJumpTo?.(idx); }}
                className={`relative h-12 w-12 md:h-20 md:w-20 rounded-xl md:rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 border-2 md:border-4 active:scale-95 ${idx === currentIndex
                  ? 'border-white scale-105 md:scale-110 shadow-lg md:shadow-2xl z-10'
                  : 'border-transparent opacity-40 hover:opacity-75 grayscale hover:grayscale-0'
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
        />
      )}
    </div>,
    document.body
  )
}
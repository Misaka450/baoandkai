import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { preloadImage, getThumbnailUrl, loadedImagesCache } from '../utils/imageUtils'
import Icon from './icons/Icons'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

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

  const touchStart = useRef({ x: 0, y: 0 })
  const initialPinchDistance = useRef(0)
  const initialScale = useRef(1)
  const containerRef = useRef<HTMLDivElement>(null)
  const thumbListRef = useRef<HTMLDivElement>(null)

  useBodyScrollLock(isOpen)

  const currentImage = (images && images.length > 0) ? images[currentIndex] : imageUrl
  const thumbnailUrl = currentImage ? getThumbnailUrl(currentImage, 400) : ''

  const resetTransform = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

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
  }, [isOpen, onClose, images.length, onPrevious, onNext])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      if (!touch1 || !touch2) return
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY)
      initialPinchDistance.current = distance
      initialScale.current = scale
      e.preventDefault()
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
      e.preventDefault()
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
        if (deltaX > 0 && onPrevious) onPrevious()
        else if (deltaX < 0 && onNext) onNext()
      }
    }

    setTimeout(() => setHasDragged(false), 100)
  }

  if (!isOpen) return null

  return createPortal(
    <div
      id="premium-image-modal"
      ref={containerRef}
      className="fixed z-[9999] flex flex-col items-center justify-center bg-slate-900 touch-none"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
      }}
      onClick={() => {
        if (!hasDragged) onClose()
        setHasDragged(false)
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >

      {/* 顶部工具栏 */}
      <div className="absolute top-0 left-0 right-0 h-24 flex items-center justify-between px-8 z-50 bg-gradient-to-b from-black/40 to-transparent">
        <div className="flex items-center gap-4">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
              {images.length > 0 ? `${currentIndex + 1} / ${images.length}` : 'VIEWER'}
            </span>
          </div>
          {!isFullLoaded && (
            <div className="flex items-center gap-2 bg-primary/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-primary/20">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Loading High-Res</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setScale(prev => Math.min(5, prev * 1.5)); }}
            className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/5"
            title="放大"
          >
            <Icon name="zoom_in" size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setScale(prev => Math.max(0.5, prev / 1.5)); }}
            className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/5"
            title="缩小"
          >
            <Icon name="zoom_out" size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); resetTransform(); }}
            className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/5"
            title="还原"
          >
            <Icon name="restart_alt" size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-12 h-12 flex items-center justify-center bg-white text-slate-900 rounded-2xl transition-all shadow-2xl ml-2 hover:scale-105 active:scale-95"
            title="退出"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
      </div>

      {/* 主展示区 */}
      <div
        className="relative w-full flex-1 flex items-center justify-center overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget && !hasDragged) onClose()
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
              onClick={(e) => { e.stopPropagation(); onPrevious?.(); }}
              className="absolute left-8 top-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center bg-white/5 hover:bg-white/15 text-white rounded-[1.5rem] border border-white/10 transition-all z-20 hidden md:flex"
            >
              <Icon name="chevron_left" size={32} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onNext?.(); }}
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
          style={{ transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          {/* 渐进式加载支持 */}
          <div className="relative overflow-hidden group">
            {/* 缩略图占位层 (模糊) */}
            <img
              src={thumbnailUrl}
              alt="Thumbnail"
              className={`max-w-[100vw] max-h-[100vh] object-contain transition-opacity duration-500 absolute inset-0 blur-lg scale-105 ${isFullLoaded ? 'opacity-0' : 'opacity-100'}`}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              }}
            />

            {/* 原图层 */}
            <img
              src={currentImage}
              alt="Viewer"
              className={`max-w-[100vw] max-h-[100vh] object-contain select-none shadow-[0_40px_100px_rgba(0,0,0,0.5)] transition-all duration-700 ${isFullLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
              }}
              onLoad={() => {
                setIsFullLoaded(true)
                if (currentImage) loadedImagesCache.add(currentImage)
              }}
              onClick={(e) => {
                e.stopPropagation()
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
        </div>
      </div>

      {/* 底部缩略图 */}
      {images.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 pb-12 pt-4 px-8 z-50 overflow-hidden overflow-x-auto no-scrollbar">
          <div
            ref={thumbListRef}
            className="flex gap-4 min-w-max justify-center items-center"
          >
            {images.map((img, idx) => (
              <div
                key={idx}
                onClick={(e) => { e.stopPropagation(); onJumpTo?.(idx); }}
                className={`relative h-20 w-20 rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 border-4 ${idx === currentIndex
                  ? 'border-white scale-110 shadow-2xl z-10'
                  : 'border-transparent opacity-30 hover:opacity-60 grayscale hover:grayscale-0'
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
    </div>,
    document.body
  )
}
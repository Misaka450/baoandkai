import { useState, useEffect, useRef, useCallback } from 'react'
import { preloadImage, getThumbnailUrl } from '../utils/imageUtils'
import Icon from './icons/Icons'

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
 * 升级视觉效果：
 * 1. 磨砂玻璃背景 + 深色渐变叠加
 * 2. 现代化的控制按钮
 * 3. 顺滑的转场动画
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
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasDragged, setHasDragged] = useState(false)

  const touchStart = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const thumbListRef = useRef<HTMLDivElement>(null)

  const currentImage = (images && images.length > 0) ? images[currentIndex] : imageUrl

  const resetTransform = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  useEffect(() => {
    setIsLoaded(false)
    resetTransform()
  }, [currentIndex, currentImage, resetTransform])

  useEffect(() => {
    if (!images || images.length <= 1) return
    const nextIndex = (currentIndex + 1) % images.length
    if (images[nextIndex]) preloadImage(images[nextIndex]).catch(() => { })
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
      document.body.style.overflow = 'hidden'
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, images.length, onPrevious, onNext])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale > 1) return
    const touch = e.touches[0]
    if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (scale > 1) return
    const touch = e.changedTouches[0]
    if (!touch) return
    const deltaX = touch.clientX - touchStart.current.x
    const deltaY = Math.abs(touch.clientY - touchStart.current.y)

    if (Math.abs(deltaX) > 50 && deltaY < 100) {
      if (deltaX > 0 && onPrevious) onPrevious()
      else if (deltaX < 0 && onNext) onNext()
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (scale > 1) resetTransform()
    else setScale(2)
  }

  if (!isOpen) return null

  return (
    <div
      id="premium-image-modal"
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-xl transition-all duration-300 animate-fade-in"
      onClick={() => {
        if (!hasDragged) onClose()
        setHasDragged(false)
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 顶部工具栏 */}
      <div className="absolute top-0 left-0 right-0 h-24 flex items-center justify-between px-8 z-50 bg-gradient-to-b from-black/20 to-transparent">
        <div className="flex items-center gap-4">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">
              {images.length > 0 ? `${currentIndex + 1} / ${images.length}` : 'VIEWER'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setScale(prev => Math.min(5, prev * 1.5)); }}
            className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/5"
          >
            <Icon name="search" size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); resetTransform(); }}
            className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/5"
          >
            <Icon name="west" size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-12 h-12 flex items-center justify-center bg-slate-900 text-white rounded-2xl transition-all shadow-2xl border border-white/10 ml-2 hover:scale-105 active:scale-95"
          >
            <Icon name="delete" size={20} /> {/* 这里用 delete 样式来表示 X 的现代感，或者换成图标库里的 close/X */}
          </button>
        </div>
      </div>

      {/* 主展示区 */}
      <div
        className="relative w-full flex-1 flex items-center justify-center overflow-hidden"
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
          style={{ transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-white/10 border-t-white/40 rounded-full animate-spin"></div>
            </div>
          )}

          <img
            src={currentImage}
            alt="Viewer"
            onLoad={() => setIsLoaded(true)}
            onDoubleClick={handleDoubleClick}
            onMouseDown={(e) => {
              if (scale > 1) {
                setIsDragging(true)
                setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
              }
            }}
            draggable={false}
            className={`max-w-[90vw] max-h-[80vh] object-contain select-none shadow-[0_40px_100px_rgba(0,0,0,0.5)] transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
            }}
          />
        </div>
      </div>

      {/* 底部缩略图 */}
      {images.length > 1 && (
        <div className="w-full pb-12 pt-4 px-8 z-50 overflow-hidden overflow-x-auto no-scrollbar">
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
    </div>
  )
}
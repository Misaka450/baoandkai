import { useState, useEffect, useRef, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Loader2, Download, Maximize2 } from 'lucide-react'
import { preloadImage, getThumbnailUrl } from '../utils/imageUtils'

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
 * 图片放大查看器组件
 * 支持：
 * 1. 基础：单图/多图预览、缩放、拖拽
 * 2. 交互：滑动手势切换、双击缩放、键盘控制
 * 3. 功能：缩略图列表预览、图片预加载、下载功能
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
  const [hasDragged, setHasDragged] = useState(false)  // 跟踪是否发生了拖拽

  // 触摸手势相关
  const touchStart = useRef({ x: 0, y: 0 })
  const lastTouchTime = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const thumbListRef = useRef<HTMLDivElement>(null)

  // 确定当前显示的图片
  const currentImage = (images && images.length > 0) ? images[currentIndex] : imageUrl

  // 重置状态
  const resetTransform = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  // 切换图片时的逻辑
  useEffect(() => {
    setIsLoaded(false)
    resetTransform()
  }, [currentIndex, currentImage, resetTransform])

  // 预加载逻辑 - 只预加载下一张
  useEffect(() => {
    if (!images || images.length <= 1) return

    const nextIndex = (currentIndex + 1) % images.length
    if (images[nextIndex]) preloadImage(images[nextIndex]).catch(() => { })
  }, [currentIndex, images])

  // 滚动当前选中的缩略图到中心
  useEffect(() => {
    if (thumbListRef.current && currentIndex !== undefined) {
      const activeThumb = thumbListRef.current.children[currentIndex] as HTMLElement
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  }, [currentIndex])

  // 键盘与手势处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowLeft' && images.length > 1 && onPrevious) onPrevious()
      else if (event.key === 'ArrowRight' && images.length > 1 && onNext) onNext()
    }

    const handleWheel = (event: WheelEvent) => {
      if (!isOpen) return
      event.preventDefault()
      const factor = event.ctrlKey ? 1.1 : 1.05
      const zoomFactor = event.deltaY > 0 ? (1 / factor) : factor
      setScale(prev => Math.max(0.3, Math.min(5, prev * zoomFactor)))
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('wheel', handleWheel, { passive: false })
      document.body.style.overflow = 'hidden'
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('wheel', handleWheel)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, images.length, onPrevious, onNext])

  // 处理手势切换
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale > 1) return // 缩放时禁用滑动切换
    const touch = e.touches[0]
    if (touch) {
      touchStart.current = { x: touch.clientX, y: touch.clientY }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (scale > 1) return
    const touch = e.changedTouches[0]
    if (!touch) return
    const touchEnd = { x: touch.clientX, y: touch.clientY }
    const deltaX = touchEnd.x - touchStart.current.x
    const deltaY = Math.abs(touchEnd.y - touchStart.current.y)

    // 水平滑动距离超过50px且垂直滑动较小时触发切换
    if (Math.abs(deltaX) > 50 && deltaY < 100) {
      if (deltaX > 0 && onPrevious) onPrevious()
      else if (deltaX < 0 && onNext) onNext()
    }
  }

  // 双击缩放处理
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (scale > 1) {
      resetTransform()
    } else {
      setScale(2.5)
      // 可选：让缩放中心指向点击位置
    }
  }

  // 下载当前图
  const handleDownload = () => {
    if (!currentImage) return
    const link = document.createElement('a')
    link.href = currentImage
    link.download = `photo_${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!isOpen) return null

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md transition-all duration-300"
      onClick={() => {
        // 只有在没有拖拽的情况下才关闭模态框
        if (!hasDragged) {
          onClose()
        }
        setHasDragged(false)
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 顶部工具栏 */}
      <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-4 z-50 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-1 text-white/80 text-sm font-light">
          {images.length > 0 && (
            <span className="bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
              {currentIndex + 1} / {images.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
            className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all flex items-center justify-center"
            title="下载原图"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
            className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all hidden sm:flex items-center justify-center"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); resetTransform(); }}
            className="p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all flex items-center justify-center"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="ml-1 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all shadow-xl flex items-center justify-center"
          >
            <X className="w-7 h-7" />
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
            // 只有移动超过一定距离才算拖拽（区分点击和拖拽）
            if (Math.abs(newX - position.x) > 3 || Math.abs(newY - position.y) > 3) {
              setHasDragged(true)
            }
            setPosition({ x: newX, y: newY })
          }
        }}
        onMouseUp={() => {
          setIsDragging(false)
          // 延迟重置 hasDragged，让 onClick 有机会检查
          setTimeout(() => setHasDragged(false), 100)
        }}
      >
        {/* 导航按钮 - PC 端 */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onPrevious?.(); }}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/5 hover:bg-white/10 text-white rounded-full border border-white/10 transition-all z-20 hidden md:flex hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onNext?.(); }}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/5 hover:bg-white/10 text-white rounded-full border border-white/10 transition-all z-20 hidden md:flex hover:scale-110 active:scale-95"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </>
        )}

        {/* 图片主体 */}
        <div
          className="relative flex items-center justify-center"
          style={{ transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0, 0.2, 1)' }}
        >
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-white/30 animate-spin" />
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
            className={`max-w-[95vw] max-h-[85vh] object-contain select-none shadow-2xl transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
          />
        </div>
      </div>

      {/* 底部缩略图画廊 */}
      {images.length > 1 && (
        <div className="w-full h-24 bg-black/40 backdrop-blur-md border-t border-white/5 flex items-center justify-center px-4 overflow-hidden overflow-x-auto no-scrollbar py-2">
          <div
            ref={thumbListRef}
            className="flex gap-2 min-w-max px-2"
          >
            {images.map((img, idx) => (
              <div
                key={idx}
                onClick={(e) => {
                  e.stopPropagation()
                  if (onJumpTo) {
                    onJumpTo(idx)
                  } else if (onNext && onPrevious) {
                    // Fallback for when onJumpTo is not provided
                    const diff = idx - currentIndex
                    if (diff > 0) for (let i = 0; i < diff; i++) onNext()
                    else if (diff < 0) for (let i = 0; i < Math.abs(diff); i++) onPrevious()
                  }
                }}
                className={`relative h-16 w-16 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 border-2 ${idx === currentIndex
                  ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)] z-10'
                  : 'border-transparent opacity-40 hover:opacity-100'
                  }`}
              >
                <img
                  src={getThumbnailUrl(img, 150)}
                  alt={`thumb-${idx}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 操作提示 - 自动消失 */}
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 text-white/40 text-[10px] sm:text-xs pointer-events-none hidden sm:block">
        滚轮、双击缩放 · 拖拽移动 · 左右方向键或划动切换
      </div>
    </div>
  )

  function handleZoomIn() { setScale(prev => Math.min(5, prev * 1.5)) }
}
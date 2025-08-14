import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

// 图片放大模态框组件 - 支持单图和多图切换
export default function ImageModal({ isOpen, onClose, imageUrl, images = [], currentIndex = 0, onPrevious, onNext }) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // 键盘事件和滚轮缩放
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowLeft' && images.length > 1 && onPrevious) {
        onPrevious()
      } else if (event.key === 'ArrowRight' && images.length > 1 && onNext) {
        onNext()
      }
    }

    const handleWheel = (event) => {
      event.preventDefault()
      const delta = event.deltaY > 0 ? -0.1 : 0.1
      setScale(prevScale => Math.max(0.5, Math.min(3, prevScale + delta)))
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

  // 重置缩放状态当图片切换时
  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [currentIndex])

  if (!isOpen) return null

  // 确定当前显示的图片
  const currentImage = images.length > 0 ? images[currentIndex] : imageUrl

  // 缩放控制函数
  const handleZoomIn = () => setScale(prev => Math.min(3, prev + 0.2))
  const handleZoomOut = () => setScale(prev => Math.max(0.5, prev - 0.2))
  const handleReset = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  // 拖拽功能
  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className="relative max-w-4xl max-h-screen p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-colors z-20"
          aria-label="关闭"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 缩放控制按钮 */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          <button
            onClick={handleZoomOut}
            className="bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-colors"
            title="缩小"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="bg-white/90 hover:bg-white text-gray-800 rounded-full px-3 py-2 shadow-lg transition-colors text-sm font-medium"
            title="重置"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomIn}
            className="bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-colors"
            title="放大"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="bg-white/90 text-gray-800 rounded-full px-3 py-2 shadow-lg text-sm font-medium">
            {Math.round(scale * 100)}%
          </span>
        </div>
        
        {/* 图片容器 */}
        <div className="relative flex items-center justify-center min-h-[200px]">
          {/* 上一张按钮 */}
          {images.length > 1 && (
            <button
              onClick={onPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-colors z-10"
              aria-label="上一张"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          
          <div 
            className="overflow-hidden cursor-move"
            onMouseDown={handleMouseDown}
            style={{ cursor: scale > 1 ? 'move' : 'default' }}
          >
            <img
              src={currentImage}
              alt="图片"
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl transition-transform duration-200"
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out'
              }}
            />
          </div>
          
          {/* 下一张按钮 */}
          {images.length > 1 && (
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-colors z-10"
              aria-label="下一张"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* 图片指示器 */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* 使用提示 */}
        <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
          滚轮缩放 | 拖拽移动
        </div>
      </div>
    </div>
  )
}
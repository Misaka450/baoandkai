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
      // 使用超平滑的乘法缩放，根据滚轮速度调整缩放幅度
      const isCtrlPressed = event.ctrlKey || event.metaKey
      const baseFactor = 1.01 // 基础缩放因子
      const speedFactor = Math.min(Math.abs(event.deltaY) / 100, 2) // 根据滚轮速度调整
      const factor = isCtrlPressed ? 1 + (speedFactor * 0.03) : 1 + (speedFactor * 0.01)
      const zoomFactor = event.deltaY > 0 ? (1 / factor) : factor
      setScale(prevScale => Math.max(0.3, Math.min(4, prevScale * zoomFactor)))
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

  // 缩放控制函数 - 使用平滑的乘法缩放
  const handleZoomIn = () => setScale(prev => Math.min(4, prev * 1.1)) // 放大10%
  const handleZoomOut = () => setScale(prev => Math.max(0.3, prev / 1.1)) // 缩小10%
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
        className="relative w-full h-full"
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
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-50 bg-black bg-opacity-30 backdrop-blur-sm rounded-full px-2 py-1">
          <button
            onClick={handleZoomOut}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
            title="缩小"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={handleReset}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
            title="重置"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomIn}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
            title="放大"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <span className="text-white px-3 py-2 text-sm font-medium min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
        </div>
        
        {/* 图片容器 - 全屏显示 */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? 'grabbing' : (scale > 1 ? 'grab' : 'default') }}
        >
          {/* 上一张按钮 */}
          {images.length > 1 && (
            <button
              onClick={onPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-opacity-70 rounded-full p-3 transition-all hover:scale-110 z-10"
              aria-label="上一张"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          
          <img
            src={currentImage}
            alt="图片"
            className="max-w-full max-h-full select-none"
            style={{
              transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              maxWidth: '90vw',
              maxHeight: '90vh',
              width: 'auto',
              height: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
          
          {/* 下一张按钮 */}
          {images.length > 1 && (
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white hover:bg-opacity-70 rounded-full p-3 transition-all hover:scale-110 z-10"
              aria-label="下一张"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
        
        {/* 图片指示器 */}
        {images.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 bg-black bg-opacity-30 backdrop-blur-sm rounded-full px-3 py-2">
            {images.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white scale-125' : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
              />
            ))}
          </div>
        )}

        {/* 使用提示 */}
        <div className="absolute bottom-8 right-4 text-white text-sm bg-black bg-opacity-30 backdrop-blur-sm rounded-lg px-3 py-2">
          💡 滚轮缩放(Ctrl加速) | 拖拽移动 | ESC关闭
        </div>
      </div>
    </div>
  )
}
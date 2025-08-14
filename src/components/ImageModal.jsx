import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

// 图片放大模态框组件 - 支持单图和多图切换
export default function ImageModal({ isOpen, onClose, imageUrl, images = [], currentIndex = 0, onPrevious, onNext }) {
  // 键盘ESC键关闭模态框，左右箭头键切换图片
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
    
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden' // 防止背景滚动
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, images.length, onPrevious, onNext])

  if (!isOpen) return null

  // 确定当前显示的图片
  const currentImage = images.length > 0 ? images[currentIndex] : imageUrl

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose} // 点击背景关闭
    >
      <div 
        className="relative max-w-4xl max-h-screen p-4"
        onClick={(e) => e.stopPropagation()} // 防止点击内容区域时关闭
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-colors z-10"
          aria-label="关闭"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* 图片容器 */}
        <div className="relative flex items-center">
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
          
          <img
            src={currentImage}
            alt={alt || '图片'}
            className="max-w-full max-h-screen object-contain rounded-lg shadow-2xl"
            onClick={onClose} // 点击图片也可以关闭
          />
          
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
      </div>
    </div>
  )
}
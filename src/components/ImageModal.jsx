import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

// 图片放大模态框组件
export default function ImageModal({ isOpen, onClose, imageUrl, alt }) {
  // 键盘ESC键关闭模态框
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    
    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden' // 防止背景滚动
    }
    
    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

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
        <div className="relative">
          <img
            src={imageUrl}
            alt={alt}
            className="max-w-full max-h-screen object-contain rounded-lg shadow-2xl"
            onClick={onClose} // 点击图片也可以关闭
          />
        </div>
      </div>
    </div>
  )
}
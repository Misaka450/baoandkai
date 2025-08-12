import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Grid, Play, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Download, Eye, EyeOff } from 'lucide-react'
import { apiRequest } from '../utils/api'

// 图片查看器组件 - 带防下载保护
function ImageViewer({ photo, onClose, onPrev, onNext, hasPrev, hasNext }) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showWatermark, setShowWatermark] = useState(true)
  const containerRef = useRef(null)
  const imageRef = useRef(null)

  // 防下载：禁用右键菜单
  const preventContextMenu = useCallback((e) => {
    e.preventDefault()
    return false
  }, [])

  // 防下载：禁用拖拽
  const preventDrag = useCallback((e) => {
    e.preventDefault()
    return false
  }, [])

  // 防下载：禁用键盘保存快捷键
  const preventSaveShortcuts = useCallback((e) => {
    // 禁用 Ctrl+S, Cmd+S, F12, Ctrl+Shift+I, Ctrl+Shift+J
    if (
      e.key === 's' && (e.ctrlKey || e.metaKey) ||
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
      (e.ctrlKey && e.key === 'u')
    ) {
      e.preventDefault()
      return false
    }
  }, [])

  // 重置缩放和位置
  const resetView = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  // 处理滚轮缩放
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newScale = Math.max(0.5, Math.min(3, scale + delta))
    setScale(newScale)
  }, [scale])

  // 处理键盘事件
  const handleKeyDown = useCallback((e) => {
    // 先处理防下载快捷键
    preventSaveShortcuts(e)
    
    switch (e.key) {
      case 'Escape':
        onClose()
        break
      case 'ArrowLeft':
        if (hasPrev) onPrev()
        break
      case 'ArrowRight':
        if (hasNext) onNext()
        break
      case 'r':
      case 'R':
        resetView()
        break
    }
  }, [onClose, onPrev, onNext, hasPrev, hasNext, resetView, preventSaveShortcuts])

  // 处理拖拽
  const handleMouseDown = useCallback((e) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }, [scale, position])

  const handleMouseMove = useCallback((e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }, [isDragging, dragStart, scale])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // 添加防下载事件监听
  useEffect(() => {
    const container = containerRef.current
    const image = imageRef.current
    
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      container.addEventListener('contextmenu', preventContextMenu)
      container.addEventListener('dragstart', preventDrag)
    }
    
    if (image) {
      image.addEventListener('contextmenu', preventContextMenu)
      image.addEventListener('dragstart', preventDrag)
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel)
        container.removeEventListener('contextmenu', preventContextMenu)
        container.removeEventListener('dragstart', preventDrag)
      }
      
      if (image) {
        image.removeEventListener('contextmenu', preventContextMenu)
        image.removeEventListener('dragstart', preventDrag)
      }
      
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleWheel, handleKeyDown, handleMouseMove, handleMouseUp, preventContextMenu, preventDrag])

  // 计算图片样式
  const imageStyle = {
    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
    cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    userSelect: 'none',
    pointerEvents: 'auto'
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      onContextMenu={preventContextMenu}
    >
      {/* 顶部工具栏 */}
      <div className="absolute top-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-4 flex items-center justify-between z-10">
        <div className="text-white">
          <p className="text-sm opacity-75">{photo.caption || '图片预览'}</p>
          <p className="text-xs opacity-50">缩放: {(scale * 100).toFixed(0)}%</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowWatermark(!showWatermark)}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            title={showWatermark ? '隐藏水印' : '显示水印'}
          >
            {showWatermark ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setScale(Math.min(3, scale + 0.2))}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            title="放大"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          <button
            onClick={() => setScale(Math.max(0.5, scale - 0.2))}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            title="缩小"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          <button
            onClick={resetView}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            title="重置视图 (R)"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
            title="关闭 (ESC)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 图片导航按钮 */}
      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPrev()
            resetView()
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 bg-black/50 p-3 rounded-full transition-all hover:bg-black/70"
          title="上一张 (←)"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      
      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onNext()
            resetView()
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 bg-black/50 p-3 rounded-full transition-all hover:bg-black/70"
          title="下一张 (→)"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* 水印层 */}
      {showWatermark && (
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 text-6xl font-bold select-none whitespace-nowrap transform -rotate-12">
            情侣空间
          </div>
          <div className="absolute bottom-8 right-8 text-white/30 text-lg select-none">
            baoandkai.pages.dev
          </div>
        </div>
      )}

      {/* 图片容器 - 添加防下载覆盖层 */}
      <div 
        className="flex items-center justify-center w-full h-full px-16 relative"
        onMouseDown={handleMouseDown}
      >
        {/* 防下载覆盖层 */}
        <div className="absolute inset-0 pointer-events-none" />
        
        <img
          ref={imageRef}
          src={photo.url}
          alt={photo.caption || '图片'}
          className="select-none pointer-events-auto"
          style={imageStyle}
          draggable={false}
          onContextMenu={preventContextMenu}
        />
      </div>

      {/* 使用说明提示 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full">
        滚轮缩放 | 拖拽移动 | 方向键切换 | ESC关闭 | 受保护图片
      </div>
    </div>
  )
}

export default function Albums() {
  const [albums, setAlbums] = useState([])
  const [selectedAlbum, setSelectedAlbum] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlbums()
  }, [])

  const fetchAlbums = async () => {
    try {
      const data = await apiRequest('/api/albums')
      setAlbums(data)
    } catch (error) {
      console.error('获取相册失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取相册封面图片
  const getCoverImage = (album) => {
    if (album.cover_image) return album.cover_image
    if (album.photos && album.photos.length > 0) return album.photos[0].url
    return '/placeholder-album.jpg'
  }

  // 处理图片点击事件
  const handlePhotoClick = (photo, index) => {
    setSelectedPhoto({
      photo,
      index,
      album: selectedAlbum
    })
  }

  // 关闭图片查看器
  const closeImageViewer = () => {
    setSelectedPhoto(null)
  }

  // 上一张图片
  const goToPrevPhoto = () => {
    if (selectedPhoto && selectedPhoto.album) {
      const currentIndex = selectedPhoto.index
      const newIndex = currentIndex > 0 ? currentIndex - 1 : selectedPhoto.album.photos.length - 1
      setSelectedPhoto({
        ...selectedPhoto,
        photo: selectedPhoto.album.photos[newIndex],
        index: newIndex
      })
    }
  }

  // 下一张图片
  const goToNextPhoto = () => {
    if (selectedPhoto && selectedPhoto.album) {
      const currentIndex = selectedPhoto.index
      const newIndex = currentIndex < selectedPhoto.album.photos.length - 1 ? currentIndex + 1 : 0
      setSelectedPhoto({
        ...selectedPhoto,
        photo: selectedPhoto.album.photos[newIndex],
        index: newIndex
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-flex flex-col items-center space-y-3">
              <div className="animate-pulse">
                <div className="h-2 bg-stone-200 rounded-full w-48 mb-4"></div>
                <div className="h-1.5 bg-stone-200 rounded-full w-32"></div>
              </div>
              <div className="mt-8 space-y-4 w-full max-w-md">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-stone-200 rounded w-3/4"></div>
                      <div className="h-3 bg-stone-200 rounded w-1/2"></div>
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="h-20 bg-stone-200 rounded-xl"></div>
                        <div className="h-20 bg-stone-200 rounded-xl"></div>
                        <div className="h-20 bg-stone-200 rounded-xl"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-stone-800 mb-4">我们的回忆相册</h1>
          <p className="text-stone-600 font-light">收藏每一个值得珍藏的瞬间</p>
        </div>

        {!selectedAlbum ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {albums.map((album) => (
              <div
                key={album.id}
                onClick={() => setSelectedAlbum(album)}
                className="group cursor-pointer"
              >
                <div className="backdrop-blur-sm bg-white/60 border border-white/20 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)] transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02]">
                  <div className="aspect-video rounded-2xl overflow-hidden mb-4 bg-stone-100 flex items-center justify-center">
                    <img
                      src={getCoverImage(album)}
                      alt={album.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        e.target.src = '/placeholder-album.jpg'
                      }}
                    />
                  </div>
                  <h3 className="text-xl font-light text-stone-800 mb-2">{album.name}</h3>
                  <p className="text-sm text-stone-600 font-light">
                    {album.description || `${album.photos?.length || 0} 张照片`}
                  </p>
                  <div className="mt-3">
                    <span className="text-xs text-stone-500 font-light">
                      {new Date(album.created_at).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <button
              onClick={() => setSelectedAlbum(null)}
              className="mb-6 flex items-center text-stone-600 hover:text-stone-800 transition-colors font-light"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              返回相册列表
            </button>
            
            <div className="mb-8">
              <h2 className="text-3xl font-light text-stone-800 mb-2">{selectedAlbum.name}</h2>
              <p className="text-stone-600 font-light">{selectedAlbum.description}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {selectedAlbum.photos?.map((photo, index) => (
                <div
                  key={photo.id}
                  onClick={() => handlePhotoClick(photo, index)}
                  className="group cursor-pointer"
                >
                  <div className="aspect-square rounded-xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-all duration-300 bg-stone-100 flex items-center justify-center">
                    <img
                      src={photo.url}
                      alt={photo.caption || `照片 ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = '/placeholder-image.jpg'
                      }}
                    />
                  </div>
                  {photo.caption && (
                    <p className="mt-2 text-sm text-stone-600 font-light truncate">{photo.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 图片查看器 */}
        {selectedPhoto && (
          <ImageViewer
            photo={selectedPhoto.photo}
            onClose={closeImageViewer}
            onPrev={goToPrevPhoto}
            onNext={goToNextPhoto}
            hasPrev={selectedPhoto.album.photos.length > 1}
            hasNext={selectedPhoto.album.photos.length > 1}
          />
        )}
      </div>
    </div>
  )
}

// 缩略图网格组件 - 带防下载保护
const ThumbnailGrid = ({ photos, onPhotoClick }) => {
  const preventContextMenu = useCallback((e) => {
    e.preventDefault()
    return false
  }, [])

  const preventDrag = useCallback((e) => {
    e.preventDefault()
    return false
  }, [])

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
          onClick={() => onPhotoClick(photo)}
        >
          {/* 防下载覆盖层 */}
          <div className="absolute inset-0 pointer-events-none z-10" />
          
          {/* 水印覆盖层 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
            <div className="absolute bottom-2 left-2 text-white/70 text-xs">
              受保护图片
            </div>
          </div>
          
          <img
            src={photo.url}
            alt={photo.caption || '图片'}
            className="w-full h-48 object-cover select-none"
            draggable={false}
            onContextMenu={preventContextMenu}
            onDragStart={preventDrag}
            loading="lazy"
          />
          
          {/* 悬停效果 */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          
          {/* 保护提示 */}
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            🔒 保护
          </div>
        </div>
      ))}
    </div>
  )
}

// 在主渲染部分替换原来的图片网格
      
      {/* 图片网格 */}
      {selectedAlbum && selectedAlbum.photos && selectedAlbum.photos.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {selectedAlbum.name} ({selectedAlbum.photos.length} 张图片)
            </h3>
            <div className="text-sm text-gray-500">
              点击图片查看大图 | 受保护图片
            </div>
          </div>
          
          <ThumbnailGrid 
            photos={selectedAlbum.photos} 
            onPhotoClick={handlePhotoClick} 
          />
        </div>
      )}
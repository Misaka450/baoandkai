import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Grid, Play, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { apiRequest } from '../utils/api'

// 图片查看器组件
function ImageViewer({ photo, onClose, onPrev, onNext, hasPrev, hasNext }) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef(null)
  const imageRef = useRef(null)

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
  }, [onClose, onPrev, onNext, hasPrev, hasNext, resetView])

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

  // 添加事件监听
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel)
      }
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleWheel, handleKeyDown, handleMouseMove, handleMouseUp])

  // 计算图片样式
  const imageStyle = {
    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
    cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain'
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* 顶部工具栏 */}
      <div className="absolute top-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-4 flex items-center justify-between z-10">
        <div className="text-white">
          <p className="text-sm opacity-75">{photo.caption || '图片预览'}</p>
          <p className="text-xs opacity-50">缩放: {(scale * 100).toFixed(0)}%</p>
        </div>
        <div className="flex items-center space-x-2">
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

      {/* 图片容器 */}
      <div 
        className="flex items-center justify-center w-full h-full px-16"
        onMouseDown={handleMouseDown}
      >
        <img
          ref={imageRef}
          src={photo.url}
          alt={photo.caption || '图片'}
          className="select-none"
          style={imageStyle}
          draggable={false}
        />
      </div>

      {/* 使用说明提示 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full">
        滚轮缩放 | 拖拽移动 | 方向键切换 | ESC关闭
      </div>
    </div>
  )
}

export default function Albums() {
  const [albums, setAlbums] = useState([])
  const [selectedAlbum, setSelectedAlbum] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlbums()
  }, [])

  const fetchAlbums = async () => {
    try {
      const data = await apiRequest('/api/albums')
      const formattedData = data.map(album => ({
        ...album,
        photos: (album.photos || album.images || []).map(photo => 
          typeof photo === 'string' 
            ? { url: photo, caption: '' }
            : photo
        )
      }))
      setAlbums(formattedData)
    } catch (error) {
      console.error('获取相册失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const openAlbum = (album) => {
    setSelectedAlbum(album)
    setSelectedPhoto(null)
    setCurrentPhotoIndex(0)
  }

  const closeAlbum = () => {
    setSelectedAlbum(null)
    setSelectedPhoto(null)
  }

  const openPhoto = (photo, index) => {
    setSelectedPhoto(photo)
    setCurrentPhotoIndex(index)
  }

  const closePhoto = () => {
    setSelectedPhoto(null)
  }

  const nextPhoto = () => {
    if (selectedAlbum && selectedAlbum.photos) {
      const nextIndex = (currentPhotoIndex + 1) % selectedAlbum.photos.length
      setCurrentPhotoIndex(nextIndex)
      setSelectedPhoto(selectedAlbum.photos[nextIndex])
    }
  }

  const prevPhoto = () => {
    if (selectedAlbum && selectedAlbum.photos) {
      const prevIndex = currentPhotoIndex === 0 
        ? selectedAlbum.photos.length - 1 
        : currentPhotoIndex - 1
      setCurrentPhotoIndex(prevIndex)
      setSelectedPhoto(selectedAlbum.photos[prevIndex])
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">加载中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">我们的相册</h1>
        <p className="text-gray-600 text-lg">记录每一个美好瞬间</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {albums.map((album) => (
          <div
            key={album.id}
            onClick={() => openAlbum(album)}
            className="glass-card cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="aspect-square relative overflow-hidden rounded-t-2xl">
              <img
                src={album.photos && album.photos.length > 0 ? album.photos[0].url : 'https://via.placeholder.com/400x400'}
                alt={album.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x400'
                  e.target.alt = '图片加载失败'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              {album.photos && album.photos.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  {album.photos.length} 张
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">{album.name}</h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{album.description || '暂无描述'}</p>
              <p className="text-xs text-gray-500">
                {album.photos?.length || 0} 张照片
              </p>
            </div>
          </div>
        ))}
      </div>

      {albums.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">还没有创建任何相册</p>
        </div>
      )}

      {/* 相册详情模态框 */}
      {selectedAlbum && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{selectedAlbum.name}</h2>
                <p className="text-gray-600">{selectedAlbum.description}</p>
              </div>
              <button
                onClick={closeAlbum}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {selectedAlbum.photos && selectedAlbum.photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {selectedAlbum.photos.map((photo, index) => (
                    <div
                      key={index}
                      onClick={() => openPhoto(photo, index)}
                      className="aspect-square cursor-pointer hover:scale-105 transition-transform duration-200"
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || `${selectedAlbum.name} - ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x300'
                          e.target.alt = '图片加载失败'
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>这个相册还没有照片</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 优化后的图片查看器 */}
      {selectedPhoto && selectedAlbum && (
        <ImageViewer
          photo={selectedPhoto}
          onClose={closePhoto}
          onPrev={prevPhoto}
          onNext={nextPhoto}
          hasPrev={selectedAlbum.photos && currentPhotoIndex > 0}
          hasNext={selectedAlbum.photos && currentPhotoIndex < selectedAlbum.photos.length - 1}
        />
      )}
    </div>
  )
}
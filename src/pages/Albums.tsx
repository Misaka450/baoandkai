import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Grid, Play, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Download, Eye, EyeOff, Image as ImageIcon } from 'lucide-react'
import { apiService } from '../services/apiService'
import { formatDate, LoadingSpinner } from '../utils/common.js'

// 定义照片接口
interface Photo {
  id: string;
  url: string;
  caption?: string;
}

// 定义相册接口
interface Album {
  id: string;
  name: string;
  description?: string;
  photos?: Photo[];
}

// 定义ImageViewer组件的props接口
interface ImageViewerProps {
  photo: Photo;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

// 图片查看器组件 - 带防下载保护
function ImageViewer({ photo, onClose, onPrev, onNext, hasPrev, hasNext }: ImageViewerProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // 防下载：禁用右键菜单
  const preventContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault()
    return false
  }, [])

  // 防下载：禁用拖拽
  const preventDrag = useCallback((e: DragEvent) => {
    e.preventDefault()
    return false
  }, [])

  // 防下载：禁用键盘保存快捷键
  const preventSaveShortcuts = useCallback((e: KeyboardEvent) => {
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
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    const newScale = Math.max(0.5, Math.min(3, scale + delta))
    setScale(newScale)
  }, [scale])

  // 处理键盘事件
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
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
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }, [scale, position])

  const handleMouseMove = useCallback((e: MouseEvent) => {
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
      container.addEventListener('contextmenu', preventContextMenu as EventListener)
      container.addEventListener('dragstart', preventDrag as EventListener)
    }

    if (image) {
      image.addEventListener('contextmenu', preventContextMenu as EventListener)
      image.addEventListener('dragstart', preventDrag as EventListener)
      image.addEventListener('mousedown', handleMouseDown as EventListener)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousemove', handleMouseMove as EventListener)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel)
        container.removeEventListener('contextmenu', preventContextMenu as EventListener)
        container.removeEventListener('dragstart', preventDrag as EventListener)
      }

      if (image) {
        image.removeEventListener('contextmenu', preventContextMenu as EventListener)
        image.removeEventListener('dragstart', preventDrag as EventListener)
        image.removeEventListener('mousedown', handleMouseDown as EventListener)
      }

      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousemove', handleMouseMove as EventListener)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleWheel, handleKeyDown, handleMouseMove, handleMouseUp, handleMouseDown, preventContextMenu, preventDrag])

  // 计算图片样式
  const imageStyle = {
    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
    cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain' as const,
    userSelect: 'none' as const,
    pointerEvents: 'auto' as const
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      onContextMenu={(e) => e.preventDefault()}
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
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70 transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onNext()
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70 transition-colors"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* 图片容器 */}
      <div className="relative flex items-center justify-center w-full h-full px-20">
        <img
          ref={imageRef}
          src={photo.url}
          alt={photo.caption || '图片'}
          style={imageStyle}
          className="max-w-full max-h-full object-contain select-none"
          draggable={false}
        />
      </div>
    </div>
  )
}

export default function Albums() {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [viewMode, setViewMode] = useState('grid')
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [photoIndex, setPhotoIndex] = useState(0)

  const { data: albumsData, isLoading: albumsLoading, isError: albumsError, error: albumsQueryError } = useQuery({
    queryKey: ['albums'],
    queryFn: async () => {
      const response = await apiService.get('/albums')
      if (response.error) throw new Error(response.error)
      return response.data
    }
  })
  const albums = Array.isArray(albumsData?.data) ? albumsData.data : Array.isArray(albumsData) ? albumsData : []

  const { data: photosData, isLoading: photosLoading } = useQuery({
    queryKey: ['album', selectedAlbum?.id],
    queryFn: async () => {
      if (!selectedAlbum) return { photos: [] }
      const response = await apiService.get(`/albums/${selectedAlbum.id}`)
      if (response.error) throw new Error(response.error)
      return response.data
    },
    enabled: !!selectedAlbum
  })
  const photos = Array.isArray(photosData?.photos) ? photosData.photos : []

  const loading = albumsLoading || (!!selectedAlbum && photosLoading)

  const handleAlbumSelect = (album: Album) => {
    setSelectedAlbum(album)
  }

  const openPhoto = (photo: Photo, index: number) => {
    setSelectedPhoto(photo)
    setPhotoIndex(index)
  }

  const closePhoto = () => {
    setSelectedPhoto(null)
  }

  const prevPhoto = () => {
    const newIndex = photoIndex > 0 ? photoIndex - 1 : photos.length - 1
    setSelectedPhoto(photos[newIndex])
    setPhotoIndex(newIndex)
  }

  const nextPhoto = () => {
    const newIndex = photoIndex < photos.length - 1 ? photoIndex + 1 : 0
    setSelectedPhoto(photos[newIndex])
    setPhotoIndex(newIndex)
  }

  // 使用统一加载组件
  if (loading && !selectedAlbum) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <ImageIcon className="w-12 h-12 text-stone-800 mx-auto mb-4" />
            <h1 className="text-4xl font-light text-stone-800 mb-4">我们的相册</h1>
            <p className="text-stone-600 font-light">收藏每一个美好瞬间</p>
            <LoadingSpinner message="正在加载相册..." />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <ImageIcon className="w-12 h-12 text-stone-800 mx-auto mb-4" />
          <h1 className="text-4xl font-light text-stone-800 mb-4">我们的相册</h1>
          <p className="text-stone-600 font-light">收藏每一个美好瞬间</p>
        </div>

        {!selectedAlbum ? (
          // 相册列表视图
          // 相册列表视图 - 统一stone色系
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-light text-stone-800">相册列表</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map(album => (
                <div
                  key={album.id}
                  onClick={() => handleAlbumSelect(album)}
                  className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)] transition-all duration-500 hover:-translate-y-2 cursor-pointer"
                >
                  <div className="aspect-video bg-gradient-to-br from-stone-100 to-stone-50 rounded-xl mb-4 flex items-center justify-center">
                    {Array.isArray(album.photos) && album.photos.length > 0 ? (
                      <img
                        src={album.photos[0]?.url}
                        alt={album.name}
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          target.parentElement!.innerHTML = '<svg class="h-12 w-12 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>'
                        }}
                      />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-stone-400" />
                    )}
                  </div>
                  <h3 className="text-lg font-light text-stone-800 mb-2">{album.name}</h3>
                  <p className="text-sm text-stone-600 font-light">
                    {Array.isArray(album.photos) ? album.photos.length : 0} 张照片
                  </p>
                </div>
              ))}
            </div>

            {albums.length === 0 && (
              <div className="text-center py-16">
                <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 max-w-sm mx-auto border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                  <ImageIcon className="w-16 h-16 text-stone-400 mx-auto mb-4" />
                  <h3 className="text-lg font-light text-stone-700 mb-2">暂无相册</h3>
                  <p className="text-sm text-stone-500 font-light">还没有创建任何相册</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // 照片列表视图
          // 照片列表视图 - 统一stone色系
          <div>
            <button
              onClick={() => {
                setSelectedAlbum(null)
                setSelectedPhoto(null)
              }}
              className="flex items-center mb-6 text-stone-600 hover:text-stone-800 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              返回相册列表
            </button>

            {/* 相册标题 */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-light text-stone-800 mb-2">{selectedAlbum.name}</h2>
              <p className="text-stone-600 font-light">{selectedAlbum.description || '收藏每一个美好瞬间'}</p>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <LoadingSpinner message="正在加载照片..." />
              </div>
            ) : photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    onClick={() => openPhoto(photo, index)}
                    className="group relative aspect-square bg-gradient-to-br from-stone-100 to-stone-50 rounded-xl overflow-hidden cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.15)] transition-all duration-500 hover:-translate-y-1"
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption || '照片'}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-sm font-light truncate">
                          {photo.caption || '未命名照片'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 max-w-sm mx-auto border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                  <ImageIcon className="w-16 h-16 text-stone-400 mx-auto mb-4" />
                  <h3 className="text-lg font-light text-stone-700 mb-2">暂无照片</h3>
                  <p className="text-sm text-stone-500 font-light">这个相册还没有照片</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 图片查看器 */}
      {selectedPhoto && (
        <ImageViewer
          photo={selectedPhoto}
          onClose={closePhoto}
          onPrev={prevPhoto}
          onNext={nextPhoto}
          hasPrev={photoIndex > 0}
          hasNext={photoIndex < photos.length - 1}
        />
      )}
    </div>
  )
}



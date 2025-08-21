import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Grid, Play, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Download, Eye, EyeOff, Image as ImageIcon } from 'lucide-react'
import { apiRequest } from '../utils/api'
import { formatDate, LoadingSpinner } from '../utils/common.js'

// 图片查看器组件 - 带防下载保护
function ImageViewer({ photo, onClose, onPrev, onNext, hasPrev, hasNext }) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
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
  const [albums, setAlbums] = useState([])
  const [selectedAlbum, setSelectedAlbum] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [showAddAlbum, setShowAddAlbum] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState('')
  const [showAddPhoto, setShowAddPhoto] = useState(false)
  const [newPhotoFile, setNewPhotoFile] = useState(null)
  const [newPhotoCaption, setNewPhotoCaption] = useState('')

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

  const fetchPhotos = async (albumId) => {
    try {
      const data = await apiRequest(`/api/albums/${albumId}/photos`)
      setPhotos(data)
    } catch (error) {
      console.error('获取照片失败:', error)
    }
  }

  const handleAlbumSelect = async (album) => {
    setSelectedAlbum(album)
    setLoading(true)
    await fetchPhotos(album.id)
    setLoading(false)
  }

  const handleAddAlbum = async () => {
    if (!newAlbumName.trim()) return
    
    try {
      const newAlbum = await apiRequest('/api/albums', {
        method: 'POST',
        body: JSON.stringify({ name: newAlbumName })
      })
      setAlbums([...albums, newAlbum])
      setNewAlbumName('')
      setShowAddAlbum(false)
    } catch (error) {
      console.error('创建相册失败:', error)
    }
  }

  const handleAddPhoto = async () => {
    if (!newPhotoFile || !selectedAlbum) return
    
    const formData = new FormData()
    formData.append('photo', newPhotoFile)
    formData.append('caption', newPhotoCaption)
    
    try {
      const newPhoto = await apiRequest(`/api/albums/${selectedAlbum.id}/photos`, {
        method: 'POST',
        body: formData
      })
      setPhotos([...photos, newPhoto])
      setNewPhotoFile(null)
      setNewPhotoCaption('')
      setShowAddPhoto(false)
    } catch (error) {
      console.error('上传照片失败:', error)
    }
  }

  const openPhoto = (photo, index) => {
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <ImageIcon className="w-12 h-12 text-purple-800 mx-auto mb-4" />
            <h1 className="text-4xl font-light text-purple-800 mb-4">我们的相册</h1>
            <p className="text-purple-600 font-light mb-8">收藏每一个美好瞬间</p>
            <LoadingSpinner message="正在加载相册..." />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <ImageIcon className="w-12 h-12 text-purple-800 mx-auto mb-4" />
          <h1 className="text-4xl font-light text-purple-800 mb-4">我们的相册</h1>
          <p className="text-purple-600 font-light">收藏每一个美好瞬间</p>
        </div>

        {!selectedAlbum ? (
          // 相册列表视图
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-light text-purple-800">相册列表</h2>
              <button
                onClick={() => setShowAddAlbum(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                新建相册
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map(album => (
                <div
                  key={album.id}
                  onClick={() => handleAlbumSelect(album)}
                  className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)] transition-all duration-500 hover:-translate-y-2 cursor-pointer"
                >
                  <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl mb-4 flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-light text-purple-800 mb-2">{album.name}</h3>
                  <p className="text-sm text-purple-600 font-light">{album.photoCount || 0} 张照片</p>
                </div>
              ))}
            </div>

            {albums.length === 0 && (
              <div className="text-center py-16">
                <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 max-w-sm mx-auto border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                  <ImageIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-lg font-light text-purple-700 mb-2">暂无相册</h3>
                  <p className="text-sm text-purple-500 font-light">创建第一个相册开始收藏美好回忆</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // 照片列表视图
          <div>
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => {
                  setSelectedAlbum(null)
                  setPhotos([])
                }}
                className="flex items-center text-purple-600 hover:text-purple-800 transition-colors"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                返回相册列表
              </button>
              
              <div className="flex items-center space-x-4">
                <div className="flex bg-white/50 backdrop-blur-sm rounded-full p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-purple-600'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-purple-600'
                    }`}
                  >
                    <Play className="h-4 w-4" />
                  </button>
                </div>
                
                <button
                  onClick={() => setShowAddPhoto(true)}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  上传照片
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-light text-purple-800 mb-6">{selectedAlbum.name}</h2>
              
              {loading ? (
                <div className="text-center py-12">
                  <LoadingSpinner message="正在加载照片..." />
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 
                  "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" : 
                  "space-y-4"
                }>
                  {photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      onClick={() => openPhoto(photo, index)}
                      className={`bg-white/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)] transition-all duration-500 hover:-translate-y-2 cursor-pointer ${
                        viewMode === 'list' ? 'flex' : ''
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || '照片'}
                        className={`w-full h-48 object-cover ${
                          viewMode === 'list' ? 'w-32 h-32 rounded-l-2xl' : ''
                        }`}
                      />
                      {viewMode === 'list' && (
                        <div className="p-4 flex-1">
                          <p className="font-light text-purple-800 mb-2">{photo.caption || '无标题'}</p>
                          <p className="text-sm text-purple-600 font-light">
                            {formatDate(photo.createdAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {photos.length === 0 && !loading && (
                <div className="text-center py-16">
                  <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 max-w-sm mx-auto border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                    <ImageIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-lg font-light text-purple-700 mb-2">暂无照片</h3>
                    <p className="text-sm text-purple-500 font-light">上传第一张照片到相册吧</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 添加相册对话框 */}
        {showAddAlbum && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-light text-purple-800 mb-4">新建相册</h3>
              <input
                type="text"
                value={newAlbumName}
                onChange={(e) => setNewAlbumName(e.target.value)}
                placeholder="相册名称"
                className="w-full px-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                onKeyPress={(e) => e.key === 'Enter' && handleAddAlbum()}
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddAlbum(false)}
                  className="flex-1 px-4 py-2 border border-purple-200 text-purple-600 rounded-xl hover:bg-purple-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddAlbum}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 上传照片对话框 */}
        {showAddPhoto && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-light text-purple-800 mb-4">上传照片</h3>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewPhotoFile(e.target.files[0])}
                className="w-full mb-4"
              />
              <input
                type="text"
                value={newPhotoCaption}
                onChange={(e) => setNewPhotoCaption(e.target.value)}
                placeholder="照片描述（可选）"
                className="w-full px-4 py-2 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddPhoto(false)}
                  className="flex-1 px-4 py-2 border border-purple-200 text-purple-600 rounded-xl hover:bg-purple-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddPhoto}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                >
                  上传
                </button>
              </div>
            </div>
          </div>
        )}

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
    </div>
  )
}
import { useState, useEffect } from 'react'
import { Plus, Grid, Play, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { apiRequest } from '../utils/api'

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
      // 转换数据结构，确保photos格式正确
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
      setCurrentPhotoIndex((prev) => 
        prev === selectedAlbum.photos.length - 1 ? 0 : prev + 1
      )
      setSelectedPhoto(selectedAlbum.photos[(currentPhotoIndex + 1) % selectedAlbum.photos.length])
    }
  }

  const prevPhoto = () => {
    if (selectedAlbum && selectedAlbum.photos) {
      setCurrentPhotoIndex((prev) => 
        prev === 0 ? selectedAlbum.photos.length - 1 : prev - 1
      )
      setSelectedPhoto(selectedAlbum.photos[currentPhotoIndex === 0 ? selectedAlbum.photos.length - 1 : currentPhotoIndex - 1])
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

      {/* 照片大图查看器 */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center">
          <button
            onClick={closePhoto}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X className="h-8 w-8" />
          </button>

          {selectedAlbum && selectedAlbum.photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 bg-black/50 p-2 rounded-full"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 bg-black/50 p-2 rounded-full"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div className="max-w-6xl max-h-[90vh] p-4">
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption || '照片'}
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/800x600'
                e.target.alt = '图片加载失败'
              }}
            />
            {selectedPhoto.caption && (
              <div className="text-center mt-4">
                <p className="text-white text-lg">{selectedPhoto.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
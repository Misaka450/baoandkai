import { useState, useEffect } from 'react'
import { Plus, Grid, Play, X } from 'lucide-react'
import { apiRequest } from '../utils/api'

export default function Albums() {
  const [albums, setAlbums] = useState([])
  const [selectedAlbum, setSelectedAlbum] = useState(null)
  const [slideshowActive, setSlideshowActive] = useState(false)
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
    setCurrentPhotoIndex(0)
  }

  const closeAlbum = () => {
    setSelectedAlbum(null)
    setSlideshowActive(false)
  }

  const startSlideshow = () => {
    setSlideshowActive(true)
    setCurrentPhotoIndex(0)
  }

  const stopSlideshow = () => {
    setSlideshowActive(false)
  }

  const nextPhoto = () => {
    if (selectedAlbum && selectedAlbum.photos) {
      setCurrentPhotoIndex((prev) => 
        prev === selectedAlbum.photos.length - 1 ? 0 : prev + 1
      )
    }
  }

  const prevPhoto = () => {
    if (selectedAlbum && selectedAlbum.photos) {
      setCurrentPhotoIndex((prev) => 
        prev === 0 ? selectedAlbum.photos.length - 1 : prev - 1
      )
    }
  }

  useEffect(() => {
    if (slideshowActive && selectedAlbum?.photos?.length > 1) {
      const interval = setInterval(nextPhoto, 3000)
      return () => clearInterval(interval)
    }
  }, [slideshowActive, selectedAlbum])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">加载中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">美好瞬间</h1>
        <p className="text-gray-600">记录我们每一个甜蜜的时刻</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {albums.map((album) => (
          <div
            key={album.id}
            onClick={() => openAlbum(album)}
            className="glass-card cursor-pointer hover:shadow-xl transition-shadow"
          >
            <div className="aspect-square">
              <img
                src={album.photos && album.photos.length > 0 ? album.photos[0].url : 'https://via.placeholder.com/400x400'}
                alt={album.name}
                className="w-full h-full object-cover rounded-t-2xl"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x400'
                  e.target.alt = '图片加载失败'
                }}
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{album.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{album.description}</p>
              <p className="text-sm text-gray-500">
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

      {/* 照片查看器 */}
      {selectedAlbum && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <button
            onClick={closeAlbum}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X className="h-8 w-8" />
          </button>

          <div className="max-w-4xl max-h-screen p-4">
            <div className="text-center mb-4">
              <h3 className="text-white text-xl font-semibold mb-2">{selectedAlbum.name}</h3>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={slideshowActive ? stopSlideshow : startSlideshow}
                  className="text-white hover:text-gray-300 flex items-center"
                >
                  {slideshowActive ? (
                    <>
                      <X className="h-5 w-5 mr-1" />
                      停止播放
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-1" />
                      幻灯片播放
                    </>
                  )}
                </button>
              </div>
            </div>

            {selectedAlbum.photos && selectedAlbum.photos.length > 0 && (
              <div>
                <img
                  src={selectedAlbum.photos[currentPhotoIndex].url}
                  alt={selectedAlbum.photos[currentPhotoIndex].caption}
                  className="max-w-full max-h-96 mx-auto rounded-lg"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/800x600'
                    e.target.alt = '图片加载失败'
                  }}
                />
                <div className="text-center mt-4">
                  <p className="text-white">
                    {selectedAlbum.photos[currentPhotoIndex].caption}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {currentPhotoIndex + 1} / {selectedAlbum.photos.length}
                  </p>
                </div>
              </div>
            )}

            {selectedAlbum.photos && selectedAlbum.photos.length > 1 && (
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={prevPhoto}
                  className="text-white hover:text-gray-300 px-4 py-2"
                >
                  上一张
                </button>
                <button
                  onClick={nextPhoto}
                  className="text-white hover:text-gray-300 px-4 py-2"
                >
                  下一张
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
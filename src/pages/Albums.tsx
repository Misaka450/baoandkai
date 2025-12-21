import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Grid, Play, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Download, Eye, EyeOff, Image as ImageIcon } from 'lucide-react'
import { apiService } from '../services/apiService'
import { formatDate, LoadingSpinner } from '../utils/common'
import { getThumbnailUrl, getOptimizedImageUrl } from '../utils/imageUtils'
import ImageModal from '../components/ImageModal'

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
export default function Albums() {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
  const [viewMode, setViewMode] = useState('grid')
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [photoIndex, setPhotoIndex] = useState(0)

  const { data: albumsData, isLoading: albumsLoading, isError: albumsError, error: albumsQueryError } = useQuery({
    queryKey: ['albums'],
    queryFn: async () => {
      const response = await apiService.get('/albums')
      if (response.error) {
        throw new Error(response.error)
      }
      return response.data
    }
  })
  const albums = Array.isArray(albumsData?.data) ? albumsData.data : Array.isArray(albumsData) ? albumsData : []

  const { data: photosData, isLoading: photosLoading } = useQuery({
    queryKey: ['album', selectedAlbum?.id],
    queryFn: async () => {
      if (!selectedAlbum) return { photos: [] }
      const response = await apiService.get(`/albums/${selectedAlbum.id}`)
      if (response.error) {
        throw new Error(response.error)
      }
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

  if (albumsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-stone-800 mb-2">加载失败</h2>
          <p className="text-stone-600 mb-6">{(albumsQueryError as Error)?.message || '无法加载相册数据'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-stone-800 text-white rounded-xl hover:bg-stone-700 transition-colors"
          >
            重试
          </button>
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
                        src={getThumbnailUrl(album.photos[0]?.url, 400)}
                        alt={album.name}
                        loading="lazy"
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
                      src={getThumbnailUrl(photo.url, 300)}
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
      <ImageModal
        isOpen={!!selectedPhoto}
        onClose={closePhoto}
        images={photos.map(p => getOptimizedImageUrl(p.url, { quality: 90 }))}
        currentIndex={photoIndex}
        onPrevious={prevPhoto}
        onNext={nextPhoto}
      />
    </div>
  )
}



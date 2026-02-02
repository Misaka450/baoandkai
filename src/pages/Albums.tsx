import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getThumbnailUrl } from '../utils/imageUtils'
import { apiService } from '../services/apiService'
import type { Album, Photo } from '../types'
import Icon from '../components/icons/Icons'
import ImageModal from '../components/ImageModal'
import { Skeleton, ImageGridSkeleton } from '../components/Skeleton'
import LazyImage from '../components/LazyImage'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

interface AlbumsResponse {
  data: Album[]
  totalPages: number
  totalCount: number
  currentPage: number
}

interface AlbumDetailResponse {
  id: number
  name: string
  description?: string
  photos: Photo[]
}

export default function Albums() {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // 当前选中的相册 ID
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null)

  // 看图模式状态
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // 锁定 body 滚动
  useBodyScrollLock(!!selectedAlbumId)

  const { data: albumsData, isLoading: loading } = useQuery({
    queryKey: ['albums', currentPage, itemsPerPage],
    queryFn: async () => {
      const { data, error } = await apiService.get<AlbumsResponse>(`/albums?page=${currentPage}&limit=${itemsPerPage}`)
      if (error) throw new Error(error)
      return data
    }
  })

  const albums = albumsData?.data || []

  // 使用 React Query 加载相册详情
  const { data: albumDetail, isLoading: loadingPhotos } = useQuery({
    queryKey: ['album-detail', selectedAlbumId],
    queryFn: async () => {
      if (!selectedAlbumId) return null
      const { data, error } = await apiService.get<AlbumDetailResponse>(`/albums/${selectedAlbumId}`)
      if (error) throw new Error(error)
      return data
    },
    enabled: !!selectedAlbumId,
    staleTime: Infinity,
  })

  // 点击相册 - 设置 ID 触发加载
  const handleAlbumClick = (album: Album) => {
    setSelectedAlbumId(album.id)
  }

  // 关闭相册详情弹窗
  const closeAlbumDetail = () => {
    setSelectedAlbumId(null)
  }

  const albumPhotos = albumDetail?.photos || []
  const selectedAlbum = albums.find(a => a.id === selectedAlbumId)

  // 点击单张照片 - 进入看图模式
  const handlePhotoClick = (index: number) => {
    setCurrentImageIndex(index)
    setImageModalOpen(true)
  }

  if (loading) return (
    <div className="min-h-screen pt-40 max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <Skeleton className="h-12 w-64 mx-auto mb-4" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
      <ImageGridSkeleton count={6} />
    </div>
  )

  return (
    <div className="min-h-screen text-slate-700 transition-colors duration-300">
      <main className="max-w-6xl mx-auto px-6 pb-32 pt-40 relative">
        <header className="text-center mb-20 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-black text-gradient tracking-tight mb-6">时光画册</h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest leading-relaxed">
            Every photo tells a story that never ends
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {albums.map((album, index) => (
            <div
              key={album.id}
              className="group animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => handleAlbumClick(album)}
            >
              <div className="relative aspect-[4/3] mb-6 cursor-pointer">
                {/* 叠层视觉增强 */}
                <div className="absolute inset-0 bg-white/40 rounded-[2.5rem] shadow-xl border border-white rotate-2 group-hover:rotate-4 transition-transform duration-700"></div>
                <div className="absolute inset-0 bg-white/60 rounded-[2.5rem] shadow-xl border border-white -rotate-2 group-hover:-rotate-4 transition-transform duration-700"></div>

                {/* 主相册封面 */}
                <div className="absolute inset-0 premium-card !p-0 z-10 overflow-hidden ring-4 ring-white shadow-2xl">
                  {album.cover_url ? (
                    <LazyImage
                      alt={album.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                      src={getThumbnailUrl(album.cover_url, 600)}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-200">
                      <Icon name="photo_library" size={64} className="mb-4 opacity-50" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Memories</p>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>

                  <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <div className="flex items-center gap-3 text-white">
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <Icon name="photo_album" size={16} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{album.photo_count || 0} Photos</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4">
                <h3 className="text-2xl font-black text-slate-800 mb-2 group-hover:text-primary transition-colors tracking-tight">{album.name}</h3>
                <p className="text-slate-400 font-medium text-sm line-clamp-2 leading-relaxed italic opacity-80">
                  {album.description || '记载生命中的每一个闪光时刻...'}
                </p>
              </div>
            </div>
          ))}

        </div>
      </main>

      {/* 沉浸式相册详情页 */}
      {selectedAlbum && (
        <div
          id="immersive-album-detail"
          className="fixed inset-0 z-[100] flex flex-col bg-slate-900 overflow-hidden animate-immersive-in"
          style={{ height: '100dvh' }}
        >
          {/* 沉浸式背景 - 毛玻璃模糊效果 */}
          <div className="absolute inset-0 z-0">
            {selectedAlbum.cover_url && (
              <img
                src={getThumbnailUrl(selectedAlbum.cover_url, 800)}
                alt="background"
                className="w-full h-full object-cover blur-3xl opacity-20 scale-110"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/80 to-slate-950"></div>
          </div>

          {/* 顶部导航栏 */}
          <header className="relative z-20 px-6 py-6 flex items-center justify-between">
            <button
              onClick={closeAlbumDetail}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all border border-white/10 active:scale-90"
            >
              <Icon name="west" size={24} />
            </button>
            <div className="flex-1 text-center px-4">
              <h2 className="text-xl font-black text-white truncate tracking-tight">{selectedAlbum.name}</h2>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-0.5">
                {albumPhotos.length} Memories
              </p>
            </div>
            <div className="w-12"></div> {/* 占位平衡 */}
          </header>

          {/* 内容滚功区 */}
          <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar pb-32">
            {/* 相册头信息 */}
            <div className="px-8 pt-4 pb-12 text-center max-w-2xl mx-auto">
              {selectedAlbum.description && (
                <div className="animate-slide-up">
                  <p className="text-white/60 font-medium italic leading-relaxed text-sm">
                    "{selectedAlbum.description}"
                  </p>
                </div>
              )}
            </div>

            {/* 照片网格 */}
            <div className="px-4 md:px-8 max-w-6xl mx-auto">
              {loadingPhotos ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="aspect-square bg-white/5 rounded-[1.5rem] animate-pulse"></div>
                  ))}
                </div>
              ) : albumPhotos.length === 0 ? (
                <div className="text-center py-24 text-white/20">
                  <Icon name="photo_library" size={80} className="mx-auto mb-6 opacity-20" />
                  <p className="text-xl font-black mb-2">相册空空如也</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {albumPhotos.map((photo, idx) => (
                    <div
                      key={photo.id || idx}
                      className="aspect-square rounded-[2rem] overflow-hidden cursor-pointer group/photo relative shadow-2xl animate-scale-in"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                      onClick={(e) => { e.stopPropagation(); handlePhotoClick(idx); }}
                    >
                      <LazyImage
                        src={getThumbnailUrl(photo.url, 600)}
                        alt={photo.caption || `照片${idx + 1}`}
                        className="w-full h-full object-cover group-hover/photo:scale-110 transition-transform duration-1000"
                      />
                      {photo.caption && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/photo:opacity-100 transition-opacity flex flex-col justify-end p-6">
                          <p className="text-white text-[10px] font-black uppercase tracking-widest translate-y-2 group-hover/photo:translate-y-0 transition-transform">
                            {photo.caption}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 图片查看器 */}
      <ImageModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        images={albumPhotos.map(p => p.url)}
        currentIndex={currentImageIndex}
        onPrevious={() => setCurrentImageIndex(prev => (prev - 1 + albumPhotos.length) % albumPhotos.length)}
        onNext={() => setCurrentImageIndex(prev => (prev + 1) % albumPhotos.length)}
        onJumpTo={setCurrentImageIndex}
      />
    </div>
  )
}

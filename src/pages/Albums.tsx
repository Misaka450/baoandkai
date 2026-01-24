import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../services/apiService'
import type { Album, Photo } from '../types'
import Icon from '../components/icons/Icons'
import ImageModal from '../components/ImageModal'

interface AlbumsResponse {
  data: Album[]
  totalPages: number
  totalCount: number
  currentPage: number
}

interface AlbumDetailResponse {
  id: string
  name: string
  description?: string
  photos: Photo[]
}

export default function Albums() {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // 相册详情展开状态
  const [expandedAlbum, setExpandedAlbum] = useState<Album | null>(null)
  const [albumPhotos, setAlbumPhotos] = useState<Photo[]>([])
  const [loadingPhotos, setLoadingPhotos] = useState(false)

  // 看图模式状态
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const { data: albumsData, isLoading: loading } = useQuery({
    queryKey: ['albums', currentPage, itemsPerPage],
    queryFn: async () => {
      const { data, error } = await apiService.get<AlbumsResponse>(`/albums?page=${currentPage}&limit=${itemsPerPage}`)
      if (error) throw new Error(error)
      return data
    }
  })

  const albums = albumsData?.data || []

  // 点击相册 - 展开详情
  const handleAlbumClick = async (album: Album) => {
    if (expandedAlbum?.id === album.id) {
      // 已展开则收起
      setExpandedAlbum(null)
      setAlbumPhotos([])
      return
    }

    setExpandedAlbum(album)
    setLoadingPhotos(true)
    try {
      const { data, error } = await apiService.get<AlbumDetailResponse>(`/albums/${album.id}`)
      if (error) throw new Error(error)
      setAlbumPhotos(data?.photos || [])
    } catch (e) {
      console.error('加载相册失败:', e)
      setAlbumPhotos([])
    } finally {
      setLoadingPhotos(false)
    }
  }

  // 点击单张照片 - 进入看图模式
  const handlePhotoClick = (index: number) => {
    setCurrentImageIndex(index)
    setImageModalOpen(true)
  }

  if (loading) return <div className="min-h-screen pt-32 text-center opacity-50">开启回忆相框...</div>

  return (
    <div className="min-h-screen bg-background-light text-slate-700 transition-colors duration-300">
      <main className="max-w-6xl mx-auto px-4 pb-20 pt-32">
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">我们的时光画册</h1>
          <p className="text-slate-500">每一张照片，都是一个藏在时光里的故事。</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {albums.map((album) => (
            <div key={album.id} className="group">
              {/* 相册卡片 */}
              <div
                className="cursor-pointer"
                onClick={() => handleAlbumClick(album)}
              >
                <div className="relative aspect-[4/3] mb-4">
                  {/* 叠层效果 */}
                  <div className="absolute inset-0 bg-white rounded-3xl shadow-sm border border-slate-100 rotate-1 group-hover:rotate-3 transition-transform"></div>
                  <div className="absolute inset-0 bg-white rounded-3xl shadow-sm border border-slate-100 -rotate-1 group-hover:-rotate-3 transition-transform"></div>

                  {/* 封面图 */}
                  <div className="absolute inset-0 bg-slate-50 rounded-3xl shadow-md border-4 border-white overflow-hidden z-10">
                    {album.photos && album.photos.length > 0 ? (
                      <img
                        alt={album.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src={album.photos[0]?.url || ''}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <Icon name="photo_library" size={48} className="mb-2" />
                        <p className="text-xs font-bold uppercase tracking-widest">还没有照片哦</p>
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/50 to-transparent">
                      <div className="flex items-center gap-2 text-white">
                        <Icon name="photo_album" size={16} />
                        <span className="text-xs font-medium">{album.photo_count || 0} 张照片</span>
                      </div>
                    </div>
                  </div>

                  {/* 加载状态 */}
                  {loadingPhotos && expandedAlbum?.id === album.id && (
                    <div className="absolute inset-0 bg-black/30 rounded-3xl z-20 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>

                <div className="px-2 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xl text-slate-800 mb-1 group-hover:text-primary transition-colors">{album.name}</h3>
                    <p className="text-slate-400 text-sm line-clamp-1">{album.description || '暂无描述'}</p>
                  </div>
                  <Icon
                    name={expandedAlbum?.id === album.id ? "expand_less" : "expand_more"}
                    size={24}
                    className="text-slate-400"
                  />
                </div>
              </div>

              {/* 展开的照片网格 */}
              {expandedAlbum?.id === album.id && (
                <div className="mt-4 p-4 bg-white/60 rounded-2xl border border-slate-100 shadow-inner">
                  {loadingPhotos ? (
                    <div className="text-center py-8 text-slate-400">加载中...</div>
                  ) : albumPhotos.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Icon name="photo_library" size={32} className="mx-auto mb-2 opacity-50" />
                      <p>这个相册还没有照片</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {albumPhotos.map((photo, idx) => (
                        <div
                          key={photo.id || idx}
                          className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-2 transition-all"
                          onClick={() => handlePhotoClick(idx)}
                        >
                          <img
                            src={photo.url}
                            alt={photo.caption || `照片${idx + 1}`}
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          <div className="group aspect-[4/3] bg-white/40 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center hover:bg-white/60 hover:border-primary/40 transition-all cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:bg-primary/5 transition-all mb-4">
              <Icon name="folder_special" size={32} />
            </div>
            <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">在后台新建画册</p>
          </div>
        </div>
      </main>

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

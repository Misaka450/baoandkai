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

  // 相册详情弹窗状态
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
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

  // 点击相册 - 打开详情弹窗
  const handleAlbumClick = async (album: Album) => {
    setSelectedAlbum(album)
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

  // 关闭相册详情弹窗
  const closeAlbumDetail = () => {
    setSelectedAlbum(null)
    setAlbumPhotos([])
  }

  // 点击单张照片 - 进入看图模式
  const handlePhotoClick = (index: number) => {
    setCurrentImageIndex(index)
    setImageModalOpen(true)
  }

  if (loading) return <div className="min-h-screen pt-32 text-center opacity-50">开启回忆相框...</div>

  return (
    <div className="min-h-screen text-slate-700 transition-colors duration-300">
      <main className="max-w-6xl mx-auto px-4 pb-20 pt-32">
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">我们的时光画册</h1>
          <p className="text-slate-500">每一张照片，都是一个藏在时光里的故事。</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {albums.map((album) => (
            <div
              key={album.id}
              className="group cursor-pointer"
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
              </div>

              <div className="px-2">
                <h3 className="font-bold text-xl text-slate-800 mb-1 group-hover:text-primary transition-colors">{album.name}</h3>
                <p className="text-slate-400 text-sm line-clamp-1">{album.description || '暂无描述'}</p>
              </div>
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

      {/* 相册详情弹窗 */}
      {selectedAlbum && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeAlbumDetail}
        >
          <div
            className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-white/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div className="p-4 md:p-6 bg-gradient-to-r from-stone-50 to-slate-50 border-b border-slate-100/50 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 truncate">{selectedAlbum.name}</h2>
                <p className="text-slate-500 text-sm truncate">{selectedAlbum.description || '暂无描述'}</p>
              </div>
              <button
                onClick={closeAlbumDetail}
                className="w-10 h-10 rounded-full bg-white/80 hover:bg-primary hover:text-white flex items-center justify-center transition-all shadow-sm"
              >
                <Icon name="west" size={20} />
              </button>
            </div>

            {/* 照片网格 */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {loadingPhotos ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-slate-400">加载中...</p>
                </div>
              ) : albumPhotos.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Icon name="photo_library" size={64} className="mx-auto mb-4 opacity-30" />
                  <p className="text-lg">这个相册还没有照片</p>
                  <p className="text-sm">去后台添加一些美好的回忆吧~</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {albumPhotos.map((photo, idx) => (
                    <div
                      key={photo.id || idx}
                      className="aspect-square rounded-2xl overflow-hidden cursor-pointer group/photo relative"
                      onClick={(e) => { e.stopPropagation(); handlePhotoClick(idx); }}
                    >
                      <img
                        src={photo.url}
                        alt={photo.caption || `照片${idx + 1}`}
                        className="w-full h-full object-cover group-hover/photo:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/20 transition-colors flex items-center justify-center">
                        <Icon name="search" size={32} className="text-white opacity-0 group-hover/photo:opacity-100 transition-opacity" />
                      </div>
                      {photo.caption && (
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                          <p className="text-white text-xs truncate">{photo.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 底部统计 */}
            {albumPhotos.length > 0 && (
              <div className="p-4 border-t border-slate-100 text-center text-slate-400 text-sm">
                共 {albumPhotos.length} 张照片
              </div>
            )}
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

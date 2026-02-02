import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getThumbnailUrl } from '../utils/imageUtils'
import { apiService } from '../services/apiService'
import type { Album } from '../types'
import Icon from '../components/icons/Icons'
import { Skeleton, ImageGridSkeleton } from '../components/Skeleton'
import LazyImage from '../components/LazyImage'

interface AlbumsResponse {
  data: Album[]
  totalPages: number
  totalCount: number
  currentPage: number
}

export default function Albums() {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  const { data: albumsData, isLoading: loading } = useQuery({
    queryKey: ['albums', currentPage, itemsPerPage],
    queryFn: async () => {
      const { data, error } = await apiService.get<AlbumsResponse>(`/albums?page=${currentPage}&limit=${itemsPerPage}`)
      if (error) throw new Error(error)
      return data
    }
  })

  const albums = albumsData?.data || []

  // 点击相册 - 导航到详情页
  const handleAlbumClick = (album: Album) => {
    navigate(`/albums/${album.id}`)
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
    </div>
  )
}

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getThumbnailUrl } from '../utils/imageUtils'
import { apiService } from '../services/apiService'
import type { Album } from '../types'
import Icon from '../components/icons/Icons'
import { Skeleton, ImageGridSkeleton } from '../components/Skeleton'
import LazyImage from '../components/LazyImage'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

interface AlbumsResponse {
  data: Album[]
  totalPages: number
  totalCount: number
  currentPage: number
}

type SortOption = 'newest' | 'oldest' | 'name' | 'photos'

export default function Albums() {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const itemsPerPage = 12

  // 使用防抖优化搜索输入，避免频繁请求
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)

  const { data: albumsData, isLoading: loading } = useQuery({
    queryKey: ['albums', currentPage, itemsPerPage],
    queryFn: async () => {
      const { data, error } = await apiService.get<AlbumsResponse>(`/albums?page=${currentPage}&limit=${itemsPerPage}`)
      if (error) throw new Error(error)
      return data
    }
  })

  const albums = albumsData?.data || []

  // 搜索和排序（使用防抖后的搜索词）
  const filteredAndSortedAlbums = useMemo(() => {
    let result = [...albums]

    // 搜索过滤
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase()
      result = result.filter(album =>
        album.name.toLowerCase().includes(query) ||
        album.description?.toLowerCase().includes(query)
      )
    }

    // 排序
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        case 'oldest':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        case 'name':
          return a.name.localeCompare(b.name, 'zh-CN')
        case 'photos':
          return (b.photo_count || 0) - (a.photo_count || 0)
        default:
          return 0
      }
    })

    return result
  }, [albums, debouncedSearchQuery, sortBy])

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

        {/* 搜索和排序工具栏 */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12 px-4 py-4 bg-white/40 backdrop-blur-md rounded-[2rem] border border-white shadow-lg animate-slide-up">
          {/* 搜索框 */}
          <div className="relative flex-1 w-full md:max-w-md">
            <Icon name="search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索相册名称..."
              className="w-full pl-12 pr-4 py-3 bg-white/80 border border-slate-100 rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all active:scale-[0.98]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </div>

          {/* 排序选项 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">排序:</span>
            {[
              { value: 'newest', label: '最新' },
              { value: 'oldest', label: '最早' },
              { value: 'name', label: '名称' },
              { value: 'photos', label: '照片数' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value as SortOption)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
                  sortBy === option.value
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-white/80 text-slate-500 hover:bg-white hover:text-slate-700 border border-slate-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 结果统计（使用防抖后的搜索词保持一致） */}
        {debouncedSearchQuery && (
          <div className="text-center mb-8 animate-fade-in">
            <p className="text-sm text-slate-400">
              找到 <span className="font-bold text-primary">{filteredAndSortedAlbums.length}</span> 个相册
            </p>
          </div>
        )}

        {/* 空状态 */}
        {filteredAndSortedAlbums.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
              <Icon name="photo_library" size={48} className="text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-400 mb-3">
              {debouncedSearchQuery ? '没有找到匹配的相册' : '还没有相册'}
            </h3>
            <p className="text-slate-300 text-sm max-w-md mx-auto">
              {debouncedSearchQuery ? '尝试其他关键词搜索' : '在管理后台创建第一个相册，记录你们的美好回忆吧'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filteredAndSortedAlbums.map((album, index) => (
              <div
                key={album.id}
                className="group animate-slide-up hover-card"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => handleAlbumClick(album)}
              >
                <div className="relative aspect-[4/3] mb-6 cursor-pointer">
                  <div className="absolute inset-0 bg-white/40 rounded-[2.5rem] shadow-xl border border-white rotate-2 group-hover:rotate-4 transition-transform duration-700"></div>
                  <div className="absolute inset-0 bg-white/60 rounded-[2.5rem] shadow-xl border border-white -rotate-2 group-hover:-rotate-4 transition-transform duration-700"></div>

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
        )}
      </main>
    </div>
  )
}

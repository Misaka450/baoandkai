import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getThumbnailUrl } from '../utils/imageUtils'
import { apiService } from '../services/apiService'
import type { Album } from '../types'
import Icon from '../components/icons/Icons'
import { Skeleton, ImageGridSkeleton } from '../components/common/Skeleton'
import LazyImage from '../components/common/LazyImage'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import ModuleSubNav from '../components/ModuleSubNav'
import { hapticFeedback } from '../utils/haptics'

interface AlbumsResponse {
  data: Album[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
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
      const { data, error } = await apiService.get<AlbumsResponse>(`/albums?page=${currentPage}&pageSize=${itemsPerPage}`)
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
    hapticFeedback('light')
    navigate(`/albums/${album.id}`)
  }

  if (loading) return (
    <div className="min-h-screen pt-20 md:pt-40 max-w-6xl mx-auto px-3.5 md:px-6">
      <div className="text-center mb-8 md:mb-16">
        <Skeleton className="h-8 md:h-12 w-48 md:w-64 mx-auto mb-2 md:mb-4" />
        <Skeleton className="h-3 md:h-4 w-32 md:w-48 mx-auto" />
      </div>
      <ImageGridSkeleton count={6} />
    </div>
  )

  return (
    <div className="min-h-screen text-slate-700 transition-colors duration-300">
      <main className="max-w-6xl mx-auto px-3.5 md:px-6 pb-20 md:pb-32 pt-20 md:pt-40 relative">
        <header className="text-center mb-6 md:mb-12 animate-fade-in">
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-gradient tracking-tight mb-1.5 md:mb-6">时光画册</h1>
          <p className="text-slate-400 font-bold text-[11px] md:text-sm uppercase tracking-widest leading-relaxed mb-4 md:mb-8">
            Every photo tells a story that never ends
          </p>
          <ModuleSubNav section="memory" className="mb-0" />
        </header>

        {/* 搜索和排序工具栏 */}
        <div className="p-2.5 md:p-4 mb-6 md:mb-12 bg-white/40 backdrop-blur-md rounded-2xl md:rounded-[2rem] border border-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-2.5 md:gap-4 animate-slide-up">
          {/* 搜索框 */}
          <div className="relative flex-1 w-full md:max-w-md">
            <Icon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 md:w-5 md:h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索相册名称..."
              className="w-full pl-10 pr-8 py-2 md:py-3 bg-white/80 border border-slate-100 rounded-xl md:rounded-2xl text-xs md:text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all active:scale-[0.99]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                aria-label="清除搜索"
              >
                <Icon name="close" size={14} />
              </button>
            )}
          </div>

          {/* 排序选项 */}
          <div className="flex items-center gap-1.5 md:gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar justify-start sm:justify-end">
            <span className="hidden sm:inline text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">排序:</span>
            {[
              { value: 'newest', label: '最新' },
              { value: 'oldest', label: '最早' },
              { value: 'name', label: '名称' },
              { value: 'photos', label: '照片数' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  hapticFeedback('light')
                  setSortBy(option.value as SortOption)
                }}
                className={`flex-shrink-0 px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[11px] md:text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
                  sortBy === option.value
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-white/80 text-slate-500 hover:bg-white hover:text-slate-700 border border-slate-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 结果统计 */}
        {debouncedSearchQuery && (
          <div className="text-center mb-6 animate-fade-in">
            <p className="text-xs md:text-sm text-slate-400">
              找到 <span className="font-bold text-primary">{filteredAndSortedAlbums.length}</span> 个相册
            </p>
          </div>
        )}

        {/* 空状态 */}
        {filteredAndSortedAlbums.length === 0 ? (
          <div className="text-center py-16 md:py-20 animate-fade-in">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Icon name="photo_library" size={36} className="text-slate-200 md:w-12 md:h-12" />
            </div>
            <h3 className="text-lg md:text-2xl font-black text-slate-400 mb-2 md:mb-3">
              {debouncedSearchQuery ? '没有找到匹配的相册' : '还没有相册'}
            </h3>
            <p className="text-slate-300 text-xs md:text-sm max-w-md mx-auto">
              {debouncedSearchQuery ? '尝试其他关键词搜索' : '在管理后台创建第一个相册，记录你们的美好回忆吧'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
            {filteredAndSortedAlbums.map((album, index) => (
              <div
                key={album.id}
                className="group animate-slide-up hover-card active:scale-[0.97] transition-transform duration-200"
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => handleAlbumClick(album)}
              >
                <div className="relative aspect-[4/3] mb-2 md:mb-4 cursor-pointer">
                  {/* 桌面端多层质感旋转阴影 (移动端隐藏以节约空间) */}
                  <div className="hidden md:block absolute inset-0 bg-white/40 rounded-[2.5rem] shadow-xl border border-white rotate-2 group-hover:rotate-4 transition-transform duration-700"></div>
                  <div className="hidden md:block absolute inset-0 bg-white/60 rounded-[2.5rem] shadow-xl border border-white -rotate-2 group-hover:-rotate-4 transition-transform duration-700"></div>

                  <div className="absolute inset-0 premium-card !p-0 z-10 overflow-hidden ring-2 md:ring-4 ring-white shadow-md md:shadow-2xl rounded-2xl md:rounded-[2.5rem]">
                    {album.cover_url ? (
                      <LazyImage
                        alt={album.name}
                        className="w-full h-full object-cover group-hover:scale-105 md:group-hover:scale-110 transition-transform duration-700"
                        src={getThumbnailUrl(album.cover_url, 600)}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-200">
                        <Icon name="photo_library" size={36} className="mb-2 opacity-50 md:w-16 md:h-16" />
                        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Awaiting Memories</p>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>

                    <div className="absolute bottom-0 left-0 right-0 p-2.5 md:p-8 transform md:translate-y-2 md:group-hover:translate-y-0 transition-transform">
                      <div className="flex items-center gap-1.5 md:gap-3 text-white">
                        <div className="w-5 h-5 md:w-8 md:h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                          <Icon name="photo_album" size={12} className="md:w-4 md:h-4" />
                        </div>
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider md:tracking-widest">{album.photo_count || 0} Photos</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-1 md:px-4">
                  <h3 className="text-xs sm:text-base md:text-2xl font-bold text-slate-800 mb-0.5 md:mb-2 group-hover:text-primary transition-colors tracking-tight line-clamp-1">{album.name}</h3>
                  <p className="text-slate-400 font-medium text-[10px] sm:text-xs md:text-sm line-clamp-1 md:line-clamp-2 leading-relaxed italic opacity-80">
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

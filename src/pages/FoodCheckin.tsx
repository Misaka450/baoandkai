import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../services/apiService'
import type { FoodCheckin } from '../types'
import ImageModal from '../components/modals/ImageModal'
import Icon, { IconName } from '../components/icons/Icons'
import { Skeleton } from '../components/common/Skeleton'
import LazyImage from '../components/common/LazyImage'
import FoodStats from '../components/map/FoodStats'
import { getThumbnailUrl } from '../utils/imageUtils'
import { formatDate } from '../utils/common'
import ModuleSubNav from '../components/ModuleSubNav'

type ViewMode = 'grid' | 'stats'

interface FoodResponse {
  data: FoodCheckin[]
  totalPages: number
  totalCount: number
  currentPage: number
}

interface CuisineConfig {
  name: string
  label: string
  icon: IconName
  color?: string
}

// 分类中文名到英文标签和图标的映射表
const cuisineLabelMap: Record<string, { label: string; icon: IconName }> = {
  '火锅': { label: 'Hot Pot', icon: 'local_fire_department' },
  '甜点': { label: 'Dessert', icon: 'icecream' },
  '烧烤': { label: 'Barbecue', icon: 'outdoor_grill' },
  '面食': { label: 'Noodles', icon: 'ramen_dining' },
  '日料': { label: 'Japanese', icon: 'restaurant' },
  '韩料': { label: 'Korean', icon: 'restaurant' },
  '西餐': { label: 'Western', icon: 'restaurant' },
  '中餐': { label: 'Chinese', icon: 'restaurant' },
  '小吃': { label: 'Snacks', icon: 'fastfood' },
  '饮品': { label: 'Drinks', icon: 'local_cafe' }
}

export default function FoodCheckin() {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // 多图查看状态
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // 从API获取已使用的分类列表
  const { data: cuisinesData } = useQuery({
    queryKey: ['foodCuisines'],
    queryFn: async () => {
      const response = await apiService.get<{ data: string[] }>('/food?cuisines=true')
      return response.data?.data || []
    },
    staleTime: 60 * 60 * 1000, // 分类数据缓存1小时
  })

  // 动态构建分类列表：将API返回的分类与预定义映射结合
  const cuisines = useMemo(() => {
    const apiCuisines = cuisinesData || []
    const allCuisines: CuisineConfig[] = [
      { name: 'all', label: 'Everything', icon: 'restaurant_menu' }
    ]

    // 添加API返回的分类
    apiCuisines.forEach(name => {
      const mapping = cuisineLabelMap[name]
      allCuisines.push({
        name,
        label: mapping?.label || name,
        icon: mapping?.icon || 'restaurant'
      })
    })

    return allCuisines
  }, [cuisinesData])

  const { data: foodData, isLoading: loading } = useQuery({
    queryKey: ['food', currentPage, filter],
    queryFn: async () => {
      const response = await apiService.get<FoodResponse>(`/food?page=${currentPage}&limit=12&cuisine=${filter === 'all' ? '' : filter}`)
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  })

  const checkins = foodData?.data || []

  const renderStars = (rating: number = 0, size: number = 16) => (
    <div className="flex text-primary">
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon
          key={i}
          name="favorite"
          size={size}
          className={i < rating ? "fill-current animate-pulse" : "text-gray-200"}
        />
      ))}
    </div>
  )

  const renderMiniRating = (label: string, rating?: number) => {
    if (!rating) return null
    return (
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < rating ? 'bg-primary' : 'bg-slate-100'}`} />
          ))}
        </div>
      </div>
    )
  }

  const handleImageClick = (images: string[], startIndex: number = 0) => {
    if (images && images.length > 0) {
      setSelectedImages(images)
      setCurrentImageIndex(startIndex)
    }
  }

  if (loading) return (
    <div className="min-h-screen pt-20 md:pt-40 max-w-6xl mx-auto px-3.5 md:px-6">
      <div className="text-center mb-8 md:mb-16">
        <Skeleton className="h-8 md:h-12 w-48 md:w-64 mx-auto mb-2 md:mb-4" />
        <Skeleton className="h-3 md:h-4 w-32 md:w-48 mx-auto" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-10">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="premium-card p-0 overflow-hidden h-80 md:h-96 rounded-2xl md:rounded-[2.5rem]">
            <Skeleton className="h-44 md:h-52 w-full" />
            <div className="p-4 md:p-6 space-y-3 md:space-y-4">
              <Skeleton className="h-5 md:h-6 w-3/4" />
              <Skeleton className="h-3 md:h-4 w-full" />
              <Skeleton className="h-3 md:h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen text-slate-700 transition-colors duration-300">
      <main className="max-w-6xl mx-auto px-3.5 md:px-6 pb-20 md:pb-32 pt-16 sm:pt-20 md:pt-40 relative">
        <header className="text-center mb-4 sm:mb-8 md:mb-16 animate-fade-in">
          <h1 className="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-gradient tracking-tight mb-1 sm:mb-1.5 md:mb-6">美食足迹</h1>
          <p className="hidden sm:block text-slate-400 font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-widest leading-relaxed mb-3 sm:mb-4 md:mb-8">
            Discovering the world, one bite at a time
          </p>

          <ModuleSubNav section="couple" className="mb-2 sm:mb-4" />

          <div className="flex items-center gap-1.5 md:gap-3 mt-2 sm:mt-4 md:mt-6 bg-white/40 p-1.5 md:p-2 rounded-2xl md:rounded-[2rem] border border-white max-w-full overflow-x-auto no-scrollbar mx-auto backdrop-blur-md px-2">
            {cuisines.map(c => (
              <button
                key={c.name}
                onClick={() => setFilter(c.name)}
                className={`px-3 py-1.5 md:px-6 md:py-2.5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 md:gap-2 transition-all whitespace-nowrap shrink-0 ${filter === c.name
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                  }`}
              >
                <Icon name={c.icon} size={14} />
                {c.label}
              </button>
            ))}
          </div>

          {/* 视图切换 */}
          {checkins.length > 0 && (
            <div className="flex justify-center gap-2 mt-3 sm:mt-6">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-white/50 text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon name="grid_view" size={15} />
                卡片
              </button>
              <button
                onClick={() => setViewMode('stats')}
                className={`px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  viewMode === 'stats'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-white/50 text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon name="bar_chart" size={15} />
                统计
              </button>
            </div>
          )}
        </header>

        {viewMode === 'stats' ? (
          <motion.div
            className="max-w-4xl mx-auto animate-slide-up"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FoodStats checkins={checkins} />
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-10">
          {checkins.map((checkin, index) => {
            const images = checkin.images || []
            return (
              <div key={checkin.id} className="premium-card !p-0 overflow-hidden group hover:-translate-y-2 transition-all duration-700 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="h-36 sm:h-52 md:h-64 relative overflow-hidden cursor-pointer" onClick={() => handleImageClick(images, 0)}>
                  <LazyImage
                    alt={checkin.restaurant_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    src={getThumbnailUrl(images[0] || '', 600)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>

                  <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 premium-glass !bg-white/90 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border-none shadow-sm">
                    <span className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest">{checkin.cuisine}</span>
                  </div>

                  {checkin.price_range && (
                    <div className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 bg-slate-900/80 backdrop-blur-md px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-sm">
                      <span className="text-[9px] sm:text-[10px] font-black text-white tracking-widest">¥{checkin.price_range}/Person</span>
                    </div>
                  )}

                  {images.length > 1 && (
                    <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-white/20 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] text-white font-black uppercase tracking-widest flex items-center gap-1.5 border border-white/20">
                      <Icon name="photo_library" size={12} />
                      {images.length} Photos
                    </div>
                  )}
                </div>

                <div className="p-3.5 sm:p-6 md:p-8">
                  <div className="flex justify-between items-start mb-1.5 sm:mb-4">
                    <h3 className="font-black text-base sm:text-xl md:text-2xl text-slate-800 leading-tight tracking-tight group-hover:text-primary transition-colors">{checkin.restaurant_name}</h3>
                    <div className="bg-slate-50 p-1 sm:p-1.5 rounded-lg sm:rounded-xl">
                      {renderStars(checkin.overall_rating, 13)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-2 sm:mb-4">
                    {checkin.address ? (
                      <button
                        type="button"
                        onClick={() => navigate('/map')}
                        className="group/loc inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary transition-all text-left max-w-[70%] cursor-pointer"
                        title="在足迹地图中查看"
                      >
                        <Icon name="location_on" size={12} className="text-primary group-hover/loc:scale-110 transition-transform shrink-0" />
                        <span className="text-[10px] sm:text-[11px] font-bold truncate">{checkin.address}</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Icon name="location_on" size={13} className="text-primary/40" />
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest truncate">Somewhere delicious</span>
                      </div>
                    )}
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold shrink-0">{formatDate(checkin.date, 'short')}</span>
                  </div>

                  {checkin.recommended_dishes && (
                    <div className="mb-2 sm:mb-6 flex flex-wrap gap-1 sm:gap-2">
                      {checkin.recommended_dishes.split(/[,，、]/).filter(Boolean).slice(0, 3).map((dish, i) => (
                        <span key={i} className="premium-badge !bg-slate-50 !text-slate-500 !shadow-none border border-slate-100 !text-[9px] sm:!text-[10px]">
                          {dish.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {checkin.description && (
                    <p className="text-slate-500 font-medium text-xs sm:text-sm italic mb-2 sm:mb-6 line-clamp-2 leading-relaxed opacity-80">"{checkin.description}"</p>
                  )}

                  {(checkin.taste_rating || checkin.environment_rating || checkin.service_rating) && (
                    <div className="hidden sm:flex flex-wrap gap-4 mb-4 sm:mb-8 py-3 sm:py-4 border-y border-dashed border-slate-100">
                      {renderMiniRating('Taste', checkin.taste_rating)}
                      {renderMiniRating('Vibe', checkin.environment_rating)}
                      {renderMiniRating('Service', checkin.service_rating)}
                    </div>
                  )}

                  {images.length > 1 && (
                    <div className="flex gap-2 mb-2 sm:mb-8">
                      {images.slice(0, 4).map((img, i) => (
                        <div
                          key={i}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden cursor-pointer hover:ring-4 hover:ring-primary/10 transition-all shadow-sm"
                          onClick={() => handleImageClick(images, i)}
                        >
                          <LazyImage className="w-full h-full object-cover" src={getThumbnailUrl(img, 200)} alt={`Photo ${i}`} />
                        </div>
                      ))}
                      {images.length > 4 && (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-slate-900 text-white flex items-center justify-center text-[9px] sm:text-[10px] font-black">
                          +{images.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        )}

        {/* 分页 */}
        {foodData && foodData.totalPages > 1 && (
          <div className="relative flex flex-col items-center justify-center py-16 mt-8">
            <div className="w-4 h-4 bg-primary rounded-full shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)] animate-pulse"></div>
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => {
                  setCurrentPage(prev => prev - 1)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                disabled={currentPage === 1}
                className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-30 transition-all hover:scale-110 active:scale-95"
              >
                <Icon name="chevron_left" size={24} />
              </button>
              {Array.from({ length: Math.min(foodData.totalPages, 7) }).map((_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentPage(pageNum)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className={`w-12 h-12 rounded-2xl transition-all text-sm font-black active:scale-95 ${
                      currentPage === pageNum
                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                        : 'bg-white text-gray-400 hover:text-primary'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => {
                  setCurrentPage(prev => prev + 1)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                disabled={currentPage === foodData.totalPages}
                className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-30 transition-all hover:scale-110 active:scale-95"
              >
                <Icon name="chevron_right" size={24} />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-4 font-medium">
              第 {currentPage} / {foodData.totalPages} 页，共 {foodData.totalCount} 条
            </p>
          </div>
        )}
      </main>

      <ImageModal
        isOpen={selectedImages.length > 0}
        onClose={() => setSelectedImages([])}
        images={selectedImages}
        currentIndex={currentImageIndex}
        onPrevious={() => setCurrentImageIndex(prev => (prev - 1 + selectedImages.length) % selectedImages.length)}
        onNext={() => setCurrentImageIndex(prev => (prev + 1) % selectedImages.length)}
        onJumpTo={setCurrentImageIndex}
      />
    </div>
  )
}
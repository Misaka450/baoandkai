import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../services/apiService'
import type { FoodCheckin } from '../types'
import ImageModal from '../components/ImageModal'
import Icon, { IconName } from '../components/icons/Icons'

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

const cuisines: CuisineConfig[] = [
  { name: 'all', label: '全都要', icon: 'restaurant_menu' },
  { name: '火锅', label: '热腾腾火锅', icon: 'local_fire_department', color: 'bg-morandi-rose' },
  { name: '甜点', label: '甜蜜蜜', icon: 'icecream', color: 'bg-morandi-pink' },
  { name: '烧烤', label: '滋滋烧烤', icon: 'outdoor_grill', color: 'bg-morandi-yellow' },
  { name: '面食', label: '吸溜面条', icon: 'ramen_dining', color: 'bg-morandi-green' }
]

export default function FoodCheckin() {
  const [currentPage, setCurrentPage] = useState(1)
  const [filter, setFilter] = useState('all')

  // 多图查看状态
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const { data: foodData, isLoading: loading } = useQuery({
    queryKey: ['food', currentPage, filter],
    queryFn: async () => {
      const response = await apiService.get<FoodResponse>(`/food?page=${currentPage}&limit=12&cuisine=${filter === 'all' ? '' : filter}`)
      return response.data
    }
  })

  const checkins = foodData?.data || []

  // 临时过滤逻辑 (如果后端筛选不可用)
  const filteredCheckins = filter === 'all'
    ? checkins
    : checkins.filter(c => c.cuisine === filter)

  const renderStars = (rating: number = 0, size: number = 16) => (
    <div className="flex text-primary">
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon
          key={i}
          name="favorite"
          size={size}
          className={i < rating ? "fill-current" : "text-gray-200"}
        />
      ))}
    </div>
  )

  // 迷你评分条
  const renderMiniRating = (label: string, rating?: number) => {
    if (!rating) return null
    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-slate-400">{label}</span>
        <div className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full mx-px ${i < rating ? 'bg-primary' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>
    )
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  // 打开图片查看器
  const handleImageClick = (images: string[], startIndex: number = 0) => {
    if (images && images.length > 0) {
      setSelectedImages(images)
      setCurrentImageIndex(startIndex)
    }
  }

  if (loading) return <div className="min-h-screen pt-32 text-center opacity-50">觅食中...</div>

  return (
    <div className="min-h-screen text-slate-700 transition-colors duration-300">
      <main className="max-w-6xl mx-auto px-4 pb-20 pt-32">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">我们的美食足迹</h1>
          <p className="text-slate-500">记录我们共享的每一个美味瞬间。</p>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {cuisines.map(c => (
              <button
                key={c.name}
                onClick={() => setFilter(c.name)}
                className={`px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${filter === c.name
                  ? `${c.color || 'bg-primary'} text-white shadow-md`
                  : 'bg-white shadow-sm border border-slate-100 hover:bg-primary/10'
                  }`}
              >
                <Icon name={c.icon} size={18} />
                {c.label}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCheckins.map((checkin) => {
            const images = checkin.images || []

            return (
              <div key={checkin.id} className="bg-white/90 rounded-3xl shadow-lg border border-white/50 overflow-hidden group hover:shadow-xl hover:scale-[1.02] transition-all duration-500">
                <div className="h-52 relative overflow-hidden cursor-pointer" onClick={() => handleImageClick(images, 0)}>
                  <img
                    alt={checkin.restaurant_name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    src={images[0] || ''}
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-primary shadow-sm">
                    {checkin.cuisine}
                  </div>
                  {/* 人均花费 */}
                  {checkin.price_range && (
                    <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-sm">
                      ¥{checkin.price_range}/人
                    </div>
                  )}
                  {/* 多图指示器 */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-white flex items-center gap-1">
                      <Icon name="photo_library" size={14} />
                      {images.length}
                    </div>
                  )}
                </div>
                <div className="p-6">
                  {/* 餐厅名称和总评分 */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-slate-800 leading-tight">{checkin.restaurant_name}</h3>
                    {renderStars(checkin.overall_rating)}
                  </div>

                  {/* 地址 */}
                  <div className="flex items-center gap-1 text-slate-400 text-xs mb-3">
                    <Icon name="location_on" size={12} />
                    <span className="truncate">{checkin.address || '未知地址'}</span>
                  </div>

                  {/* 推荐菜品 */}
                  {checkin.recommended_dishes && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {checkin.recommended_dishes.split(/[,，、]/).filter(Boolean).slice(0, 3).map((dish, i) => (
                          <span key={i} className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-medium">
                            {dish.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 描述 */}
                  {checkin.description && (
                    <p className="text-slate-500 text-sm italic mb-3 line-clamp-2">"{checkin.description}"</p>
                  )}

                  {/* 迷你评分条 */}
                  {(checkin.taste_rating || checkin.environment_rating || checkin.service_rating) && (
                    <div className="flex flex-wrap gap-3 mb-3 py-2 border-t border-slate-100">
                      {renderMiniRating('口味', checkin.taste_rating)}
                      {renderMiniRating('环境', checkin.environment_rating)}
                      {renderMiniRating('服务', checkin.service_rating)}
                    </div>
                  )}

                  {/* 多图缩略图行 */}
                  {images.length > 1 && (
                    <div className="flex gap-2 mb-3">
                      {images.slice(0, 4).map((img, i) => (
                        <div
                          key={i}
                          className="w-10 h-10 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                          onClick={() => handleImageClick(images, i)}
                        >
                          <img loading="lazy" decoding="async" className="w-full h-full object-cover" src={img} alt={`Photo ${i}`} />
                        </div>
                      ))}
                      {images.length > 4 && (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-xs text-slate-500 font-medium">
                          +{images.length - 4}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 日期 */}
                  <p className="text-[10px] text-end text-slate-300 font-bold uppercase tracking-widest">{formatDate(checkin.date)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* 多图查看器 */}
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
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../services/apiService'
import type { FoodCheckin } from '../types'
import ImageModal from '../components/ImageModal'
import Icon, { IconName } from '../components/icons/Icons'
import { Skeleton } from '../components/Skeleton'
import LazyImage from '../components/LazyImage'
import { getThumbnailUrl } from '../utils/imageUtils'

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
  { name: 'all', label: 'Everything', icon: 'restaurant_menu' },
  { name: '火锅', label: 'Hot Pot', icon: 'local_fire_department' },
  { name: '甜点', label: 'Dessert', icon: 'icecream' },
  { name: '烧烤', label: 'Barbecue', icon: 'outdoor_grill' },
  { name: '面食', label: 'Noodles', icon: 'ramen_dining' }
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
    },
    staleTime: Infinity,
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

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const handleImageClick = (images: string[], startIndex: number = 0) => {
    if (images && images.length > 0) {
      setSelectedImages(images)
      setCurrentImageIndex(startIndex)
    }
  }

  if (loading) return (
    <div className="min-h-screen pt-40 max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <Skeleton className="h-12 w-64 mx-auto mb-4" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="premium-card p-0 overflow-hidden h-96">
            <Skeleton className="h-52 w-full" />
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen text-slate-700 transition-colors duration-300">
      <main className="max-w-6xl mx-auto px-6 pb-32 pt-40 relative">
        <header className="text-center mb-20 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-black text-gradient tracking-tight mb-6">美食足迹</h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest leading-relaxed">
            Discovering the world, one bite at a time
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-12 bg-white/40 p-2 rounded-[2rem] border border-white max-w-fit mx-auto backdrop-blur-md">
            {cuisines.map(c => (
              <button
                key={c.name}
                onClick={() => setFilter(c.name)}
                className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${filter === c.name
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                  }`}
              >
                <Icon name={c.icon} size={14} />
                {c.label}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {checkins.map((checkin, index) => {
            const images = checkin.images || []
            return (
              <div key={checkin.id} className="premium-card !p-0 overflow-hidden group hover:-translate-y-2 transition-all duration-700 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="h-64 relative overflow-hidden cursor-pointer" onClick={() => handleImageClick(images, 0)}>
                  <LazyImage
                    alt={checkin.restaurant_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    src={getThumbnailUrl(images[0] || '', 600)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>

                  <div className="absolute top-4 left-4 premium-glass !bg-white/90 px-3 py-1 rounded-full border-none shadow-sm">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">{checkin.cuisine}</span>
                  </div>

                  {checkin.price_range && (
                    <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
                      <span className="text-[10px] font-black text-white tracking-widest">¥{checkin.price_range}/Person</span>
                    </div>
                  )}

                  {images.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-2xl text-[10px] text-white font-black uppercase tracking-widest flex items-center gap-1.5 border border-white/20">
                      <Icon name="photo_library" size={12} />
                      {images.length} Photos
                    </div>
                  )}
                </div>

                <div className="p-8">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-black text-2xl text-slate-800 leading-tight tracking-tight group-hover:text-primary transition-colors">{checkin.restaurant_name}</h3>
                    <div className="bg-slate-50 p-1.5 rounded-xl">
                      {renderStars(checkin.overall_rating, 14)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 mb-6">
                    <Icon name="location_on" size={14} className="text-primary/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest truncate">{checkin.address || 'Somewhere delicious'}</span>
                  </div>

                  {checkin.recommended_dishes && (
                    <div className="mb-6 flex flex-wrap gap-2">
                      {checkin.recommended_dishes.split(/[,，、]/).filter(Boolean).slice(0, 3).map((dish, i) => (
                        <span key={i} className="premium-badge !bg-slate-50 !text-slate-500 !shadow-none border border-slate-100">
                          {dish.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {checkin.description && (
                    <p className="text-slate-500 font-medium text-sm italic mb-6 line-clamp-2 leading-relaxed opacity-80">"{checkin.description}"</p>
                  )}

                  {(checkin.taste_rating || checkin.environment_rating || checkin.service_rating) && (
                    <div className="flex flex-wrap gap-4 mb-8 py-4 border-y border-dashed border-slate-100">
                      {renderMiniRating('Taste', checkin.taste_rating)}
                      {renderMiniRating('Vibe', checkin.environment_rating)}
                      {renderMiniRating('Service', checkin.service_rating)}
                    </div>
                  )}

                  {images.length > 1 && (
                    <div className="flex gap-2.5 mb-8">
                      {images.slice(0, 4).map((img, i) => (
                        <div
                          key={i}
                          className="w-12 h-12 rounded-xl overflow-hidden cursor-pointer hover:ring-4 hover:ring-primary/10 transition-all shadow-sm"
                          onClick={() => handleImageClick(images, i)}
                        >
                          <LazyImage className="w-full h-full object-cover" src={getThumbnailUrl(img, 200)} alt={`Photo ${i}`} />
                        </div>
                      ))}
                      {images.length > 4 && (
                        <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                          +{images.length - 4}
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-[10px] text-end text-slate-300 font-black uppercase tracking-[0.2em]">{formatDate(checkin.date)}</p>
                </div>
              </div>
            )
          })}
        </div>
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
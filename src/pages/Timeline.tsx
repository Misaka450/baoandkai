import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../services/apiService'
import { getThumbnailUrl } from '../utils/imageUtils'
import type { TimelineEvent } from '../types'
import ImageModal from '../components/ImageModal'
import Icon, { IconName } from '../components/icons/Icons'
import { Skeleton, TimelineSkeleton } from '../components/Skeleton'
import LazyImage from '../components/LazyImage'

interface TimelineResponse {
  data: TimelineEvent[]
  totalPages: number
  totalCount: number
  currentPage: number
}

interface CategoryConfig {
  icon: IconName
  color: string
}

const categoryConfigs: Record<string, CategoryConfig> = {
  '生活': { icon: 'favorite', color: 'morandi-pink' },
  '旅行': { icon: 'flight', color: 'morandi-blue' },
  '美食': { icon: 'restaurant', color: 'morandi-green' },
  '纪念': { icon: 'star', color: 'morandi-purple' },
  'default': { icon: 'auto_awesome', color: 'primary' }
}

export default function Timeline() {
  const [currentPage, setCurrentPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [currentImages, setCurrentImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const { data: timelineData, isLoading: loading } = useQuery({
    queryKey: ['timeline', currentPage, filter],
    queryFn: async () => {
      const response = await apiService.get<TimelineResponse>(`/timeline?page=${currentPage}&limit=10&category=${filter === 'all' ? '' : filter}`)
      return response.data
    },
    staleTime: Infinity,
  })

  const events = timelineData?.data || []
  const totalPages = timelineData?.totalPages || 0

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) return (
    <div className="min-h-screen pt-40 max-w-6xl mx-auto px-6">
      <div className="text-center mb-16">
        <Skeleton className="h-12 w-64 mx-auto mb-4" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
      <TimelineSkeleton />
    </div>
  )

  return (
    <div className="min-h-screen text-slate-700 transition-colors duration-300">
      <main className="max-w-6xl mx-auto px-6 pb-32 pt-40 relative">
        <header className="text-center mb-24 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-black text-gradient tracking-tight mb-6">时光长廊</h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest leading-relaxed">
            Beautiful moments frozen in time
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-12 bg-white/40 p-2 rounded-[2rem] border border-white max-w-fit mx-auto backdrop-blur-md">
            {['all', '生活', '旅行', '美食', '纪念'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === cat
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                  : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                {cat === 'all' ? 'Everything' : cat}
              </button>
            ))}
          </div>
        </header>

        <div className="relative">
          {/* 时光轴主体连线 */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 md:-translate-x-1/2 timeline-line opacity-20 hidden md:block"></div>

          <div className="space-y-12 md:space-y-24">
            {events.map((event, idx) => {
              const isEven = idx % 2 === 0
              const config = categoryConfigs[event.category] || categoryConfigs.default!

              return (
                <div key={event.id} className={`relative flex flex-col md:flex-row items-center animate-slide-up ${isEven ? 'md:flex-row-reverse' : ''}`} style={{ animationDelay: `${idx * 0.1}s` }}>
                  {/* 内容卡片 */}
                  <div className={`w-full md:w-[45%] flex flex-col ${isEven ? 'md:items-start' : 'md:items-end'}`}>
                    <div className="premium-card p-10 group w-full max-w-lg">
                      <div className="flex items-center gap-3 mb-6">
                        <span className="premium-badge">
                          {event.date ? new Date(event.date).toLocaleDateString() : 'SOMEDAY'}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-900 text-white`}>
                          {event.category}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 mb-3 group-hover:text-primary transition-colors tracking-tight">{event.title}</h3>
                      <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6 italic opacity-80 line-clamp-3">"{event.description}"</p>
                      {event.location && (
                        <div className="flex items-center gap-2 text-slate-400 group-hover:text-primary transition-colors">
                          <Icon name="location_on" size={14} className="text-primary/40" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 中间圆圈 - 增强发光和连接感 */}
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center p-1.5 bg-white border border-slate-100 rounded-full z-10 shadow-xl">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 border border-slate-100 shadow-inner`}>
                      <Icon name={config.icon} size={14} className="text-slate-400" />
                    </div>
                  </div>

                  {/* 图片展示 */}
                  <div className={`w-full md:w-[45%] mt-8 md:mt-0 ${isEven ? 'md:pl-12' : 'md:pr-12'}`}>
                    {event.images && event.images.length > 0 && (
                      <div
                        className={`rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white transform transition-all duration-700 hover:scale-110 hover:rotate-0 cursor-pointer ${isEven ? 'rotate-2' : '-rotate-2'}`}
                        onClick={() => {
                          setCurrentImages(event.images || [])
                          setCurrentImageIndex(0)
                          setImageModalOpen(true)
                        }}
                      >
                        <LazyImage
                          alt={event.title}
                          className="w-full h-64 object-cover"
                          src={getThumbnailUrl(event.images[0] || '', 800)}
                        />
                        {event.images.length > 1 && (
                          <div className="absolute bottom-4 right-4 bg-black/50 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-2xl backdrop-blur-md">
                            +{event.images.length - 1} MORE
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="relative flex flex-col items-center justify-center py-24">
            <div className="w-4 h-4 bg-primary rounded-full shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)] animate-pulse"></div>
            <div className="mt-12 flex gap-3">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-30 transition-all hover:scale-110 active:scale-95"
              >
                <Icon name="chevron_left" size={24} />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-14 h-14 rounded-2xl transition-all text-sm font-black ${currentPage === i + 1
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                    : 'bg-white text-gray-400 hover:text-primary'
                    }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-30 transition-all hover:scale-110 active:scale-95"
              >
                <Icon name="chevron_right" size={24} />
              </button>
            </div>
          </div>
        </div>
      </main>

      <ImageModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        images={currentImages}
        currentIndex={currentImageIndex}
        onPrevious={() => setCurrentImageIndex(prev => (prev - 1 + currentImages.length) % currentImages.length)}
        onNext={() => setCurrentImageIndex(prev => (prev + 1) % currentImages.length)}
        onJumpTo={setCurrentImageIndex}
      />
    </div>
  )
}
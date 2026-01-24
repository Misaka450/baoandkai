import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../services/apiService'
import type { TimelineEvent } from '../types'
import ImageModal from '../components/ImageModal'
import Icon, { IconName } from '../components/icons/Icons'

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
  '生活': { icon: 'favorite', color: 'pink-400' },
  '旅行': { icon: 'flight', color: 'blue-400' },
  '美食': { icon: 'restaurant', color: 'orange-400' },
  '纪念': { icon: 'star', color: 'purple-400' },
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
    }
  })

  const events = timelineData?.data || []
  const totalPages = timelineData?.totalPages || 0

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) return <div className="min-h-screen pt-32 text-center opacity-50">穿越时光中...</div>

  return (
    <div className="min-h-screen bg-background-light text-slate-700 transition-colors duration-300">
      <main className="max-w-6xl mx-auto px-4 pb-20 pt-32">
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">我们的时光长廊</h1>
          <p className="text-slate-500 max-w-2xl mx-auto">碎碎平淡的生活，也是我们闪闪发光的瞬间。</p>

          <div className="flex flex-wrap justify-center gap-4 mt-10">
            {['all', '生活', '旅行', '美食', '纪念'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${filter === cat
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white text-gray-400 hover:text-primary'
                  }`}
              >
                {cat === 'all' ? '全部' : cat}
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
                <div key={event.id} className={`relative flex flex-col md:flex-row items-center ${isEven ? 'md:flex-row-reverse' : ''}`}>
                  {/* 内容卡片 */}
                  <div className={`w-full md:w-[45%] flex flex-col ${isEven ? 'md:items-start' : 'md:items-end'}`}>
                    <div className="bg-white/60 p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group w-full max-w-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                          {event.date ? new Date(event.date).toLocaleDateString() : '未知日期'}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-${config.color?.split('-')[0]}-100 text-${config.color}`}>
                          {event.category}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">{event.title}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed mb-4">{event.description}</p>
                      {event.location && (
                        <div className="flex items-center gap-2 text-primary">
                          <Icon name="location_on" size={14} />
                          <span className="text-xs font-medium">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 中间圆圈 */}
                  <div className="hidden md:absolute md:left-1/2 md:-translate-x-1/2 md:flex items-center justify-center w-12 h-12 bg-white border-4 rounded-full z-10 shadow-lg" style={{ borderColor: `var(--tw-colors-${config.color})` }}>
                    <Icon name={config.icon} size={20} style={{ color: `var(--tw-colors-${config.color})` }} />
                  </div>

                  {/* 图片展示 */}
                  <div className={`w-full md:w-[45%] mt-6 md:mt-0 ${isEven ? 'md:pl-8' : 'md:pr-8'}`}>
                    {event.images && event.images.length > 0 && (
                      <div
                        className={`rounded-2xl overflow-hidden shadow-lg border-4 border-white transform transition-transform duration-300 group-hover:rotate-0 cursor-pointer ${isEven ? 'rotate-2' : '-rotate-3'}`}
                        onClick={() => {
                          setCurrentImages(event.images || [])
                          setCurrentImageIndex(0)
                          setImageModalOpen(true)
                        }}
                      >
                        <img
                          alt={event.title}
                          className="w-full h-48 object-cover"
                          src={event.images[0] || ''}
                        />
                        {event.images.length > 1 && (
                          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                            +{event.images.length - 1}张
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="relative flex flex-col items-center justify-center py-16">
            <div className="w-4 h-4 bg-primary rounded-full shadow-lg shadow-primary/50 animate-pulse"></div>
            <div className="mt-8 flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-30 transition-all"
              >
                <Icon name="chevron_left" size={20} />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-10 h-10 rounded-full transition-all text-sm font-bold ${currentPage === i + 1
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-white text-gray-400 hover:text-primary'
                    }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-30 transition-all"
              >
                <Icon name="chevron_right" size={20} />
              </button>
            </div>
          </div>
        </div>
      </main>

      <ImageModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        imageUrl={currentImages[currentImageIndex]}
      />
    </div>
  )
}
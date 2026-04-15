import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
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
  const [selectedYear, setSelectedYear] = useState<string | null>(null)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [currentImages, setCurrentImages] = useState<string[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showBackToTop, setShowBackToTop] = useState(false)

  // 监听滚动，显示/隐藏返回顶部按钮
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 返回顶部
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const { data: timelineData, isLoading: loading } = useQuery({
    queryKey: ['timeline', currentPage, filter],
    queryFn: async () => {
      const response = await apiService.get<TimelineResponse>(`/timeline?page=${currentPage}&limit=20&category=${filter === 'all' ? '' : filter}`)
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  })

  const events = timelineData?.data || []

  // 提取所有可用年份
  const availableYears = useMemo(() => {
    const years = new Set<string>()
    events.forEach(event => {
      if (event.date) {
        years.add(new Date(event.date).getFullYear().toString())
      }
    })
    return Array.from(years).sort((a, b) => Number(b) - Number(a))
  }, [events])

  // 里程碑事件（纪念类别）
  const milestoneEvents = useMemo(() => {
    return events.filter(event => event.category === '纪念' && (event.images?.length ?? 0) > 0)
  }, [events])

  // 过滤事件（按年份）
  const filteredEvents = useMemo(() => {
    if (!selectedYear) return events
    return events.filter(event => {
      if (!event.date) return false
      return new Date(event.date).getFullYear().toString() === selectedYear
    })
  }, [events, selectedYear])

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

          {/* 年份快捷跳转 */}
          {availableYears.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-8">
              <button
                onClick={() => setSelectedYear(null)}
                className={`px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${
                  selectedYear === null
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'bg-white/80 text-slate-500 hover:bg-white hover:text-slate-700 border border-slate-100'
                }`}
              >
                全部
              </button>
              {availableYears.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${
                    selectedYear === year
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'bg-white/80 text-slate-500 hover:bg-white hover:text-slate-700 border border-slate-100'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          )}

          {/* 分类筛选 */}
          <div className="flex flex-wrap justify-center gap-3 mt-8 bg-white/40 p-2 rounded-[2rem] border border-white max-w-fit mx-auto backdrop-blur-md">
            {['all', '生活', '旅行', '美食', '纪念'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                  filter === cat
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                    : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                {cat === 'all' ? 'Everything' : cat}
              </button>
            ))}
          </div>
        </header>

        {/* 里程碑高亮区域 */}
        {milestoneEvents.length > 0 && !selectedYear && filter === 'all' && (
          <div className="mb-16 animate-slide-up">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-pink-100 flex items-center justify-center shadow-lg">
                <Icon name="star" size={24} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-800">里程碑时刻</h3>
                <p className="text-xs text-slate-400 font-medium">见证我们最重要的瞬间</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {milestoneEvents.slice(0, 4).map((event) => (
                <div
                  key={event.id}
                  className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border-4 border-white cursor-pointer group hover:scale-105 transition-transform duration-500 active:scale-95"
                  onClick={() => {
                    setCurrentImages(event.images || [])
                    setCurrentImageIndex(0)
                    setImageModalOpen(true)
                  }}
                >
                  <LazyImage
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    src={getThumbnailUrl(event.images?.[0] || '', 400)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white text-xs font-black truncate">{event.title}</p>
                    <p className="text-white/70 text-[10px] font-medium">{event.date}</p>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Icon name="star" size={16} className="text-amber-400 fill-current drop-shadow-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
              <Icon name="schedule" size={48} className="text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-400 mb-3">
              {selectedYear ? `${selectedYear}年还没有记录` : '还没有时光轴记录'}
            </h3>
            <p className="text-slate-300 text-sm max-w-md mx-auto">
              {selectedYear ? '选择其他年份查看，或创建新的时光轴事件' : '在管理后台创建第一个时光轴事件，记录你们的美好时刻'}
            </p>
            {selectedYear && (
              <button
                onClick={() => setSelectedYear(null)}
                className="mt-6 px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:bg-primary/90 transition-all active:scale-95"
              >
                查看全部记录
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            {/* 时光轴主体连线 */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 md:-translate-x-1/2 timeline-line opacity-20 hidden md:block"></div>

            <div className="space-y-12 md:space-y-24">
              {filteredEvents.map((event, idx) => {
                const isEven = idx % 2 === 0
                const config = categoryConfigs[event.category] || categoryConfigs.default!
                const isMilestone = event.category === '纪念'
                const isOldest = idx === filteredEvents.length - 1

                return (
                  <div key={event.id} className={`relative flex flex-col md:flex-row items-center animate-slide-up ${isEven ? 'md:flex-row-reverse' : ''}`} style={{ animationDelay: `${idx * 0.1}s` }}>
                    {/* 内容卡片 */}
                    <div className={`w-full md:w-[45%] flex flex-col ${isEven ? 'md:items-start' : 'md:items-end'}`}>
                      <div className={`premium-card p-10 group w-full max-w-lg hover-card ${isMilestone ? 'ring-2 ring-amber-200' : ''} ${isOldest ? 'ring-4 ring-primary shadow-2xl shadow-primary/10' : ''}`}>
                        {isMilestone && !isOldest && (
                          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shadow-lg">
                            <Icon name="star" size={16} className="text-amber-500" />
                          </div>
                        )}
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

                    {/* 中间圆圈 */}
                    <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center p-1.5 bg-white border border-slate-100 rounded-full z-10 shadow-xl">
                      {isOldest ? (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-primary flex items-center justify-center shadow-lg shadow-primary/30 ring-4 ring-white">
                          <Icon name="favorite" size={18} className="text-white" />
                        </div>
                      ) : (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 border border-slate-100 shadow-inner`}>
                          <Icon name={config.icon} size={14} className="text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* 图片展示 */}
                    <div className={`w-full md:w-[45%] mt-8 md:mt-0 ${isEven ? 'md:pl-12' : 'md:pr-12'}`}>
                      {event.images && event.images.length > 0 && (
                        <div
                          className={`rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white transform transition-all duration-700 hover:scale-110 hover:rotate-0 cursor-pointer hover-card ${isEven ? 'rotate-2' : '-rotate-2'}`}
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

            {/* 分页 */}
            {totalPages > 1 && (
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
                      className={`w-14 h-14 rounded-2xl transition-all text-sm font-black active:scale-95 ${currentPage === i + 1
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
            )}
          </div>
        )}
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

      {/* 返回顶部按钮 */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon name="chevron_up" size={24} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

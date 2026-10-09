import { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { apiService } from '../services/apiService'
import { getThumbnailUrl } from '../utils/imageUtils'
import type { TimelineEvent } from '../types'
import ImageModal from '../components/modals/ImageModal'
import Icon, { IconName } from '../components/icons/Icons'
import { Skeleton, TimelineSkeleton } from '../components/common/Skeleton'
import LazyImage from '../components/common/LazyImage'
import { formatDate } from '../utils/common'

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
  '日常': { icon: 'favorite', color: 'morandi-pink' },
  '旅行': { icon: 'flight', color: 'morandi-blue' },
  '纪念': { icon: 'star', color: 'morandi-purple' },
  '纪念日': { icon: 'star', color: 'morandi-purple' },
  '特别时刻': { icon: 'celebration', color: 'primary' },
  '其他': { icon: 'auto_awesome', color: 'primary' },
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

  const events = useMemo(() => timelineData?.data || [], [timelineData?.data])

  // 提取所有可用年份
  const availableYears = useMemo(() => {
    const years = new Set<string>()
    events.forEach(event => {
      if (event.date) {
        years.add(event.date.substring(0, 4))
      }
    })
    return Array.from(years).sort((a, b) => Number(b) - Number(a))
  }, [events])

  // 里程碑事件（纪念类别）
  const milestoneEvents = useMemo(() => {
    return events.filter(
      event => ['纪念', '纪念日', '特别时刻'].includes(event.category) && (event.images?.length ?? 0) > 0
    )
  }, [events])

  // 过滤事件（按年份）
  const filteredEvents = useMemo(() => {
    if (!selectedYear) return events
    return events.filter(event => {
      if (!event.date) return false
      return event.date.substring(0, 4) === selectedYear
    })
  }, [events, selectedYear])

  const totalPages = timelineData?.totalPages || 0

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) return (
    <div className="min-h-screen pt-20 md:pt-40 max-w-6xl mx-auto px-3.5 md:px-6">
      <div className="text-center mb-8 md:mb-16">
        <Skeleton className="h-8 md:h-12 w-48 md:w-64 mx-auto mb-2 md:mb-4" />
        <Skeleton className="h-3 md:h-4 w-32 md:w-48 mx-auto" />
      </div>
      <TimelineSkeleton />
    </div>
  )

  return (
    <div className="min-h-screen text-slate-700 transition-colors duration-300">
      <main className="max-w-6xl mx-auto px-3.5 md:px-6 pb-20 md:pb-32 pt-20 md:pt-40 relative">
        <header className="text-center mb-8 md:mb-16 animate-fade-in">
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-gradient tracking-tight mb-1.5 md:mb-6">时光长廊</h1>
          <p className="text-slate-400 font-bold text-[11px] md:text-sm uppercase tracking-widest leading-relaxed mb-4 md:mb-8">
            Beautiful moments frozen in time
          </p>

          {/* 年份快捷跳转 */}
          {availableYears.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 mt-3 sm:mt-4 md:mt-8">
              <button
                onClick={() => setSelectedYear(null)}
                className={`px-2.5 py-1 sm:px-3.5 sm:py-1.5 md:px-5 md:py-2 rounded-xl md:rounded-2xl text-[10px] sm:text-[11px] md:text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${
                  selectedYear === null
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-white/80 text-slate-500 hover:bg-white hover:text-slate-700 border border-slate-100'
                }`}
              >
                全部
              </button>
              {availableYears.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-2.5 py-1 sm:px-3.5 sm:py-1.5 md:px-5 md:py-2 rounded-xl md:rounded-2xl text-[10px] sm:text-[11px] md:text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${
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
          <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5 md:gap-3 mt-2.5 sm:mt-4 md:mt-8 bg-white/40 p-1 sm:p-1.5 md:p-2 rounded-xl sm:rounded-2xl md:rounded-[2rem] border border-white max-w-fit mx-auto backdrop-blur-md">
            {['all', '日常', '旅行', '纪念日', '特别时刻', '其他'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-2.5 py-1 sm:px-3.5 sm:py-1.5 md:px-6 md:py-2.5 rounded-lg sm:rounded-xl md:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider md:tracking-widest transition-all active:scale-95 ${
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
          <div className="mb-6 md:mb-16 animate-slide-up">
            <div className="flex items-center gap-2.5 sm:gap-4 mb-3 sm:mb-6">
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-100 to-pink-100 flex items-center justify-center shadow-md sm:shadow-lg shrink-0">
                <Icon name="star" size={20} className="text-amber-500 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-lg font-black text-slate-800">里程碑时刻</h3>
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium">见证我们最重要的瞬间</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
              {milestoneEvents.slice(0, 4).map((event) => (
                <div
                  key={event.id}
                  className="relative aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden shadow-md sm:shadow-xl border-2 sm:border-4 border-white cursor-pointer group hover:scale-105 transition-transform duration-500 active:scale-95"
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
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-4">
                    <p className="text-white text-[11px] sm:text-xs font-black truncate">{event.title}</p>
                    <p className="text-white/70 text-[9px] sm:text-[10px] font-medium">{event.date}</p>
                  </div>
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                    <Icon name="star" size={14} className="text-amber-400 fill-current drop-shadow-lg sm:w-4 sm:h-4" />
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
            {/* 移动端左侧极细浅色连线 */}
            <div className="absolute left-3.5 sm:left-4 top-2 bottom-2 w-[1.5px] timeline-line opacity-25 md:hidden pointer-events-none"></div>
            {/* 桌面端居中轴线 */}
            <div className="absolute md:left-1/2 top-0 bottom-0 w-1 md:-translate-x-1/2 timeline-line opacity-20 hidden md:block"></div>

            <div className="space-y-4 sm:space-y-6 md:space-y-24">
              {filteredEvents.map((event, idx) => {
                const isEven = idx % 2 === 0
                const config = categoryConfigs[event.category] || categoryConfigs.default!
                const isMilestone = ['纪念', '纪念日', '特别时刻'].includes(event.category)
                const isOldest = idx === filteredEvents.length - 1
                const hasImages = Boolean(event.images && event.images.length > 0)

                return (
                  <div key={event.id} className={`relative flex flex-col md:flex-row items-stretch md:items-center content-auto animate-slide-up pl-8 sm:pl-10 md:pl-0 ${isEven ? 'md:flex-row-reverse' : ''}`} style={{ animationDelay: `${Math.min(idx * 0.05, 0.5)}s` }}>
                    {/* 移动端微型时间节点图标（与左侧连线垂直居中对齐） */}
                    <div className="md:hidden absolute left-0.5 sm:left-1 top-4 -translate-y-1/2 z-10">
                      {isOldest ? (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-primary flex items-center justify-center shadow-md shadow-primary/30 ring-2 ring-white">
                          <Icon name="favorite" size={12} className="text-white" />
                        </div>
                      ) : isMilestone ? (
                        <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shadow-sm ring-2 ring-white">
                          <Icon name="star" size={12} className="text-amber-500 fill-current" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-white border border-slate-200/80 flex items-center justify-center shadow-sm ring-2 ring-white">
                          <Icon name={config.icon} size={11} className="text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* 内容卡片 */}
                    <div className={`w-full md:w-[45%] flex flex-col ${isEven ? 'md:items-start' : 'md:items-end'}`}>
                      <div className={`premium-card p-3.5 sm:p-5 md:p-10 group w-full md:max-w-lg hover-card ${isMilestone ? 'ring-2 ring-amber-200' : ''} ${isOldest ? 'ring-2 sm:ring-4 ring-primary shadow-xl sm:shadow-2xl shadow-primary/10' : ''}`}>
                        {isMilestone && !isOldest && (
                          <div className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-amber-100 flex items-center justify-center shadow-md sm:shadow-lg">
                            <Icon name="star" size={13} className="text-amber-500 sm:w-4 sm:h-4" />
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-3">
                          {/* 左侧文字主体 */}
                          <div className="flex-1 min-w-0">
                            {/* 顶部徽章行 */}
                            <div className="flex items-center gap-1.5 md:gap-3 mb-2 md:mb-6 flex-wrap">
                              <span className="premium-badge text-[9px] sm:text-[10px] px-2 py-0.5 sm:px-3 sm:py-1">
                                {event.date ? formatDate(event.date, 'short') : 'SOMEDAY'}
                              </span>
                              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-slate-900 text-white">
                                {event.category}
                              </span>
                            </div>

                            {/* 标题 */}
                            <h3 className="text-sm sm:text-base md:text-2xl font-black text-slate-800 mb-1.5 md:mb-3 group-hover:text-primary transition-colors tracking-tight line-clamp-2 md:line-clamp-none">
                              {event.title}
                            </h3>

                            {/* 描述文本 */}
                            <p className="text-slate-500 font-medium text-xs sm:text-sm leading-relaxed mb-2 md:mb-6 italic opacity-80 line-clamp-2 md:line-clamp-3">
                              "{event.description}"
                            </p>

                            {/* 地点元数据 */}
                            {event.location && (
                              <div className="flex items-center gap-1.5 md:gap-2 text-slate-400 group-hover:text-primary transition-colors">
                                <Icon name="location_on" size={12} className="text-primary/40 sm:w-3.5 sm:h-3.5" />
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest truncate">{event.location}</span>
                              </div>
                            )}
                          </div>

                          {/* 移动端精致右侧缩略图 */}
                          {hasImages && (
                            <div
                              className="md:hidden relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 shadow-sm border-2 border-white cursor-pointer active:scale-95 transition-transform"
                              onClick={() => {
                                setCurrentImages(event.images || [])
                                setCurrentImageIndex(0)
                                setImageModalOpen(true)
                              }}
                            >
                              <LazyImage
                                alt={event.title}
                                className="w-full h-full object-cover"
                                src={getThumbnailUrl(event.images![0] || '', 200)}
                              />
                              {event.images!.length > 1 && (
                                <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full backdrop-blur-xs">
                                  +{event.images!.length - 1}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 中间圆圈（桌面端） */}
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

                    {/* 图片展示（桌面端） */}
                    <div className={`hidden md:block w-full md:w-[45%] mt-8 md:mt-0 ${isEven ? 'md:pl-12' : 'md:pr-12'}`}>
                      {hasImages && (
                        <div
                          className={`rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white transform transition-all duration-700 hover:scale-110 hover:rotate-0 cursor-pointer hover-card ${isEven ? 'md:rotate-2' : 'md:-rotate-2'}`}
                          onClick={() => {
                            setCurrentImages(event.images || [])
                            setCurrentImageIndex(0)
                            setImageModalOpen(true)
                          }}
                        >
                          <LazyImage
                            alt={event.title}
                            className="w-full h-64 object-cover"
                            src={getThumbnailUrl(event.images![0] || '', 800)}
                          />
                          {event.images!.length > 1 && (
                            <div className="absolute bottom-4 right-4 bg-black/50 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-2xl backdrop-blur-md">
                              +{event.images!.length - 1} MORE
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
              <div className="relative flex flex-col items-center justify-center py-12 md:py-24">
                <div className="w-4 h-4 bg-primary rounded-full shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)] animate-pulse"></div>
                <div className="mt-8 md:mt-12 flex gap-2 md:gap-3 flex-wrap justify-center">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-30 transition-all hover:scale-105 md:hover:scale-110 active:scale-95"
                  >
                    <Icon name="chevron_left" size={18} className="md:w-6 md:h-6" />
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i + 1)}
                      className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl transition-all text-xs md:text-sm font-black active:scale-95 ${currentPage === i + 1
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
                    className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-primary disabled:opacity-30 transition-all hover:scale-105 md:hover:scale-110 active:scale-95"
                  >
                    <Icon name="chevron_right" size={18} className="md:w-6 md:h-6" />
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
            className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-5 md:right-8 w-11 h-11 md:w-14 md:h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
          >
            <Icon name="chevron_up" size={20} className="md:w-6 md:h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

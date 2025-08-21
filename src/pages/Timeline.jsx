import { useState, useEffect } from 'react'
import { Calendar, MapPin, Tag, Plus, Heart, Camera, Star, Clock, Clock as TimelineIcon } from 'lucide-react'
import { apiService } from '../services/apiService'
import ImageModal from '../components/ImageModal'
import { formatDate, LoadingSpinner } from '../utils/common.js'

export default function Timeline() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selectedImage, setSelectedImage] = useState(null)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [currentImages, setCurrentImages] = useState([])

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const { data } = await apiService.get('/api/timeline')
      setEvents(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('获取时间轴事件失败:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', '约会', '旅行', '节日', '日常']

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(event => event.category === filter)

  const categoryColors = {
    '约会': 'from-rose-50 to-rose-100 text-rose-700 border-rose-200',
    '旅行': 'from-sky-50 to-sky-100 text-sky-700 border-sky-200',
    '节日': 'from-amber-50 to-amber-100 text-amber-700 border-amber-200',
    '日常': 'from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200'
  }

  const categoryIcons = {
    '约会': Heart,
    '旅行': Camera,
    '节日': Star,
    '日常': Clock
  }

  // 使用统一的加载组件
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <TimelineIcon className="w-12 h-12 text-stone-800 mx-auto mb-4" />
            <h1 className="text-4xl font-light text-stone-800 mb-4">我们的爱情足迹</h1>
            <p className="text-stone-600 font-light mb-8">记录每一个值得纪念的瞬间</p>
            <LoadingSpinner message="正在加载时间轴..." />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <TimelineIcon className="w-12 h-12 text-stone-800 mx-auto mb-4" />
          <h1 className="text-4xl font-light text-stone-800 mb-4">我们的爱情足迹</h1>
          <p className="text-stone-600 font-light">记录每一个值得纪念的瞬间</p>
        </div>

        <div className="mb-8 flex flex-wrap gap-3 justify-center">
          {categories.map(category => {
            const Icon = categoryIcons[category] || Tag
            return (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`flex items-center px-4 py-2 rounded-full text-sm font-light transition-all duration-300 ${
                  filter === category
                    ? 'bg-stone-800 text-white shadow-lg'
                    : 'bg-white/70 text-stone-600 hover:bg-white hover:shadow-md'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {category === 'all' ? '全部' : category}
              </button>
            )
          })}
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* 时间轴线 - 调整位置 */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-stone-200 via-stone-300 to-stone-200"></div>

          <div className="space-y-16">
            {filteredEvents.map((event, index) => {
              const Icon = categoryIcons[event.category] || Tag
              const colorClass = categoryColors[event.category] || 'from-stone-50 to-stone-100 text-stone-700 border-stone-200'
              
              return (
                <div key={event.id} className="relative">
                  {/* 时间点 - 调整位置 */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-0.5 z-10">
                    <div className={`w-5 h-5 rounded-full bg-white border-2 ${filter === event.category || filter === 'all' ? 'border-stone-600' : 'border-stone-300'} shadow-lg transition-all duration-300 hover:scale-110`}></div>
                  </div>

                  {/* 卡片容器 - 增加间距 */}
                  <div className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                    <div className={`w-full md:w-[calc(50%-3rem)] ${index % 2 === 0 ? 'md:pr-8 pr-0' : 'md:pl-8 pl-0'}`}>
                      {/* 卡片 */}
                      <div className={`backdrop-blur-sm ${colorClass} border border-white/20 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)] transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02]`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center mb-3">
                              <div className={`p-2.5 rounded-xl bg-white/60 backdrop-blur-sm mr-3 shadow-sm`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <span className="text-xs font-medium tracking-wide uppercase opacity-75">{event.category}</span>
                            </div>
                            
                            <h3 className="text-lg font-light text-stone-800 mb-3 leading-relaxed tracking-wide">{event.title}</h3>
                            
                            <div className="flex items-center text-xs text-stone-600 space-x-4 font-light">
                              <span className="flex items-center">
                                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                {/* 使用公共日期格式化函数 */}
                                {formatDate(event.date)}
                              </span>
                              {event.location && (
                                <span className="flex items-center">
                                  <MapPin className="h-3.5 w-3.5 mr-1.5" />
                                  {event.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-stone-700 mb-5 font-light leading-relaxed text-sm opacity-90">{event.description}</p>
                        
                        {event.images && event.images.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                            {event.images.map((image, imgIndex) => (
                              <div key={imgIndex} className="relative group overflow-hidden rounded-xl cursor-pointer"
                                   onClick={() => {
                                     setCurrentImages(event.images)
                                     setCurrentImageIndex(imgIndex)
                                     setImageModalOpen(true)
                                   }}>
                                <img
                                  src={image}
                                  alt={`${event.title} - ${imgIndex + 1}`}
                                  className="rounded-xl object-cover h-28 w-full transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <div className="bg-black/50 backdrop-blur-sm text-white rounded-full p-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 max-w-sm mx-auto border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
              <Calendar className="w-16 h-16 text-stone-400 mx-auto mb-4" />
              <h3 className="text-lg font-light text-stone-700 mb-2">暂无记录</h3>
              <p className="text-sm text-stone-500 font-light">还没有添加任何时间轴事件，让我们开始记录美好时光吧！</p>
            </div>
          </div>
        )}

      </div>

      <ImageModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        imageUrl={currentImages[currentImageIndex]}
        images={currentImages}
        currentIndex={currentImageIndex}
        onNext={() => setCurrentImageIndex((prev) => (prev + 1) % currentImages.length)}
        onPrev={() => setCurrentImageIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length)}
      />
    </div>
  )
}
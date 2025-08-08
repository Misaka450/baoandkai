import { useState, useEffect } from 'react'
import { Calendar, MapPin, Tag, Plus, Heart, Camera, Star, Clock } from 'lucide-react'
import { apiRequest } from '../utils/api'

export default function Timeline() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const data = await apiRequest('/api/timeline')
      setEvents(data)
    } catch (error) {
      console.error('获取时间轴事件失败:', error)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-stone-200 rounded w-1/2 mx-auto"></div>
              <div className="h-4 bg-stone-200 rounded w-1/3 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
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

        <div className="relative">
          {/* 时间轴线 */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-stone-200 via-stone-300 to-stone-200"></div>

          <div className="space-y-12">
            {filteredEvents.map((event, index) => {
              const Icon = categoryIcons[event.category] || Tag
              const colorClass = categoryColors[event.category] || 'from-stone-50 to-stone-100 text-stone-700 border-stone-200'
              
              return (
                <div key={event.id} className="relative">
                  {/* 时间点 */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-2">
                    <div className={`w-4 h-4 rounded-full bg-white border-2 ${filter === event.category || filter === 'all' ? 'border-stone-800' : 'border-stone-300'} shadow-lg`}></div>
                  </div>

                  {/* 卡片 */}
                  <div className={`ml-0 md:ml-8 md:mr-0 mr-0 md:w-[calc(50%-2rem)] w-full bg-gradient-to-br ${colorClass} border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${index % 2 === 0 ? 'md:ml-auto md:mr-8' : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <div className={`p-2 rounded-full bg-white/50 mr-3`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-light opacity-80">{event.category}</span>
                        </div>
                        
                        <h3 className="text-xl font-light text-stone-800 mb-2 leading-relaxed">{event.title}</h3>
                        
                        <div className="flex items-center text-sm text-stone-600 space-x-4 font-light">
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(event.date).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                          {event.location && (
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-stone-700 mb-4 font-light leading-relaxed">{event.description}</p>
                    
                    {event.images && event.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {event.images.map((image, imgIndex) => (
                          <div key={imgIndex} className="relative group">
                            <img
                              src={image}
                              alt={`${event.title} - ${imgIndex + 1}`}
                              className="rounded-xl object-cover h-32 w-full transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-12 max-w-md mx-auto">
              <Camera className="h-16 w-16 text-stone-400 mx-auto mb-4" />
              <h3 className="text-xl font-light text-stone-700 mb-2">还没有记录任何瞬间</h3>
              <p className="text-stone-500 font-light">开始记录你们的第一个美好时刻吧</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
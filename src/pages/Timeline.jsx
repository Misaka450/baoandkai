import { useState, useEffect } from 'react'
import { Calendar, MapPin, Tag, Plus } from 'lucide-react'
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">加载中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">我们的爱情足迹</h1>
        <p className="text-gray-600">记录每一个值得纪念的瞬间</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 justify-center">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === category
                ? 'bg-pink-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {category === 'all' ? '全部' : category}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {filteredEvents.map((event, index) => (
          <div key={event.id} className="glass-card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{event.title}</h3>
                <div className="flex items-center text-sm text-gray-600 space-x-4">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(event.date).toLocaleDateString('zh-CN')}
                  </span>
                  {event.location && (
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {event.location}
                    </span>
                  )}
                  <span className="flex items-center">
                    <Tag className="h-4 w-4 mr-1" />
                    {event.category}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-gray-700 mb-4">{event.description}</p>
            
            {event.images && event.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {event.images.map((image, imgIndex) => (
                  <img
                    key={imgIndex}
                    src={image}
                    alt={`${event.title} - ${imgIndex + 1}`}
                    className="rounded-lg object-cover h-32 w-full"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">还没有记录任何事件</p>
        </div>
      )}
    </div>
  )
}
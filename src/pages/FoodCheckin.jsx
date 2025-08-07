import { useState, useEffect } from 'react'
import { MapPin, Star, Utensils, DollarSign, Calendar } from 'lucide-react'

export default function FoodCheckin() {
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')

  useEffect(() => {
    fetchCheckins()
  }, [])

  const fetchCheckins = async () => {
    try {
      const response = await fetch('/api/food-checkins')
      if (response.ok) {
        const data = await response.json()
        setCheckins(data)
      }
    } catch (error) {
      console.error('获取美食打卡失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const cuisines = ['all', '中餐', '西餐', '日料', '韩料', '火锅', '烧烤', '甜品', '其他']

  const filteredAndSortedCheckins = checkins
    .filter(checkin => filter === 'all' || checkin.cuisine === filter)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date) - new Date(a.date)
      } else if (sortBy === 'rating') {
        return b.overall_rating - a.overall_rating
      }
      return 0
    })

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">加载中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">美食打卡</h1>
        <p className="text-gray-600">记录我们一起品尝的每一道美食</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-4 justify-center">
        <div className="flex flex-wrap gap-2">
          {cuisines.map(cuisine => (
            <button
              key={cuisine}
              onClick={() => setFilter(cuisine)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === cuisine
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {cuisine === 'all' ? '全部' : cuisine}
            </button>
          ))}
        </div>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 rounded-full text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          <option value="date">按时间排序</option>
          <option value="rating">按评分排序</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedCheckins.map((checkin) => (
          <div key={checkin.id} className="glass-card overflow-hidden">
            {checkin.images && checkin.images.length > 0 && (
              <div className="aspect-video">
                <img
                  src={checkin.images[0]}
                  alt={checkin.restaurant_name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {checkin.restaurant_name}
              </h3>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="truncate">{checkin.address}</span>
                </div>
                
                <div className="flex items-center">
                  <Utensils className="h-4 w-4 mr-1" />
                  <span>{checkin.cuisine}</span>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{new Date(checkin.date).toLocaleDateString('zh-CN')}</span>
                </div>
                
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  <span>{checkin.price_range}</span>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center">
                  <span className="text-sm mr-2">综合评分:</span>
                  <div className="flex">{renderStars(checkin.overall_rating)}</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span>口味</span>
                    <div className="flex">{renderStars(checkin.taste_rating)}</div>
                  </div>
                  <div>
                    <span>环境</span>
                    <div className="flex">{renderStars(checkin.environment_rating)}</div>
                  </div>
                  <div>
                    <span>服务</span>
                    <div className="flex">{renderStars(checkin.service_rating)}</div>
                  </div>
                </div>
              </div>

              {checkin.recommended_dishes && (
                <div className="mt-3">
                  <span className="text-sm font-medium text-gray-700">推荐菜品:</span>
                  <p className="text-sm text-gray-600 mt-1">
                    {checkin.recommended_dishes.join('、')}
                  </p>
                </div>
              )}

              {checkin.description && (
                <div className="mt-3">
                  <span className="text-sm font-medium text-gray-700">评价:</span>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {checkin.description}
                  </p>
                </div>
              )}

              {checkin.images && checkin.images.length > 1 && (
                <div className="mt-3 grid grid-cols-3 gap-1">
                  {checkin.images.slice(1, 4).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`美食图片 ${index + 2}`}
                      className="rounded object-cover h-16 w-full"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedCheckins.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">还没有美食打卡记录</p>
        </div>
      )}
    </div>
  )
}
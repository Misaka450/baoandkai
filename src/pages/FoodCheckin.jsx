import { useState, useEffect } from 'react'
import { MapPin, Star, Utensils, DollarSign, Calendar } from 'lucide-react'
import { apiRequest } from '../utils/api'

export default function FoodCheckin() {
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')

  useEffect(() => {
    fetchCheckins()
  }, [])

  const fetchCheckins = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiRequest('/api/food')
      console.log('美食数据:', data)
      setCheckins(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('获取美食打卡失败:', error)
      setError('获取美食打卡失败: ' + error.message)
      setCheckins([])
    } finally {
      setLoading(false)
    }
  }

  const cuisines = ['all', '中餐', '西餐', '日料', '韩料', '火锅', '烧烤', '甜品', '其他']

  const filteredAndSortedCheckins = checkins
    .filter(checkin => {
      if (!checkin) return false
      return filter === 'all' || checkin.cuisine === filter
    })
    .sort((a, b) => {
      if (!a || !b) return 0
      try {
        if (sortBy === 'date') {
          return new Date(b.date || 0) - new Date(a.date || 0)
        } else if (sortBy === 'rating') {
          return (b.overall_rating || 0) - (a.overall_rating || 0)
        }
      } catch (e) {
        console.error('排序错误:', e)
      }
      return 0
    })

  const renderStars = (rating) => {
    const numRating = Number(rating) || 0
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < numRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️ {error}</div>
          <button 
            onClick={fetchCheckins}
            className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
          >
            重新加载
          </button>
        </div>
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
        {filteredAndSortedCheckins.map((checkin) => {
          if (!checkin || !checkin.id) return null
          
          return (
            <div key={checkin.id} className="glass-card overflow-hidden">
              {checkin.images && checkin.images.length > 0 && (
                <div className="aspect-video">
                  <img
                    src={checkin.images[0]}
                    alt={checkin.restaurant_name || '餐厅图片'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                </div>
              )}
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {checkin.restaurant_name || '未知餐厅'}
                </h3>
                
                <div className="space-y-2 text-sm text-gray-600">
                  {checkin.address && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="truncate">{checkin.address}</span>
                    </div>
                  )}
                  
                  {checkin.cuisine && (
                    <div className="flex items-center">
                      <Utensils className="h-4 w-4 mr-1" />
                      <span>{checkin.cuisine}</span>
                    </div>
                  )}
                  
                  {checkin.date && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{new Date(checkin.date).toLocaleDateString('zh-CN')}</span>
                    </div>
                  )}
                  
                  {checkin.price_range && (
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span>{checkin.price_range}</span>
                    </div>
                  )}
                </div>

                {checkin.overall_rating && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center">
                      <span className="text-sm mr-2">综合评分:</span>
                      <div className="flex">{renderStars(checkin.overall_rating)}</div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {checkin.taste_rating && (
                        <div>
                          <span>口味</span>
                          <div className="flex">{renderStars(checkin.taste_rating)}</div>
                        </div>
                      )}
                      {checkin.environment_rating && (
                        <div>
                          <span>环境</span>
                          <div className="flex">{renderStars(checkin.environment_rating)}</div>
                        </div>
                      )}
                      {checkin.service_rating && (
                        <div>
                          <span>服务</span>
                          <div className="flex">{renderStars(checkin.service_rating)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {checkin.recommended_dishes && (
                  <div className="mt-3">
                    <span className="text-sm font-medium text-gray-700">推荐菜品:</span>
                    <p className="text-sm text-gray-600 mt-1">
                      {Array.isArray(checkin.recommended_dishes) 
                        ? checkin.recommended_dishes.join('、') 
                        : checkin.recommended_dishes}
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
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredAndSortedCheckins.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <Utensils className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>还没有美食打卡记录</p>
            <p className="text-sm mt-2">快来添加你们的第一道美食回忆吧！</p>
          </div>
        </div>
      )}
    </div>
  )
}
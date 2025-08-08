import { useState, useEffect } from 'react'
import { Utensils, Star } from 'lucide-react'
import { apiRequest } from '../utils/api'

export default function FoodCheckin() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRestaurants()
  }, [])

  const fetchRestaurants = async () => {
    try {
      const data = await apiRequest('/api/restaurants')
      setRestaurants(data)
    } catch (error) {
      console.error('获取餐厅失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryColor = (category) => {
    const colors = {
      '中餐': 'bg-amber-100 text-amber-800 border-amber-200',
      '西餐': 'bg-stone-100 text-stone-800 border-stone-200',
      '日料': 'bg-slate-100 text-slate-800 border-slate-200',
      '韩料': 'bg-rose-100 text-rose-800 border-rose-200',
      '甜品': 'bg-pink-100 text-pink-800 border-pink-200',
      '咖啡': 'bg-amber-100 text-amber-800 border-amber-200',
      '其他': 'bg-stone-100 text-stone-800 border-stone-200'
    }
    return colors[category] || colors['其他']
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-amber-500 fill-amber-500' : 'text-stone-300'
        }`}
      />
    ))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-flex flex-col items-center space-y-3">
              <div className="animate-pulse">
                <div className="h-2 bg-stone-200 rounded-full w-48 mb-4"></div>
                <div className="h-1.5 bg-stone-200 rounded-full w-32"></div>
              </div>
              <div className="mt-8 space-y-4 w-full max-w-md">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-stone-200 rounded w-3/4"></div>
                      <div className="h-3 bg-stone-200 rounded w-1/2"></div>
                      <div className="flex space-x-2 mt-3">
                        <div className="h-6 bg-stone-200 rounded-full w-16"></div>
                        <div className="h-6 bg-stone-200 rounded-full w-20"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-stone-800 mb-4">美食足迹</h1>
          <p className="text-stone-600 font-light">一起品尝过的每一道美味</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {restaurants.map((restaurant) => (
            <div
              key={restaurant.id}
              className="backdrop-blur-sm bg-white/60 border border-white/20 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)] transition-all duration-500 hover:-translate-y-1"
            >
              <div className="aspect-video rounded-2xl overflow-hidden mb-4">
                <img
                  src={restaurant.image_url || '/placeholder-food.jpg'}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="space-y-3">
                <div>
                  <h3 className="text-xl font-light text-stone-800">{restaurant.name}</h3>
                  <p className="text-sm text-stone-600 font-light">{restaurant.address}</p>
                </div>
                
                <div className="flex items-center space-x-1">
                  {renderStars(restaurant.rating || 0)}
                  <span className="text-sm text-stone-600 ml-2 font-light">
                    {restaurant.rating || 0} 分
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {(restaurant.categories || []).map((category) => (
                    <span
                      key={category}
                      className={`px-3 py-1 rounded-full text-xs font-light border ${getCategoryColor(category)}`}
                    >
                      {category}
                    </span>
                  ))}
                </div>
                
                {restaurant.comment && (
                  <p className="text-sm text-stone-600 font-light leading-relaxed">
                    {restaurant.comment}
                  </p>
                )}
                
                <div className="text-xs text-stone-500 font-light">
                  {new Date(restaurant.visited_date).toLocaleDateString('zh-CN')}
                </div>
              </div>
            </div>
          ))}
        </div>

        {restaurants.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center">
                <Utensils className="h-8 w-8 text-stone-400" />
              </div>
              <div>
                <h3 className="text-lg font-light text-stone-800 mb-2">还没有美食记录</h3>
                <p className="text-sm text-stone-600 font-light">开始记录你们的美食之旅吧</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
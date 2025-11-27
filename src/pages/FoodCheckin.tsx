import React, { useState, useEffect } from 'react'
import { MapPin, Star, Utensils, DollarSign, Calendar, Smile, Coffee, Heart, Utensils as FoodIcon } from 'lucide-react'
import { apiService } from '../services/apiService'
import ImageModal from '../components/ImageModal'

// 定义美食打卡数据的接口
interface FoodCheckin {
  id: string;
  restaurant_name: string;
  address?: string;
  cuisine?: string;
  overall_rating?: number;
  taste_rating?: number;
  environment_rating?: number;
  service_rating?: number;
  price_range?: string;
  recommended_dishes?: string[] | string;
  description?: string;
  date?: string;
  images?: string[];
}

const FoodCheckin: React.FC = () => {
  const [checkins, setCheckins] = useState<FoodCheckin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [allImages, setAllImages] = useState<string[]>([])

  useEffect(() => {
    fetchCheckins()
  }, [])

  const fetchCheckins = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiService.get('/food')
      if (response.error) {
        throw new Error(response.error)
      }
      const data = response.data
      setCheckins(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('获取美食打卡失败:', error)
      setError('获取美食打卡失败: ' + (error as Error).message)
      setCheckins([])
    } finally {
      setLoading(false)
    }
  }

  const cuisines = ['all', '中餐', '西餐', '日料', '韩料', '火锅', '烧烤', '烤肉', '甜品', '其他']

  const filteredAndSortedCheckins = checkins
    .filter(checkin => filter === 'all' || checkin.cuisine === filter)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
      } else if (sortBy === 'rating') {
        return (b.overall_rating || 0) - (a.overall_rating || 0)
      }
      return 0
    })

  const renderStars = (rating: number | undefined, label: string | null = null) => {
    const numRating = Number(rating) || 0
    return (
      <div className="flex items-center space-x-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${
              i < numRating ? 'text-amber-500 fill-amber-500' : 'text-stone-300'
            }`}
          />
        ))}
        {label && <span className="text-xs text-stone-600 ml-1 font-light">{label}</span>}
        <span className="text-xs text-stone-600 ml-1">{numRating}</span>
      </div>
    )
  }

  const getCategoryColor = (category: string | undefined) => {
    const colors: Record<string, string> = {
      '中餐': 'bg-amber-100 text-amber-800 border-amber-200',
      '西餐': 'bg-stone-100 text-stone-800 border-stone-200',
      '日料': 'bg-slate-100 text-slate-800 border-slate-200',
      '韩料': 'bg-rose-100 text-rose-800 border-rose-200',
      '火锅': 'bg-red-100 text-red-800 border-red-200',
      '烧烤': 'bg-orange-100 text-orange-800 border-orange-200',
      '烤肉': 'bg-red-100 text-red-800 border-red-200',
      '甜品': 'bg-pink-100 text-pink-800 border-pink-200',
      '其他': 'bg-stone-100 text-stone-800 border-stone-200'
    }
    return colors[category || '其他'] || colors['其他']
  }

  // 处理图片点击放大
  const handleImageClick = (images: string[] | undefined, currentIndex: number = 0) => {
    setAllImages(images || [])
    setCurrentImageIndex(currentIndex)
    setSelectedImage(images?.[currentIndex] || null)
  }

  // 关闭图片查看器
  const closeImageModal = () => {
    setSelectedImage(null)
    setAllImages([])
    setCurrentImageIndex(0)
  }

  // 切换到上一张图片
  const goToPreviousImage = () => {
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : allImages.length - 1
    setCurrentImageIndex(newIndex)
    setSelectedImage(allImages[newIndex])
  }

  // 切换到下一张图片
  const goToNextImage = () => {
    const newIndex = currentImageIndex < allImages.length - 1 ? currentImageIndex + 1 : 0
    setCurrentImageIndex(newIndex)
    setSelectedImage(allImages[newIndex])
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="text-red-500 mb-4">⚠️ {error}</div>
            <button 
              onClick={fetchCheckins}
              className="px-4 py-2 bg-stone-200 text-stone-700 rounded-full hover:bg-stone-300 transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <FoodIcon className="w-12 h-12 text-stone-800 mx-auto mb-4" />
          <h1 className="text-4xl font-light text-stone-800 mb-4">美食打卡</h1>
          <p className="text-stone-600 font-light">记录我们一起品尝的每一道美食</p>
        </div>

        <div className="mb-8 flex flex-wrap gap-4 justify-center">
          <div className="flex flex-wrap gap-2">
            {cuisines.map(cuisine => (
              <button
                key={cuisine}
                onClick={() => setFilter(cuisine)}
                className={`px-4 py-2 rounded-full text-sm font-light transition-colors ${
                  filter === cuisine
                    ? 'bg-stone-800 text-white'
                    : 'bg-white/60 text-stone-700 hover:bg-white/80 border border-white/20'
                }`}
              >
                {cuisine === 'all' ? '全部' : cuisine}
              </button>
            ))}
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-full text-sm font-light bg-white/60 text-stone-700 border border-white/20"
          >
            <option value="date">按时间排序</option>
            <option value="rating">按评分排序</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAndSortedCheckins.map((checkin) => (
            <div
              key={checkin.id}
              className="backdrop-blur-sm bg-white/60 border border-white/20 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)] transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02]"
            >
              {checkin.images && checkin.images.length > 0 && (
                <div className="space-y-3">
                  {/* 主图显示 - 使用压缩后的缩略图 */}
                  <div 
                    className="aspect-video rounded-2xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => handleImageClick(checkin.images, 0)}
                  >
                    <img
                      src={checkin.images[0].replace('/upload/', '/upload/w_400,h_300,c_fill/')}
                      alt={checkin.restaurant_name || '餐厅图片'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = checkin.images[0]
                      }}
                    />
                  </div>
                  
                  {/* 多张图片时的缩略图预览 */}
                  {checkin.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {checkin.images.slice(0, 4).map((img, imgIndex) => (
                        <div
                          key={imgIndex}
                          className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-white/20 hover:border-stone-300"
                          onClick={() => handleImageClick(checkin.images, imgIndex)}
                        >
                          <img
                            src={img.replace('/upload/', '/upload/w_100,h_100,c_fill/')}
                            alt={`${checkin.restaurant_name} 图片 ${imgIndex + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              e.target.src = img
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-3">
                <div>
                  <h3 className="text-xl font-light text-stone-800">{checkin.restaurant_name || '未知餐厅'}</h3>
                  <p className="text-sm text-stone-600 font-light">{checkin.address || ''}</p>
                </div>
                
                {/* 评分区域 */}
                <div className="space-y-2 bg-stone-50/50 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Heart className="h-3.5 w-3.5 text-rose-400" />
                      <span className="text-xs font-medium text-stone-700">总体</span>
                    </div>
                    {renderStars(checkin.overall_rating)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smile className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-xs font-medium text-stone-700">口味</span>
                    </div>
                    {renderStars(checkin.taste_rating)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Coffee className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-xs font-medium text-stone-700">环境</span>
                    </div>
                    {renderStars(checkin.environment_rating)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Star className="h-3.5 w-3.5 text-violet-400" />
                      <span className="text-xs font-medium text-stone-700">服务</span>
                    </div>
                    {renderStars(checkin.service_rating)}
                  </div>
                </div>
                
                {checkin.cuisine && (
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-light border ${getCategoryColor(checkin.cuisine)}`}
                    >
                      {checkin.cuisine}
                    </span>
                  </div>
                )}
                
                {checkin.price_range && (
                  <div className="flex items-center text-sm text-stone-600 font-light">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span>{checkin.price_range}</span>
                  </div>
                )}
                
                {checkin.recommended_dishes && (
                  <div className="mt-3">
                    <span className="text-sm font-medium text-stone-700">推荐菜品:</span>
                    <p className="text-sm text-stone-600 mt-1">
                      {Array.isArray(checkin.recommended_dishes) 
                        ? checkin.recommended_dishes.join('、') 
                        : checkin.recommended_dishes}
                    </p>
                  </div>
                )}
                
                {checkin.description && (
                  <div className="mt-3">
                    <span className="text-sm font-medium text-stone-700">评价:</span>
                    <p className="text-sm text-stone-600 mt-1 line-clamp-2">
                      {checkin.description}
                    </p>
                  </div>
                )}
                
                <div className="text-xs text-stone-500 font-light">
                  {new Date(checkin.date || '').toLocaleDateString('zh-CN')}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAndSortedCheckins.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center">
                <Utensils className="h-8 w-8 text-stone-400" />
              </div>
              <div>
                <h3 className="text-lg font-light text-stone-800 mb-2">还没有美食记录</h3>
                <p className="text-sm text-stone-600 font-light">快来添加你们的第一道美食回忆吧！</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 图片查看器模态框 - 放在组件最后，确保始终可用 */}
      <ImageModal
        isOpen={selectedImage !== null}
        onClose={closeImageModal}
        imageUrl={selectedImage}
        images={allImages}
        currentIndex={currentImageIndex}
        onPrevious={goToPreviousImage}
        onNext={goToNextImage}
      />
    </div>
  )
}

export default FoodCheckin
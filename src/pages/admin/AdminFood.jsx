import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, MapPin, Star, Calendar, X } from 'lucide-react'

export default function AdminFood() {
  const [checkins, setCheckins] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingCheckin, setEditingCheckin] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    location: '',
    rating: 5,
    images: []
  })

  useEffect(() => {
    fetchCheckins()
  }, [])

  const fetchCheckins = async () => {
    try {
      const response = await fetch('/api/food')
      const data = await response.json()
      setCheckins(data)
    } catch (error) {
      console.error('加载美食记录失败:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const foodData = {
      restaurant_name: formData.restaurant_name,
      address: formData.address,
      cuisine: formData.cuisine,
      price_range: formData.price_range,
      overall_rating: formData.overall_rating,
      taste_rating: formData.taste_rating,
      environment_rating: formData.environment_rating,
      service_rating: formData.service_rating,
      recommended_dishes: formData.recommended_dishes,
      description: formData.description,
      date: formData.date,
      images: formData.images
    }

    try {
      let response
      if (editingCheckin) {
        response = await fetch(`/api/food/${editingCheckin.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(foodData)
        })
      } else {
        response = await fetch('/api/food', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(foodData)
        })
      }

      if (response.ok) {
        fetchCheckins()
        setShowForm(false)
        setEditingCheckin(null)
        setFormData({
          restaurant_name: '',
          address: '',
          cuisine: '',
          price_range: '',
          overall_rating: 5,
          taste_rating: 5,
          environment_rating: 5,
          service_rating: 5,
          recommended_dishes: [],
          description: '',
          date: '',
          images: []
        })
      }
    } catch (error) {
      console.error('保存美食记录失败:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这条美食记录吗？')) return

    try {
      const response = await fetch(`/api/food/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchCheckins()
      }
    } catch (error) {
      console.error('删除美食记录失败:', error)
    }
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ))
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    for (const file of files) {
      try {
        const reader = new FileReader()
        reader.onload = (event) => {
          const base64Url = event.target.result
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, base64Url]
          }))
        }
        reader.readAsDataURL(file)
      } catch (error) {
        console.error('上传图片失败:', error)
      }
    }
  }

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">美食管理</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          添加记录
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingCheckin ? '编辑美食记录' : '添加美食记录'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">餐厅名称</label>
                <input
                  type="text"
                  value={formData.restaurant_name}
                  onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">菜系</label>
                <select
                  value={formData.cuisine}
                  onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">选择菜系</option>
                  <option value="中餐">中餐</option>
                  <option value="西餐">西餐</option>
                  <option value="日料">日料</option>
                  <option value="韩料">韩料</option>
                  <option value="火锅">火锅</option>
                  <option value="烧烤">烧烤</option>
                  <option value="甜品">甜品</option>
                  <option value="其他">其他</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">价格区间</label>
                <input
                  type="text"
                  value={formData.price_range}
                  onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="如：50-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="餐厅地址"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">综合评分</label>
                <select
                  value={formData.overall_rating}
                  onChange={(e) => setFormData({ ...formData, overall_rating: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="5">5星 - 非常好</option>
                  <option value="4">4星 - 很好</option>
                  <option value="3">3星 - 一般</option>
                  <option value="2">2星 - 较差</option>
                  <option value="1">1星 - 很差</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">口味评分</label>
                <select
                  value={formData.taste_rating}
                  onChange={(e) => setFormData({ ...formData, taste_rating: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="5">5星</option>
                  <option value="4">4星</option>
                  <option value="3">3星</option>
                  <option value="2">2星</option>
                  <option value="1">1星</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">环境评分</label>
                <select
                  value={formData.environment_rating}
                  onChange={(e) => setFormData({ ...formData, environment_rating: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="5">5星</option>
                  <option value="4">4星</option>
                  <option value="3">3星</option>
                  <option value="2">2星</option>
                  <option value="1">1星</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">服务评分</label>
                <select
                  value={formData.service_rating}
                  onChange={(e) => setFormData({ ...formData, service_rating: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="5">5星</option>
                  <option value="4">4星</option>
                  <option value="3">3星</option>
                  <option value="2">2星</option>
                  <option value="1">1星</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">推荐菜品</label>
              <input
                type="text"
                value={formData.recommended_dishes.join(', ')}
                onChange={(e) => setFormData({ ...formData, recommended_dishes: e.target.value.split(',').map(item => item.trim()) })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="用逗号分隔多个菜品"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows="3"
                placeholder="用餐感受、环境描述等"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">美食图片</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.images.map((url, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={url} 
                      alt="" 
                      className="h-20 w-20 object-cover rounded"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/80x80'
                        e.target.alt = '图片加载失败'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg"
              >
                保存
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingCheckin(null)
                  setFormData({
                    restaurantName: '',
                    dishName: '',
                    rating: 5,
                    date: '',
                    location: '',
                    price: '',
                    notes: '',
                    images: []
                  })
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {checkins.map((checkin) => (
          <div key={checkin.id} className="glass-card p-4">
            {checkin.images && checkin.images[0] && (
              <img
                src={checkin.images[0]}
                alt={checkin.restaurant_name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}
            <h3 className="font-semibold text-gray-800">{checkin.restaurant_name}</h3>
            <p className="text-sm text-gray-600 mb-1">{checkin.cuisine}</p>
            <div className="flex items-center mb-2">
              {renderStars(checkin.overall_rating)}
              <span className="ml-2 text-sm text-gray-600">{checkin.overall_rating}星</span>
            </div>
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              {checkin.address}
            </div>
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <Calendar className="h-4 w-4 mr-1" />
              {new Date(checkin.date).toLocaleDateString('zh-CN')}
            </div>
            {checkin.price_range && (
              <p className="text-sm text-gray-500 mb-2">{checkin.price_range}</p>
            )}
            {checkin.description && (
              <p className="text-sm text-gray-600 mb-3">{checkin.description}</p>
            )}
            {checkin.recommended_dishes && checkin.recommended_dishes.length > 0 && (
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">推荐：</span>{checkin.recommended_dishes.join(', ')}
              </p>
            )}
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setEditingCheckin(checkin)
                  setFormData(checkin)
                  setShowForm(true)
                }}
                className="flex items-center px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
              >
                <Edit className="h-4 w-4 mr-1" />
                编辑
              </button>
              <button
                onClick={() => handleDelete(checkin.id)}
                className="flex items-center px-3 py-1 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
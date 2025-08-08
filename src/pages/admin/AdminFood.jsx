import React, { useState, useEffect } from 'react'
import { Plus, X, Trash2, Edit2, Utensils, MapPin, Star } from 'lucide-react'
import { apiRequest } from '../../utils/api'
import ImageUploader from '../../components/ImageUploader'

export default function AdminFood() {
  const [checkins, setCheckins] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingCheckin, setEditingCheckin] = useState(null)
  const [formData, setFormData] = useState({
    restaurant_name: '',
    food_name: '',
    rating: 5,
    location: '',
    description: '',
    images: []
  })

  useEffect(() => {
    fetchFoodCheckins()
  }, [])

  const fetchFoodCheckins = async () => {
    try {
      const data = await apiRequest('/api/food')
      setCheckins(data)
    } catch (error) {
      console.error('获取美食打卡失败:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const foodData = {
      ...formData,
      rating: parseInt(formData.rating)
    }

    try {
      if (editingCheckin) {
        await apiRequest(`/api/food/${editingCheckin.id}`, {
          method: 'PUT',
          body: JSON.stringify(foodData)
        })
      } else {
        await apiRequest('/api/food', {
          method: 'POST',
          body: JSON.stringify(foodData)
        })
      }
      fetchFoodCheckins()
      setShowForm(false)
      setEditingCheckin(null)
      setFormData({
        restaurant_name: '',
        food_name: '',
        rating: 5,
        location: '',
        description: '',
        images: []
      })
    } catch (error) {
      console.error('保存美食打卡失败:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这条美食打卡吗？')) return

    try {
      await apiRequest(`/api/food/${id}`, {
        method: 'DELETE'
      })
      fetchFoodCheckins()
    } catch (error) {
      console.error('删除美食打卡失败:', error)
    }
  }

  const handleEdit = (checkin) => {
    setEditingCheckin(checkin)
    setFormData({
      restaurant_name: checkin.restaurant_name,
      food_name: checkin.food_name,
      rating: checkin.rating,
      location: checkin.location || '',
      description: checkin.description || '',
      images: checkin.images || []
    })
    setShowForm(true)
  }

  const handleImagesUploaded = (urls) => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...urls]
    }))
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
        <h1 className="text-2xl font-bold text-gray-800">美食打卡管理</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          添加美食
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingCheckin ? '编辑美食' : '添加美食打卡'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">菜品名称</label>
                <input
                  type="text"
                  value={formData.food_name}
                  onChange={(e) => setFormData({ ...formData, food_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">评分</label>
                <select
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {[5, 4, 3, 2, 1].map(rating => (
                    <option key={rating} value={rating}>
                      {rating} ⭐
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">位置</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="可选"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows="4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">美食图片</label>
              <ImageUploader
                onImagesUploaded={handleImagesUploaded}
                existingImages={formData.images}
                onRemoveImage={removeImage}
                folder="food"
                maxImages={10}
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
                    restaurant_name: '',
                    food_name: '',
                    rating: 5,
                    location: '',
                    description: '',
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
        {checkins.map(checkin => (
          <div key={checkin.id} className="glass-card overflow-hidden">
            <div className="aspect-w-16 aspect-h-9 bg-gray-100">
              {checkin.images?.[0] ? (
                <img
                  src={checkin.images[0]}
                  alt={checkin.food_name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 flex items-center justify-center bg-gradient-to-r from-pink-100 to-purple-100">
                  <Utensils className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{checkin.food_name}</h3>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < checkin.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-1">{checkin.restaurant_name}</p>
              {checkin.location && (
                <p className="text-gray-500 text-sm mb-2 flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {checkin.location}
                </p>
              )}
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {checkin.description || '暂无描述'}
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(checkin)}
                  className="flex items-center px-3 py-1 text-sm bg-blue-500 text-white rounded"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(checkin.id)}
                  className="flex items-center px-3 py-1 text-sm bg-red-500 text-white rounded"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {checkins.length === 0 && (
        <div className="text-center py-12">
          <Utensils className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">暂无美食打卡，点击右上角添加第一个美食吧！</p>
        </div>
      )}
    </div>
  )
}
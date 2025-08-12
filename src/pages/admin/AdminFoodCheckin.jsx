import React, { useState, useEffect } from 'react'
import { Plus, X, Trash2, Edit2, Star, MapPin, Utensils } from 'lucide-react'
import { apiRequest } from '../../utils/api'
import ImageUploader from '../../components/ImageUploader'
import AdminModal from '../../components/AdminModal'
import { useAdminModal } from '../../hooks/useAdminModal'

export default function AdminFoodCheckin() {
  const [checkins, setCheckins] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingCheckin, setEditingCheckin] = useState(null)
  const { modalState, showAlert, showConfirm, closeModal } = useAdminModal()
  const [formData, setFormData] = useState({
    restaurant: '',
    dish: '',
    category: '',
    rating: 0,
    taste_rating: 0,
    environment_rating: 0,
    service_rating: 0,
    price: '',
    location: '',
    description: '',
    images: [],
    recommended: false
  })

  const categories = ['川菜', '粤菜', '湘菜', '鲁菜', '苏菜', '浙菜', '闽菜', '徽菜', '火锅', '烧烤', '西餐', '日料', '韩料', '东南亚', '其他']

  useEffect(() => {
    fetchCheckins()
  }, [])

  const fetchCheckins = async () => {
    try {
      const data = await apiRequest('/api/food-checkin')
      setCheckins(data)
    } catch (error) {
      console.error('获取美食打卡失败:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.restaurant.trim()) {
      await showAlert('提示', '请输入餐厅名称', 'warning')
      return
    }
    
    if (!formData.dish.trim()) {
      await showAlert('提示', '请输入菜品名称', 'warning')
      return
    }

    const checkinData = {
      restaurant: formData.restaurant.trim(),
      dish: formData.dish.trim(),
      category: formData.category,
      rating: Number(formData.rating),
      taste_rating: Number(formData.taste_rating),
      environment_rating: Number(formData.environment_rating),
      service_rating: Number(formData.service_rating),
      price: formData.price ? Number(formData.price) : null,
      location: formData.location?.trim() || '',
      description: formData.description?.trim() || '',
      images: formData.images,
      recommended: formData.recommended
    }

    try {
      if (editingCheckin) {
        await apiRequest(`/api/food-checkin/${editingCheckin.id}`, {
          method: 'PUT',
          body: JSON.stringify(checkinData)
        })
      } else {
        await apiRequest('/api/food-checkin', {
          method: 'POST',
          body: JSON.stringify(checkinData)
        })
      }
      
      setShowForm(false)
      setEditingCheckin(null)
      resetForm()
      fetchCheckins()
      
      await showAlert('成功', '美食打卡保存成功！', 'success')
    } catch (error) {
      console.error('保存美食打卡失败:', error)
      await showAlert('错误', `保存失败: ${error.message || '请检查网络连接后重试'}`, 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      restaurant: '',
      dish: '',
      category: '',
      rating: 0,
      taste_rating: 0,
      environment_rating: 0,
      service_rating: 0,
      price: '',
      location: '',
      description: '',
      images: [],
      recommended: false
    })
  }

  const handleDelete = async (id) => {
    const confirmed = await showConfirm('确认删除', '确定要删除这条美食打卡吗？此操作不可恢复！', '删除')
    if (!confirmed) return

    try {
      await apiRequest(`/api/food-checkin/${id}`, {
        method: 'DELETE'
      })
      fetchCheckins()
    } catch (error) {
      console.error('删除美食打卡失败:', error)
    }
  }

  const handleEdit = (checkin) => {
    setEditingCheckin(checkin)
    setFormData({
      restaurant: checkin.restaurant,
      dish: checkin.dish,
      category: checkin.category,
      rating: checkin.rating,
      taste_rating: checkin.taste_rating || 0,
      environment_rating: checkin.environment_rating || 0,
      service_rating: checkin.service_rating || 0,
      price: checkin.price || '',
      location: checkin.location || '',
      description: checkin.description || '',
      images: checkin.images || [],
      recommended: checkin.recommended || false
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

  const renderStars = (rating, onRate) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRate(star)}
            className="focus:outline-none"
          >
            <Star
              className={`h-5 w-5 ${
                star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  const getCategoryColor = (category) => {
    const colors = {
      '川菜': 'bg-red-100 text-red-800',
      '粤菜': 'bg-green-100 text-green-800',
      '湘菜': 'bg-orange-100 text-orange-800',
      '鲁菜': 'bg-blue-100 text-blue-800',
      '苏菜': 'bg-purple-100 text-purple-800',
      '浙菜': 'bg-pink-100 text-pink-800',
      '闽菜': 'bg-teal-100 text-teal-800',
      '徽菜': 'bg-yellow-100 text-yellow-800',
      '火锅': 'bg-red-200 text-red-900',
      '烧烤': 'bg-gray-100 text-gray-800',
      '西餐': 'bg-indigo-100 text-indigo-800',
      '日料': 'bg-red-100 text-red-800',
      '韩料': 'bg-rose-100 text-rose-800',
      '东南亚': 'bg-amber-100 text-amber-800',
      '其他': 'bg-slate-100 text-slate-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">美食打卡管理</h1>
        <button
          onClick={() => {
            resetForm()
            setEditingCheckin(null)
            setShowForm(true)
          }}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          添加美食
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {editingCheckin ? '编辑美食打卡' : '添加美食打卡'}
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditingCheckin(null)
                resetForm()
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  餐厅名称 *
                </label>
                <input
                  type="text"
                  value={formData.restaurant}
                  onChange={(e) => setFormData({ ...formData, restaurant: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  菜品名称 *
                </label>
                <input
                  type="text"
                  value={formData.dish}
                  onChange={(e) => setFormData({ ...formData, dish: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  菜系分类
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">选择菜系</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  价格
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="元"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                位置
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg"
                  placeholder="餐厅地址"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows="3"
                placeholder="分享你的美食体验..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  总体评分
                </label>
                {renderStars(formData.rating, (rating) => setFormData({ ...formData, rating }))}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  口味评分
                </label>
                {renderStars(formData.taste_rating, (rating) => setFormData({ ...formData, taste_rating: rating }))}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  环境评分
                </label>
                {renderStars(formData.environment_rating, (rating) => setFormData({ ...formData, environment_rating: rating }))}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  服务评分
                </label>
                {renderStars(formData.service_rating, (rating) => setFormData({ ...formData, service_rating: rating }))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                美食图片
              </label>
              <ImageUploader
                onImagesUploaded={handleImagesUploaded}
                existingImages={[]}
                onRemoveImage={() => {}}
                folder="food"
                maxImages={9}
              />
              
              {formData.images.length > 0 && (
                <div className="mt-4">
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {formData.images.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`美食图片 ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="recommended"
                checked={formData.recommended}
                onChange={(e) => setFormData({ ...formData, recommended: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="recommended" className="text-sm font-medium text-gray-700">
                强烈推荐
              </label>
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg"
              >
                保存
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingCheckin(null)
                  resetForm()
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 美食打卡列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {checkins.map(checkin => (
          <div key={checkin.id} className="glass-card overflow-hidden">
            <div className="aspect-w-16 aspect-h-9 bg-gray-100">
              {checkin.images?.[0] ? (
                <img
                  src={checkin.images[0]}
                  alt={checkin.dish}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 flex items-center justify-center bg-gradient-to-r from-orange-100 to-red-100">
                  <Utensils className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{checkin.dish}</h3>
                {checkin.recommended && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                    推荐
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 text-sm mb-2">{checkin.restaurant}</p>
              
              {checkin.category && (
                <span className={`inline-block px-2 py-1 text-xs rounded-full mb-2 ${getCategoryColor(checkin.category)}`}>
                  {checkin.category}
                </span>
              )}
              
              <div className="flex items-center mb-2">
                {renderStars(checkin.rating, () => {})}
                <span className="ml-2 text-sm text-gray-600">{checkin.rating}分</span>
              </div>
              
              {checkin.price && (
                <p className="text-sm text-gray-500 mb-2">¥{checkin.price}</p>
              )}
              
              <div className="flex space-x-2 mt-3">
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

      <AdminModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
        showCancel={modalState.showCancel}
        confirmText={modalState.confirmText}
      />
    </div>
  )
}
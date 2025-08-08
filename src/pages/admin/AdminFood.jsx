import React, { useState, useEffect } from 'react'
import { Plus, X, Trash2, Edit2, Utensils, MapPin, Star } from 'lucide-react'
import { apiRequest } from '../../utils/api'
import ImageUploader from '../../components/ImageUploader'
import AdminModal from '../../components/AdminModal'
import { useAdminModal } from '../../hooks/useAdminModal'

export default function AdminFood() {
  const [checkins, setCheckins] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingCheckin, setEditingCheckin] = useState(null)
  const { modalState, showAlert, showConfirm, closeModal } = useAdminModal()
  const [formData, setFormData] = useState({
    restaurant_name: '',
    cuisine: '',
    price_range: '',
    description: '',
    date: '',
    address: '',
    overall_rating: 5,
    taste_rating: 5,
    environment_rating: 5,
    service_rating: 5,
    recommended_dishes: '',
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
    
    // 验证必填字段
    if (!formData.restaurant_name.trim()) {
      await showAlert('提示', '请输入餐厅名称', 'warning')
      return
    }
    if (!formData.date) {
      await showAlert('提示', '请选择日期', 'warning')
      return
    }
    
    const foodData = {
      ...formData,
      overall_rating: parseInt(formData.overall_rating),
      taste_rating: parseInt(formData.taste_rating),
      environment_rating: parseInt(formData.environment_rating),
      service_rating: parseInt(formData.service_rating),
      recommended_dishes: formData.recommended_dishes ? formData.recommended_dishes.split(',').map(dish => dish.trim()) : []
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
        cuisine: '',
        price_range: '',
        description: '',
        date: '',
        address: '',
        overall_rating: 5,
        taste_rating: 5,
        environment_rating: 5,
        service_rating: 5,
        recommended_dishes: '',
        images: []
      })
    } catch (error) {
      console.error('保存美食打卡失败:', error)
      await showAlert('错误', '保存失败，请重试', 'error')
    }
  }

  const handleDelete = async (id) => {
    const confirmed = await showConfirm('确认删除', '确定要删除这条美食打卡吗？', '删除')
    if (!confirmed) return

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
      restaurant_name: checkin.restaurant_name || '',
      cuisine: checkin.cuisine || '',
      price_range: checkin.price_range || '',
      description: checkin.description || '',
      date: checkin.date || '',
      address: checkin.address || '',
      overall_rating: checkin.overall_rating || 5,
      taste_rating: checkin.taste_rating || 5,
      environment_rating: checkin.environment_rating || 5,
      service_rating: checkin.service_rating || 5,
      recommended_dishes: Array.isArray(checkin.recommended_dishes) ? checkin.recommended_dishes.join(', ') : (checkin.recommended_dishes || ''),
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
                <label className="block text-sm font-medium text-gray-700 mb-1">餐厅名称 *</label>
                <input
                  type="text"
                  value={formData.restaurant_name}
                  onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">日期 *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">菜系</label>
                <select
                  value={formData.cuisine}
                  onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">价格区间</label>
                <select
                  value={formData.price_range}
                  onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">选择价格</option>
                  <option value="¥">¥ (50以下)</option>
                  <option value="¥¥">¥¥ (50-100)</option>
                  <option value="¥¥¥">¥¥¥ (100-200)</option>
                  <option value="¥¥¥¥">¥¥¥¥ (200以上)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">推荐菜品</label>
                <input
                  type="text"
                  value={formData.recommended_dishes}
                  onChange={(e) => setFormData({ ...formData, recommended_dishes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="用逗号分隔多个菜品"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">综合评分</label>
                <select
                  value={formData.overall_rating}
                  onChange={(e) => setFormData({ ...formData, overall_rating: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">口味评分</label>
                <select
                  value={formData.taste_rating}
                  onChange={(e) => setFormData({ ...formData, taste_rating: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">环境评分</label>
                <select
                  value={formData.environment_rating}
                  onChange={(e) => setFormData({ ...formData, environment_rating: e.target.value })}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">服务评分</label>
                <select
                  value={formData.service_rating}
                  onChange={(e) => setFormData({ ...formData, service_rating: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {[5, 4, 3, 2, 1].map(rating => (
                    <option key={rating} value={rating}>
                      {rating} ⭐
                    </option>
                  ))}
                </select>
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
                    cuisine: '',
                    price_range: '',
                    description: '',
                    date: '',
                    address: '',
                    overall_rating: 5,
                    taste_rating: 5,
                    environment_rating: 5,
                    service_rating: 5,
                    recommended_dishes: '',
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
                <h3 className="font-semibold text-lg">{checkin.restaurant_name}</h3>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < (checkin.overall_rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {checkin.cuisine && (
                <p className="text-gray-600 text-sm mb-1 flex items-center">
                  <Utensils className="h-3 w-3 mr-1" />
                  {checkin.cuisine}
                </p>
              )}
              {checkin.address && (
                <p className="text-gray-500 text-sm mb-2 flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {checkin.address}
                </p>
              )}
              {checkin.price_range && (
                <p className="text-gray-500 text-sm mb-2">
                  价格: {checkin.price_range}
                </p>
              )}
              {checkin.date && (
                <p className="text-gray-500 text-sm mb-2">
                  日期: {new Date(checkin.date).toLocaleDateString('zh-CN')}
                </p>
              )}
              {checkin.recommended_dishes && (
                <p className="text-gray-600 text-sm mb-2">
                  推荐: {Array.isArray(checkin.recommended_dishes) ? checkin.recommended_dishes.join('、') : checkin.recommended_dishes}
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
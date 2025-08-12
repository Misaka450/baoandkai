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
    restaurant_name: '',
    description: '',
    date: '',
    address: '',
    cuisine: '',
    price_range: '',
    overall_rating: 5,
    taste_rating: 5,
    environment_rating: 5,
    service_rating: 5,
    recommended_dishes: '',
    images: []
  })

  const cuisines = ['中餐', '西餐', '日料', '韩料', '火锅', '烧烤', '甜品', '其他']

  useEffect(() => {
    fetchCheckins()
  }, [])

  const fetchCheckins = async () => {
    try {
      const data = await apiRequest('/api/food')
      setCheckins(data)
    } catch (error) {
      console.error('获取美食打卡失败:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.restaurant_name.trim()) {
      await showAlert('提示', '请输入餐厅名称', 'warning')
      return
    }
    
    if (!formData.date) {
      await showAlert('提示', '请选择日期', 'warning')
      return
    }

    const checkinData = {
      restaurant_name: formData.restaurant_name.trim(),
      description: formData.description?.trim() || '',
      date: formData.date,
      address: formData.address?.trim() || '',
      cuisine: formData.cuisine,
      price_range: formData.price_range?.trim() || '',
      overall_rating: Number(formData.overall_rating),
      taste_rating: Number(formData.taste_rating),
      environment_rating: Number(formData.environment_rating),
      service_rating: Number(formData.service_rating),
      recommended_dishes: formData.recommended_dishes?.trim() || '',
      images: formData.images
    }

    try {
      if (editingCheckin) {
        await apiRequest(`/api/food/${editingCheckin.id}`, {
          method: 'PUT',
          body: JSON.stringify(checkinData)
        })
      } else {
        await apiRequest('/api/food', {
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
      restaurant_name: '',
      description: '',
      date: '',
      address: '',
      cuisine: '',
      price_range: '',
      overall_rating: 5,
      taste_rating: 5,
      environment_rating: 5,
      service_rating: 5,
      recommended_dishes: '',
      images: []
    })
  }

  const handleDelete = async (id) => {
    const confirmed = await showConfirm('确认删除', '确定要删除这条美食打卡吗？此操作不可恢复！', '删除')
    if (!confirmed) return

    try {
      await apiRequest(`/api/food/${id}`, {
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
      restaurant_name: checkin.restaurant_name || '',
      description: checkin.description || '',
      date: checkin.date || '',
      address: checkin.address || '',
      cuisine: checkin.cuisine || '',
      price_range: checkin.price_range || '',
      overall_rating: checkin.overall_rating || 5,
      taste_rating: checkin.taste_rating || 5,
      environment_rating: checkin.environment_rating || 5,
      service_rating: checkin.service_rating || 5,
      recommended_dishes: checkin.recommended_dishes || '',
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

  const getCategoryColor = (cuisine) => {
    const colors = {
      '中餐': 'bg-red-100 text-red-800',
      '西餐': 'bg-blue-100 text-blue-800',
      '日料': 'bg-pink-100 text-pink-800',
      '韩料': 'bg-purple-100 text-purple-800',
      '火锅': 'bg-red-300 text-red-900',
      '烧烤': 'bg-orange-200 text-orange-900',
      '甜品': 'bg-yellow-100 text-yellow-800',
      '其他': 'bg-gray-100 text-gray-800'
    }
    return colors[cuisine] || 'bg-gray-100 text-gray-800'
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

      {/* 弹窗编辑模式 - 页面中央弹出 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-light text-gray-800">
                {editingCheckin ? '编辑美食打卡' : '添加美食打卡'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingCheckin(null)
                  resetForm()
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">餐厅名称 *</label>
                  <input
                    type="text"
                    value={formData.restaurant_name}
                    onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50/50 transition-all duration-200 placeholder-gray-400"
                    placeholder="请输入餐厅名称"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">打卡日期 *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50/50 transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">菜系分类</label>
                  <select
                    value={formData.cuisine}
                    onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50/50 transition-all duration-200"
                  >
                    <option value="">选择菜系</option>
                    {cuisines.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">价格区间</label>
                  <input
                    type="text"
                    value={formData.price_range}
                    onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50/50 transition-all duration-200 placeholder-gray-400"
                    placeholder="如：人均100-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">餐厅地址</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50/50 transition-all duration-200 placeholder-gray-400"
                    placeholder="请输入餐厅地址"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">美食体验描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50/50 transition-all duration-200 placeholder-gray-400 resize-none"
                  rows="4"
                  placeholder="分享你的美食体验、环境氛围、服务感受..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">评分</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">综合评分</label>
                    {renderStars(formData.overall_rating, (rating) => setFormData({ ...formData, overall_rating: rating }))}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">口味评分</label>
                    {renderStars(formData.taste_rating, (rating) => setFormData({ ...formData, taste_rating: rating }))}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">环境评分</label>
                    {renderStars(formData.environment_rating, (rating) => setFormData({ ...formData, environment_rating: rating }))}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">服务评分</label>
                    {renderStars(formData.service_rating, (rating) => setFormData({ ...formData, service_rating: rating }))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">美食图片</label>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">推荐菜品</label>
                <input
                  type="text"
                  value={formData.recommended_dishes}
                  onChange={(e) => setFormData({ ...formData, recommended_dishes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-gray-50/50 transition-all duration-200 placeholder-gray-400"
                  placeholder="请输入推荐菜品，多个用逗号分隔"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingCheckin(null)
                    resetForm()
                  }}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 font-medium shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30"
                >
                  {editingCheckin ? '更新美食' : '添加美食'}
                </button>
              </div>
            </form>
          </div>
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
                <h3 className="font-semibold text-lg">{checkin.restaurant_name}</h3>
                {checkin.recommended && (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                    推荐
                  </span>
                )}
              </div>
              
              {checkin.description && (
                <p className="text-gray-600 text-sm mb-2">{checkin.description}</p>
              )}
              
              {checkin.cuisine && (
                <span className={`inline-block px-2 py-1 text-xs rounded-full mb-2 ${getCategoryColor(checkin.cuisine)}`}>
                  {checkin.cuisine}
                </span>
              )}
              
              <div className="flex items-center mb-2">
                {renderStars(checkin.overall_rating, () => {})}
                <span className="ml-2 text-sm text-gray-600">{checkin.overall_rating}分</span>
              </div>
              
              {checkin.price_range && (
                <p className="text-sm text-gray-500 mb-2">{checkin.price_range}</p>
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
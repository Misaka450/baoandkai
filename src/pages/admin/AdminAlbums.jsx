import React, { useState, useEffect, useRef } from 'react'
import { Plus, X, Trash2, Edit2, Upload, Loader2, Image, Eye, GripVertical, CheckSquare, Square } from 'lucide-react'
import { apiService } from '../../services/apiService'
import ImageUploader from '../../components/ImageUploader'
import AdminModal from '../../components/AdminModal'
import { useAdminModal } from '../../hooks/useAdminModal'

export default function AdminAlbums() {
  const [albums, setAlbums] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState(null)
  const { modalState, showAlert, showConfirm, closeModal } = useAdminModal()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    images: []
  })
  const [selectedImages, setSelectedImages] = useState([])
  const [previewImage, setPreviewImage] = useState(null)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [showBatchActions, setShowBatchActions] = useState(false)

  useEffect(() => {
    fetchAlbums()
  }, [])

  const fetchAlbums = async () => {
    try {
      const { data } = await apiService.get('/albums')
      setAlbums(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('获取相册失败:', error)
      setAlbums([])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      await showAlert('提示', '请输入相册名称', 'warning')
      return
    }
    
    const albumData = {
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      photos: formData.images.map((url, index) => ({ 
        url, 
        caption: '',
        sort_order: index  // 保存图片顺序，index即为排序值
      }))
    }

    try {
      console.log('提交相册数据:', albumData)
      
      if (editingAlbum) {
        await apiService.put(`/albums/${editingAlbum.id}`, albumData)
      } else {
        await apiService.post('/albums', albumData)
      }
      
      setShowForm(false)
      setEditingAlbum(null)
      setFormData({ name: '', description: '', images: [] })
      setSelectedImages([])
      fetchAlbums()
      
      await showAlert('成功', '相册保存成功！', 'success')
    } catch (error) {
      console.error('保存相册失败:', error)
      await showAlert('错误', `保存失败: ${error.message || '请检查网络连接后重试'}`, 'error')
    }
  }

  const handleDelete = async (id) => {
    const confirmed = await showConfirm('确认删除', '确定要删除这个相册吗？此操作不可恢复！', '删除')
    if (!confirmed) return

    try {
      await apiService.delete(`/albums/${id}`)
      fetchAlbums()
    } catch (error) {
      console.error('删除相册失败:', error)
    }
  }

  const handleEdit = (album) => {
    setEditingAlbum(album)
    setFormData({
      name: album.name,
      description: album.description || '',
      images: album.photos?.map(p => p.url) || []
    })
    setSelectedImages([])
    setShowBatchActions(false)
    setShowForm(true)
  }

  const handleImagesUploaded = (urls) => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...urls]
    }))
  }

  const removeImage = async (index) => {
    const confirmed = await showConfirm('确认删除', '确定要删除这张图片吗？', '删除')
    if (!confirmed) return
    
    const imageUrl = formData.images[index]
    
    // 从表单数据中移除图片
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
    setSelectedImages(prev => prev.filter(i => i !== index))
    
    // 调用删除API从R2中删除图片
    deleteImageFromR2(imageUrl)
  }

  const deleteImageFromR2 = async (imageUrl) => {
    try {
      // 从URL中提取文件名 - 处理R2 URL格式
      let filename = ''
      
      // 处理 https://baoandkai.pages.dev/uploads/filename.jpg 格式
      if (imageUrl.includes('/uploads/')) {
        filename = imageUrl.split('/uploads/')[1]
      } 
      // 处理 https://pub-xxx.r2.dev/filename.jpg 格式
      else if (imageUrl.includes('r2.dev/')) {
        filename = imageUrl.split('r2.dev/')[1]
      }
      // 处理其他格式
      else {
        const urlParts = imageUrl.split('/')
        filename = urlParts[urlParts.length - 1]
      }
      
      if (filename) {
        console.log('准备删除R2图片:', filename)
        
        // 修复：使用正确的API路径 /api/delete
        const response = await apiService.delete('/api/delete', { filename })
        
        if (response.success) {
          console.log('图片已从R2删除:', filename)
        } else {
          console.error('删除R2图片失败:', response.error)
        }
      }
    } catch (error) {
      console.error('删除R2图片失败:', error)
    }
  }

  const handleDragStart = (index) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) return

    const draggedImage = formData.images[draggedIndex]
    const newImages = [...formData.images]
    newImages.splice(draggedIndex, 1)
    newImages.splice(dropIndex, 0, draggedImage)

    setFormData(prev => ({ ...prev, images: newImages }))
    setDraggedIndex(null)
  }

  const toggleImageSelection = (index) => {
    setSelectedImages(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const batchDeleteImages = async () => {
    if (selectedImages.length === 0) return
    
    const confirmed = await showConfirm('确认删除', `确定要删除选中的 ${selectedImages.length} 张图片吗？此操作不可恢复！`, '删除')
    if (!confirmed) return

    const imagesToDelete = selectedImages.map(index => formData.images[index])
    
    // 从表单数据中移除选中的图片
    const newImages = formData.images.filter((_, index) => !selectedImages.includes(index))
    setFormData(prev => ({ ...prev, images: newImages }))
    setSelectedImages([])
    setShowBatchActions(false)
    
    // 批量删除R2中的图片
    imagesToDelete.forEach(deleteImageFromR2)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">相册管理</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          创建相册
        </button>
      </div>

      {/* 弹窗编辑模式 - 页面中央弹出 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-light text-gray-800">
                {editingAlbum ? '编辑相册' : '创建新相册'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingAlbum(null)
                  setFormData({ name: '', description: '', images: [] })
                  setSelectedImages([])
                  setShowBatchActions(false)
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">相册名称 *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-gray-50/50 transition-all duration-200 placeholder-gray-400"
                    placeholder="请输入相册名称"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">相册描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-gray-50/50 transition-all duration-200 placeholder-gray-400 resize-none"
                    rows="3"
                    placeholder="请输入相册描述"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">相册图片</label>
                  {formData.images.length > 0 && (
                    <div className="flex space-x-2">
                      {showBatchActions ? (
                        <>
                          <button
                            type="button"
                            onClick={batchDeleteImages}
                            disabled={selectedImages.length === 0}
                            className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg disabled:opacity-50 transition-all duration-200"
                          >
                            删除选中 ({selectedImages.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowBatchActions(false)
                              setSelectedImages([])
                            }}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg transition-all duration-200 hover:bg-gray-50"
                          >
                            取消
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowBatchActions(true)}
                          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg transition-all duration-200 hover:bg-blue-600"
                        >
                          批量管理
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                <ImageUploader
                  onImagesUploaded={handleImagesUploaded}
                  existingImages={[]}
                  onRemoveImage={() => {}}
                  folder="albums"
                  maxImages={50}
                />
                
                {formData.images.length > 0 && (
                  <div className="mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {formData.images.map((url, index) => (
                        <div
                          key={index}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                          className={`relative group cursor-move ${
                            selectedImages.includes(index) ? 'ring-2 ring-blue-500 rounded-lg' : ''
                          }`}
                        >
                          {showBatchActions && (
                            <button
                              type="button"
                              onClick={() => toggleImageSelection(index)}
                              className="absolute top-1 left-1 z-10 bg-white rounded-full p-1 shadow-md transition-all duration-200 hover:scale-110"
                            >
                              {selectedImages.includes(index) ? 
                                <CheckSquare className="h-4 w-4 text-blue-500" /> : 
                                <Square className="h-4 w-4 text-gray-400" />
                              }
                            </button>
                          )}
                          
                          <button
                            type="button"
                            onClick={() => setPreviewImage(url)}
                            className="absolute top-1 right-1 z-10 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('确定要删除这张图片吗？')) {
                                removeImage(index)
                              }
                            }}
                            className="absolute bottom-1 right-1 z-10 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:scale-110"
                            title="删除图片"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          
                          <div className="aspect-w-1 aspect-h-1 bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={url}
                              alt={`图片 ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                          </div>
                          
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-lg">
                            <GripVertical className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-3">
                      拖拽图片可以调整顺序，点击图片预览图标查看大图
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingAlbum(null)
                    setFormData({ name: '', description: '', images: [] })
                    setSelectedImages([])
                    setShowBatchActions(false)
                  }}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all duration-200 font-medium shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30"
                >
                  {editingAlbum ? '更新相册' : '创建相册'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 相册列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {albums.map(album => (
          <div key={album.id} className="glass-card overflow-hidden">
            <div className="aspect-w-16 aspect-h-9 bg-gray-100">
              {album.photos?.[0] ? (
                <img
                  src={album.photos[0].url}
                  alt={album.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 flex items-center justify-center bg-gradient-to-r from-pink-100 to-purple-100">
                  <Image className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-1">{album.name}</h3>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                {album.description || '暂无描述'}
              </p>
              <p className="text-sm text-gray-500 mb-3">
                {album.photos?.length || 0} 张照片
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(album)}
                  className="flex items-center px-3 py-1 text-sm bg-blue-500 text-white rounded"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(album.id)}
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

      {albums.length === 0 && (
        <div className="text-center py-12">
          <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">暂无相册，点击右上角创建第一个相册吧！</p>
        </div>
      )}

      {/* 图片预览模态框 */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div className="max-w-4xl max-h-screen p-4">
            <img 
              src={previewImage} 
              alt="预览" 
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
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
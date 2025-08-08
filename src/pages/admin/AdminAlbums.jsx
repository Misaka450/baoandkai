import React, { useState, useEffect } from 'react'
import { Plus, X, Trash2, Edit2, Upload, Loader2, Image } from 'lucide-react'
import { apiRequest } from '../../utils/api'
import ImageUploader from '../../components/ImageUploader'

export default function AdminAlbums() {
  const [albums, setAlbums] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    images: []
  })

  useEffect(() => {
    fetchAlbums()
  }, [])

  const fetchAlbums = async () => {
    try {
      const data = await apiRequest('/api/albums')
      setAlbums(data)
    } catch (error) {
      console.error('获取相册失败:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('请输入相册名称')
      return
    }
    
    const albumData = {
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      photos: formData.images.map(url => ({ url, caption: '' }))
    }

    try {
      console.log('提交相册数据:', albumData)
      
      if (editingAlbum) {
        await apiRequest(`/api/albums/${editingAlbum.id}`, {
          method: 'PUT',
          body: JSON.stringify(albumData)
        })
      } else {
        await apiRequest('/api/albums', {
          method: 'POST',
          body: JSON.stringify(albumData)
        })
      }
      
      // 成功后的清理
      setShowForm(false)
      setEditingAlbum(null)
      setFormData({ name: '', description: '', images: [] })
      fetchAlbums()
      
      alert('相册保存成功！')
    } catch (error) {
      console.error('保存相册失败:', error)
      alert(`保存失败: ${error.message || '请检查网络连接后重试'}`)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个相册吗？')) return

    try {
      await apiRequest(`/api/albums/${id}`, {
        method: 'DELETE'
      })
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
        <h1 className="text-2xl font-bold text-gray-800">相册管理</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          创建相册
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingAlbum ? '编辑相册' : '创建新相册'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">相册名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">相册图片</label>
              <ImageUploader
                onImagesUploaded={handleImagesUploaded}
                existingImages={formData.images}
                onRemoveImage={removeImage}
                folder="albums"
                maxImages={50}
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
                  setEditingAlbum(null)
                  setFormData({ name: '', description: '', images: [] })
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                取消
              </button>
            </div>
          </form>
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
    </div>
  )
}
import { useState, useEffect } from 'react'
import { apiRequest } from '../../utils/api.js'
import { Plus, Edit, Trash2, Image, X, Upload, Loader2 } from 'lucide-react'
import { r2UploadManager } from '../../utils/r2Upload.js'

export default function AdminAlbums() {
  const [albums, setAlbums] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    images: []
  })
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [uploadingImages, setUploadingImages] = useState([])
  const [isUploading, setIsUploading] = useState(false)

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
    
    const albumData = {
      name: formData.name,
      description: formData.description,
      images: formData.images
    }

    try {
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
      setShowForm(false)
      setEditingAlbum(null)
      setFormData({ name: '', description: '', images: [] })
      setUploadingImages([])
      fetchAlbums()
    } catch (error) {
      console.error('保存相册失败:', error)
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

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    setIsUploading(true)
    try {
      const uploadedUrls = await r2UploadManager.uploadMultipleFiles(files, 'albums')
      // 直接使用返回的URL数组，uploadMultipleFiles已经返回扁平化的URL数组
      uploadedUrls.forEach(url => addImageToAlbum(url))
    } catch (error) {
      console.error('上传图片失败:', error)
      alert('上传失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  const addImageToAlbum = (url) => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, url]
    }))
  }

  const removeImageFromAlbum = (index) => {
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
                      onClick={() => removeImageFromAlbum(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowImageUpload(true)}
                disabled={isUploading}
                className="px-3 py-1 bg-gray-100 rounded text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    上传中...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    添加图片
                  </>
                )}
              </button>
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
                  setFormData({ name: '', description: '', coverImage: '', images: [] })
                  setUploadingImages([])
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {showImageUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">上传图片</h3>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="mb-4"
            />
            <div className="flex space-x-2">
              <button
                onClick={() => setShowImageUpload(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {albums.map((album) => (
          <div key={album.id} className="glass-card p-4">
            {album.photos && album.photos.length > 0 && (
              <img
                src={typeof album.photos[0] === 'string' ? album.photos[0] : album.photos[0].url}
                alt={album.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x400'
                  e.target.alt = '封面图片加载失败'
                }}
              />
            )}
            <h3 className="font-semibold text-gray-800">{album.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{album.description}</p>
            <p className="text-sm text-gray-500">{album.photos?.length || 0} 张照片</p>
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => {
                  setEditingAlbum(album)
                  setFormData({
                    id: album.id,
                    name: album.name || '',
                    description: album.description || '',
  
                    images: (album.photos || []).map(photo => 
                      typeof photo === 'string' ? photo : photo.url
                    )
                  })
                  setShowForm(true)
                }}
                className="flex items-center px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
              >
                <Edit className="h-4 w-4 mr-1" />
                编辑
              </button>
              <button
                onClick={() => handleDelete(album.id)}
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
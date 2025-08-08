import React, { useState, useEffect } from 'react'
import { Plus, X, Trash2, Edit2, Calendar } from 'lucide-react'
import { apiRequest } from '../../utils/api'
import ImageUploader from '../../components/ImageUploader'

export default function AdminDiary() {
  const [entries, setEntries] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    date: '',
    mood: '开心',
    weather: '晴天',
    images: []
  })

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      const data = await apiRequest('/api/diaries')
      setEntries(data)
    } catch (error) {
      console.error('加载日记失败:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const diaryData = {
      title: formData.title,
      content: formData.content,
      date: formData.date,
      mood: formData.mood,
      weather: formData.weather,
      images: formData.images
    }

    try {
      if (editingEntry) {
        await apiRequest(`/api/diaries/${editingEntry.id}`, {
          method: 'PUT',
          body: JSON.stringify(diaryData)
        })
      } else {
        await apiRequest('/api/diaries', {
          method: 'POST',
          body: JSON.stringify(diaryData)
        })
      }
      fetchEntries()
      setShowForm(false)
      setEditingEntry(null)
      setFormData({ title: '', content: '', date: '', mood: '开心', weather: '晴天', images: [] })
    } catch (error) {
      console.error('保存日记失败:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这篇日记吗？')) return

    try {
      await apiRequest(`/api/diaries/${id}`, {
        method: 'DELETE'
      })
      fetchEntries()
    } catch (error) {
      console.error('删除日记失败:', error)
    }
  }

  const moods = ['开心', '难过', '激动', '平静', '思念', '感动']
  const weathers = ['晴天', '多云', '雨天', '雪天', '阴天', '大风']

  const handleEdit = (entry) => {
    setEditingEntry(entry)
    setFormData({
      title: entry.title,
      content: entry.content,
      date: entry.date,
      mood: entry.mood,
      weather: entry.weather,
      images: entry.images || []
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
        <h1 className="text-2xl font-bold text-gray-800">日记管理</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          写新日记
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingEntry ? '编辑日记' : '写新日记'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">心情</label>
                <select
                  value={formData.mood}
                  onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {moods.map(mood => (
                    <option key={mood} value={mood}>{mood}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">天气</label>
                <select
                  value={formData.weather}
                  onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {weathers.map(weather => (
                    <option key={weather} value={weather}>{weather}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows="6"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日记图片</label>
              <ImageUploader
                onImagesUploaded={handleImagesUploaded}
                existingImages={formData.images}
                onRemoveImage={removeImage}
                folder="diary"
                maxImages={20}
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
                  setEditingEntry(null)
                  setFormData({ title: '', content: '', date: '', mood: '开心', weather: '晴天', images: [] })
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {entries.map(entry => (
          <div key={entry.id} className="glass-card p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{entry.title}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {entry.date}
                  </span>
                  <span>心情: {entry.mood}</span>
                  <span>天气: {entry.weather}</span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{entry.content}</p>
                {entry.images && entry.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {entry.images.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt=""
                        className="h-16 w-16 object-cover rounded"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/64x64'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(entry)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {entries.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">暂无日记，点击右上角开始记录吧！</p>
        </div>
      )}
    </div>
  )
}
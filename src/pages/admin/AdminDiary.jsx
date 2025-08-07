import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Calendar, X } from 'lucide-react'

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
      const savedEntries = localStorage.getItem('diaryEntries')
      if (savedEntries) {
        setEntries(JSON.parse(savedEntries))
      } else {
        // 默认示例数据
        setEntries([
          {
            id: 1,
            title: '今天是个好日子',
            content: '今天我们一起去了公园，阳光很好，心情也很愉快。',
            date: '2024-01-20',
            mood: '开心',
            weather: '晴天',
            images: []
          }
        ])
      }
    } catch (error) {
      console.error('获取日记失败:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const savedEntries = localStorage.getItem('diaryEntries')
      let entries = savedEntries ? JSON.parse(savedEntries) : []
      
      if (editingEntry) {
        entries = entries.map(entry => 
          entry.id === editingEntry.id 
            ? { ...entry, ...formData }
            : entry
        )
      } else {
        const newEntry = {
          id: Date.now(),
          ...formData
        }
        entries.push(newEntry)
      }
      
      // 按日期排序，最新的在前面
      entries.sort((a, b) => new Date(b.date) - new Date(a.date))
      
      localStorage.setItem('diaryEntries', JSON.stringify(entries))
      
      setShowForm(false)
      setEditingEntry(null)
      setFormData({ title: '', content: '', date: '', mood: '开心', weather: '晴天', images: [] })
      fetchEntries()
    } catch (error) {
      console.error('保存日记失败:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这篇日记吗？')) return

    try {
      const savedEntries = localStorage.getItem('diaryEntries')
      if (savedEntries) {
        const entries = JSON.parse(savedEntries).filter(entry => entry.id !== id)
        localStorage.setItem('diaryEntries', JSON.stringify(entries))
        fetchEntries()
      }
    } catch (error) {
      console.error('删除日记失败:', error)
    }
  }

  const moods = ['开心', '难过', '激动', '平静', '思念', '感动']
  const weathers = ['晴天', '多云', '雨天', '雪天', '阴天', '大风']

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
        {entries.map((entry) => (
          <div key={entry.id} className="glass-card p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">{entry.title}</h3>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(entry.date).toLocaleDateString('zh-CN')}
                  <span className="mx-2">•</span>
                  心情: {entry.mood}
                  <span className="mx-2">•</span>
                  天气: {entry.weather}
                </div>
                <p className="text-gray-700 mb-3">{entry.content}</p>
                {entry.images && entry.images.length > 0 && (
                  <div className="flex space-x-2">
                    {entry.images.map((img, index) => (
                      <img key={index} src={img} alt="" className="h-16 w-16 object-cover rounded" />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => {
                    setEditingEntry(entry)
                    setFormData(entry)
                    setShowForm(true)
                  }}
                  className="flex items-center px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="flex items-center px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
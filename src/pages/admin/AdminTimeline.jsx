import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'

export default function AdminTimeline() {
  const [events, setEvents] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    category: '日常',
    images: []
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      // 使用本地存储代替API
      const savedEvents = localStorage.getItem('timelineEvents')
      if (savedEvents) {
        setEvents(JSON.parse(savedEvents))
      } else {
        // 默认示例数据
        setEvents([
          {
            id: 1,
            title: '我们的第一次约会',
            description: '在咖啡厅度过了美好的下午时光',
            date: '2024-01-15',
            location: '星巴克',
            category: '约会',
            images: []
          }
        ])
      }
    } catch (error) {
      console.error('获取事件失败:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const savedEvents = localStorage.getItem('timelineEvents')
      let events = savedEvents ? JSON.parse(savedEvents) : []
      
      if (editingEvent) {
        // 编辑现有事件
        events = events.map(event => 
          event.id === editingEvent.id 
            ? { ...event, ...formData }
            : event
        )
      } else {
        // 添加新事件
        const newEvent = {
          id: Date.now(),
          ...formData
        }
        events.push(newEvent)
      }
      
      // 按日期排序，最新的在前面
      events.sort((a, b) => new Date(b.date) - new Date(a.date))
      
      // 保存到本地存储
      localStorage.setItem('timelineEvents', JSON.stringify(events))
      
      setShowForm(false)
      setEditingEvent(null)
      setFormData({ title: '', description: '', date: '', location: '', category: '日常', images: [] })
      fetchEvents()
    } catch (error) {
      console.error('保存事件失败:', error)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个事件吗？')) return

    try {
      const savedEvents = localStorage.getItem('timelineEvents')
      if (savedEvents) {
        const events = JSON.parse(savedEvents).filter(event => event.id !== id)
        localStorage.setItem('timelineEvents', JSON.stringify(events))
        fetchEvents()
      }
    } catch (error) {
      console.error('删除事件失败:', error)
    }
  }

  const categories = ['约会', '旅行', '节日', '日常']

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">时间轴管理</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          添加事件
        </button>
      </div>

      {showForm && (
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingEvent ? '编辑事件' : '添加新事件'}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows="3"
              />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">地点</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                  setEditingEvent(null)
                  setFormData({ title: '', description: '', date: '', location: '', category: '日常', images: [] })
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
        {events.map((event) => (
          <div key={event.id} className="glass-card p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-800">{event.title}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(event.date).toLocaleDateString('zh-CN')} · {event.category}
                </p>
                <p className="text-sm text-gray-700 mt-1">{event.description}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingEvent(event)
                    setFormData({
                      title: event.title,
                      description: event.description,
                      date: event.date,
                      location: event.location,
                      category: event.category,
                      images: event.images || []
                    })
                    setShowForm(true)
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { apiRequest } from '../../utils/api.js'
import { Plus, Edit, Trash2 } from 'lucide-react'
import AdminModal from '../../components/AdminModal'
import { useAdminModal } from '../../hooks/useAdminModal'

export default function AdminTimeline() {
  const [events, setEvents] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const { modalState, showAlert, showConfirm, closeModal } = useAdminModal()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    category: '日常',
    images: []
  })

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await apiRequest('/api/timeline');
      setEvents(data);
    } catch (error) {
      console.error('获取时间轴事件失败:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 验证必填字段
    if (!formData.title || !formData.date) {
      await showAlert('提示', '标题和日期不能为空！', 'warning');
      return;
    }

    const eventData = {
      title: formData.title,
      description: formData.description,
      date: formData.date,
      location: formData.location,
      category: formData.category,
      images: formData.images
    };

    try {
      console.log('正在保存时间轴事件:', eventData);
      
      if (editingEvent) {
        await apiRequest(`/api/timeline/${editingEvent.id}`, {
          method: 'PUT',
          body: JSON.stringify(eventData)
        })
        console.log('时间轴事件更新成功');
      } else {
        await apiRequest('/api/timeline', {
          method: 'POST',
          body: JSON.stringify(eventData)
        })
        console.log('时间轴事件创建成功');
      }
      
      await loadEvents();
      setShowForm(false);
      setEditingEvent(null);
      setFormData({ title: '', description: '', date: '', location: '', category: '日常', images: [] });
      
      await showAlert('成功', '保存成功！', 'success');
    } catch (error) {
      console.error('保存时间节点失败:', error);
      await showAlert('错误', '保存失败: ' + error.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm('确认删除', '确定要删除这个时间节点吗？', '删除');
    if (!confirmed) return;

    try {
      await apiRequest(`/api/timeline/${id}`, {
        method: 'DELETE'
      });
      loadEvents();
    } catch (error) {
      console.error('删除时间节点失败:', error);
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
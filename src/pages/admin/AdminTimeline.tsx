import { useState, useEffect } from 'react'
import { apiService } from '../../services/apiService.js'
import { Plus, Edit, Trash2 } from 'lucide-react'
import AdminModal from '../../components/AdminModal'
import { useAdminModal } from '../../hooks/useAdminModal'
import ImageUploader from '../../components/ImageUploader'

// 定义时间轴事件接口
interface TimelineEvent {
  id?: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  images: string[];
}

// 定义表单数据接口
interface FormData {
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  images: string[];
}

const AdminTimeline: React.FC = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null)
  const { modalState, showAlert, showConfirm, closeModal } = useAdminModal()
  const [formData, setFormData] = useState<FormData>({
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
      const { data, error } = await apiService.get('/timeline');
      if (error) {
        console.error('获取时间轴事件失败:', error);
        setEvents([]);
        return;
      }
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('获取时间轴事件失败:', error);
      setEvents([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证必填字段
    if (!formData.title || !formData.date) {
      await showAlert('提示', '标题和日期不能为空！', 'warning');
      return;
    }

    const eventData: TimelineEvent = {
      title: formData.title,
      description: formData.description,
      date: formData.date,
      location: formData.location,
      category: formData.category,
      images: formData.images
    };

    try {
      if (editingEvent) {
        await apiService.put(`/timeline/${editingEvent.id}`, eventData)
      } else {
        await apiService.post('/timeline', eventData)
      }
      
      await loadEvents();
      setShowForm(false);
      setEditingEvent(null);
      setFormData({ title: '', description: '', date: '', location: '', category: '日常', images: [] });
      
      await showAlert('成功', '保存成功！', 'success');
    } catch (error) {
      console.error('保存时间节点失败:', error);
      await showAlert('错误', '保存失败: ' + (error as Error).message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm('确认删除', '确定要删除这个时间节点吗？', '删除');
    if (!confirmed) return;

    try {
      await apiService.delete(`/timeline/${id}`);
      loadEvents();
    } catch (error) {
      console.error('删除时间节点失败:', error);
    }
  }

  const categories = ['约会', '旅行', '节日', '日常']

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6 animate-slide-in-left">
        <h1 className="text-2xl font-bold text-gray-800">时间轴管理</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg transform transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
        >
          <Plus className="h-4 w-4 mr-2 transition-transform duration-200 group-hover:rotate-90" />
          添加事件
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-light text-gray-800">
                {editingEvent ? '编辑时间轴事件' : '创建新事件'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingEvent(null)
                  setFormData({ title: '', description: '', date: '', location: '', category: '日常', images: [] })
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 极简优雅的配色方案，统一使用莫兰迪色系0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-gray-50/50 transition-all duration-200 placeholder-gray-400"
                  placeholder="给这个时间节点起个名字"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-gray-50/50 transition-all duration-200 placeholder-gray-400 resize-none"
                  placeholder="描述这个特殊时刻的细节和感受..."
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">日期 *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-gray-50/50 transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-gray-50/50 transition-all duration-200"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">地点</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-gray-50/50 transition-all duration-200 placeholder-gray-400"
                  placeholder="在哪里发生的？"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">照片</label>
                <ImageUploader
                  onImagesUploaded={(newImages) => {
                    setFormData(prev => ({
                      ...prev,
                      images: [...(prev.images || []), ...newImages]
                    }));
                  }}
                  onRemoveImage={(index) => {
                    setFormData(prev => ({
                      ...prev,
                      images: prev.images.filter((_, i) => i !== index)
                    }));
                  }}
                  existingImages={formData.images || []}
                  maxImages={6}
                  folder="timeline"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingEvent(null)
                    setFormData({ title: '', description: '', date: '', location: '', category: '日常', images: [] })
                  }}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all duration-200 font-medium shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30"
                >
                  {editingEvent ? '更新事件' : '创建事件'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {events.map((event, index) => (
          <div 
            key={event.id} 
            className="glass-card p-4 transform transition-all duration-300 hover:shadow-lg hover:scale-[1.02] animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-800 transition-colors duration-200 hover:text-pink-600">{event.title}</h3>
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
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transform transition-all duration-200 hover:scale-110 hover:bg-blue-100"
                >
                  <Edit className="h-4 w-4 transition-transform duration-200 hover:rotate-12" />
                </button>
                <button
                  onClick={() => handleDelete(event.id!)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transform transition-all duration-200 hover:scale-110 hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4 transition-transform duration-200 hover:rotate-12" />
                </button>
              </div>
            </div>
          </div>
        ))}
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

export default AdminTimeline
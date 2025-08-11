import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { Plus, X, Trash2, Edit2, Upload, Calendar, CheckSquare } from 'lucide-react';
import ImageUploader from '../../components/ImageUploader';
import AdminModal from '../../components/AdminModal';
import { useAdminModal } from '../../hooks/useAdminModal';

export default function AdminTodos() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const { modalState, showAlert, showConfirm, closeModal } = useAdminModal();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 3,
    category: 'general',
    due_date: '',
    status: 'pending'
  });
  const [completionData, setCompletionData] = useState({
    notes: '',
    photos: []
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const data = await apiRequest('/api/todos');
      setTodos(data);
    } catch (error) {
      console.error('获取待办事项失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      await showAlert('提示', '请输入待办事项标题', 'warning');
      return;
    }
    
    const todoData = {
      ...formData,
      ...(formData.status === 'completed' ? completionData : {})
    };

    try {
      if (editingTodo) {
        await apiRequest(`/api/todos/${editingTodo.id}`, {
          method: 'PUT',
          body: JSON.stringify(todoData)
        });
        await showAlert('成功', '待办事项更新成功！', 'success');
      } else {
        await apiRequest('/api/todos', {
          method: 'POST',
          body: JSON.stringify(todoData)
        });
        await showAlert('成功', '待办事项创建成功！', 'success');
      }
      
      setShowForm(false);
      setEditingTodo(null);
      resetForm();
      fetchTodos();
    } catch (error) {
      console.error('保存待办事项失败:', error);
      await showAlert('错误', `保存失败: ${error.message || '请检查网络连接后重试'}`, 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 3,
      category: 'general',
      due_date: '',
      status: 'pending'
    });
    setCompletionData({ notes: '', photos: [] });
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm('确认删除', '确定要删除这个待办事项吗？此操作不可恢复！', '删除');
    if (!confirmed) return;

    try {
      await apiRequest(`/api/todos/${id}`, {
        method: 'DELETE'
      });
      await showAlert('成功', '待办事项删除成功！', 'success');
      fetchTodos();
    } catch (error) {
      console.error('删除失败:', error);
      await showAlert('错误', `删除失败: ${error.message || '请重试'}`, 'error');
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadedUrls = [];

    try {
      for (let file of files) {
        if (file.size > 5 * 1024 * 1024) {
          alert('图片大小不能超过5MB');
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'bbkk_todos');

        const response = await fetch('https://api.cloudinary.com/v1_1/demo/image/upload', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        if (result.secure_url) {
          uploadedUrls.push(result.secure_url);
        }
      }

      setCompletionData(prev => ({
        ...prev,
        photos: [...prev.photos, ...uploadedUrls]
      }));
    } catch (error) {
      console.error('上传失败:', error);
      alert('图片上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title || '',
      description: todo.description || '',
      priority: todo.priority || 3,
      category: todo.category || 'general',
      due_date: todo.due_date || '',
      status: todo.status || 'pending'
    });
    if (todo.status === 'completed' && todo.completion) {
      setCompletionData({
        notes: todo.completion.notes || '',
        photos: todo.completion.photos || []
      });
    } else {
      setCompletionData({ notes: '', photos: [] });
    }
    setShowForm(true);
  };

  const openCreateModal = () => {
    setEditingTodo(null);
    resetForm();
    setShowForm(true);
  };

  const removePhoto = (index) => {
    setCompletionData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">加载待办事项中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-light text-gray-800">待办事项管理</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg"
        >
          <Plus className="h-4 w-4 mr-2" />
          新建待办
        </button>
      </div>



      {/* 待办事项列表 */}
      <div className="grid gap-4">
        {todos.map((todo) => (
          <div key={todo.id} className="glass-card p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{todo.title}</h3>
                {todo.description && (
                  <p className="text-gray-600 text-sm mb-3">{todo.description}</p>
                )}
                <div className="flex items-center space-x-4 text-sm">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    todo.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : todo.status === 'in_progress'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {todo.status === 'completed' ? '已完成' : todo.status === 'in_progress' ? '进行中' : '待办'}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    todo.priority >= 4 
                      ? 'bg-red-100 text-red-800' 
                      : todo.priority >= 3
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {todo.priority >= 4 ? '高优先级' : todo.priority >= 3 ? '中优先级' : '低优先级'}
                  </span>
                  <span className="text-gray-500">
                    截止：{todo.due_date ? new Date(todo.due_date).toLocaleDateString('zh-CN') : '无'}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleEdit(todo)}
                  className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(todo.id)}
                  className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 新建/编辑表单 */}
      {showForm && (
        <div className="glass-card p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingTodo ? '编辑待办事项' : '新建待办事项'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="输入待办标题"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="详细描述待办内容"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value={1}>低</option>
                  <option value={2}>中低</option>
                  <option value={3}>中</option>
                  <option value={4}>中高</option>
                  <option value={5}>高</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="general">通用</option>
                  <option value="work">工作</option>
                  <option value="life">生活</option>
                  <option value="study">学习</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="pending">待办</option>
                  <option value="in_progress">进行中</option>
                  <option value="completed">已完成</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">截止日期</label>
              <input
                type="date"
                name="due_date"
                value={formData.due_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            {formData.status === 'completed' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">完成备注</label>
                  <textarea
                    name="notes"
                    value={completionData.notes}
                    onChange={(e) => setCompletionData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="记录完成这个待办的心得体会..."
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">完成照片</label>
                  <ImageUploader
                    photos={completionData.photos}
                    onPhotoUpload={handlePhotoUpload}
                    onRemovePhoto={removePhoto}
                    uploading={uploading}
                  />
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg disabled:opacity-50"
              >
                {editingTodo ? '更新待办' : '创建待办'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 空状态提示 */}
      {todos.length === 0 && !showForm && (
        <div className="glass-card p-12 text-center">
          <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无待办事项</h3>
          <p className="text-gray-600">点击上方按钮创建第一个待办事项吧</p>
        </div>
      )}

    </div>
  );
}
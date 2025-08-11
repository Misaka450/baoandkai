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

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const data = await apiRequest('/todos');
      setTodos(data);
    } catch (error) {
      console.error('获取待办事项失败:', error);
    } finally {
      setLoading(false);
    }
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
        await apiRequest(`/todos/${editingTodo.id}`, {
          method: 'PUT',
          body: JSON.stringify(todoData)
        });
        await showAlert('成功', '待办事项更新成功！', 'success');
      } else {
        await apiRequest('/todos', {
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
      await apiRequest(`/todos/${id}`, {
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

      {showForm && (
        <div className="glass-card p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingTodo ? '编辑待办事项' : '新建待办事项'}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标题 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入待办事项标题"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  截止日期
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="请输入详细描述"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  优先级
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[1,2,3,4,5].map(p => (
                    <option key={p} value={p}>
                      {p} - {p === 5 ? '最高' : p === 4 ? '高' : p === 3 ? '中' : p === 2 ? '低' : '最低'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分类
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="general">日常</option>
                  <option value="travel">旅行</option>
                  <option value="anniversary">纪念日</option>
                  <option value="gift">礼物</option>
                  <option value="other">其他</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                状态
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pending">待办</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>

            {formData.status === 'completed' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    完成备注
                  </label>
                  <textarea
                    value={completionData.notes}
                    onChange={(e) => setCompletionData({...completionData, notes: e.target.value})}
                    placeholder="记录完成时的感受、过程等..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    完成照片
                  </label>
                  <ImageUploader
                    onImagesUploaded={(urls) => setCompletionData(prev => ({
                      ...prev,
                      photos: [...prev.photos, ...urls]
                    }))}
                    maxImages={5}
                  />
                  
                  {completionData.photos.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {completionData.photos.map((photo, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={photo}
                            alt={`完成照片 ${idx + 1}`}
                            className="w-full h-20 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => setCompletionData(prev => ({
                              ...prev,
                              photos: prev.photos.filter((_, i) => i !== idx)
                            }))}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all"
              >
                {editingTodo ? '更新待办' : '创建待办'}
              </button>
            </div>
          </form>
        </div>
      )}

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

      {todos.length === 0 && !showForm && (
        <div className="glass-card p-12 text-center">
          <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无待办事项</h3>
          <p className="text-gray-600">点击上方按钮创建第一个待办事项吧</p>
        </div>
      )}

      {/* 模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTodo ? '编辑待办事项' : '新建待办事项'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标题 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入待办事项标题"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="请输入详细描述"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    优先级
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {[1,2,3,4,5].map(p => (
                      <option key={p} value={p}>
                        {p} - {p === 5 ? '最高' : p === 4 ? '高' : p === 3 ? '中' : p === 2 ? '低' : '最低'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分类
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="general">日常</option>
                    <option value="travel">旅行</option>
                    <option value="anniversary">纪念日</option>
                    <option value="gift">礼物</option>
                    <option value="other">其他</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    截止日期
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    状态
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">待办</option>
                    <option value="in_progress">进行中</option>
                    <option value="completed">已完成</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </div>
              </div>

              {formData.status === 'completed' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      完成备注
                    </label>
                    <textarea
                      value={completionData.notes}
                      onChange={(e) => setCompletionData({...completionData, notes: e.target.value})}
                      placeholder="记录完成时的感受、过程等..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      完成照片
                    </label>
                    <div className="flex items-center space-x-3">
                      <label className="cursor-pointer px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all">
                        <Upload className="w-4 h-4 inline mr-2" />
                        选择照片
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                      {uploading && (
                        <span className="text-sm text-gray-600 flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                          上传中...
                        </span>
                      )}
                    </div>
                    
                    {completionData.photos.length > 0 && (
                      <div className="mt-4 grid grid-cols-4 gap-2">
                        {completionData.photos.map((photo, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={photo}
                              alt={`完成照片 ${idx + 1}`}
                              className="w-full h-20 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removePhoto(idx)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs hover:bg-red-600 transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all"
                >
                  {editingTodo ? '更新待办' : '创建待办'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
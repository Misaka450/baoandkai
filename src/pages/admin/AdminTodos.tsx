import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import { Plus, X, Trash2, Edit2, Upload, Calendar, CheckSquare } from 'lucide-react';
import ImageUploader from '../../components/ImageUploader';
import AdminModal from '../../components/AdminModal';
import { useAdminModal } from '../../hooks/useAdminModal';

// 定义待办事项接口
interface Todo {
  id?: string;
  title: string;
  description: string;
  priority: number;
  category: string;
  due_date: string;
  status: string;
  completion_notes?: string;
  completion_photos?: string[];
}

// 定义表单数据接口
interface FormData {
  title: string;
  description: string;
  priority: number;
  category: string;
  due_date: string;
  status: string;
}

// 定义完成数据接口
interface CompletionData {
  notes: string;
  photos: string[];
}

const AdminTodos: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;
  const { modalState, showAlert, showConfirm, closeModal } = useAdminModal();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    priority: 3,
    category: 'general',
    due_date: '',
    status: 'pending'
  });
  const [completionData, setCompletionData] = useState<CompletionData>({
    notes: '',
    photos: []
  });

  useEffect(() => {
    fetchTodos(currentPage);
  }, [currentPage]);

  const fetchTodos = async (page = 1) => {
    try {
      setLoading(true);
      const { data } = await apiService.get(`/todos?page=${page}&limit=${itemsPerPage}`);
      setTodos(Array.isArray(data.data) ? data.data : []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
      setCurrentPage(data.currentPage || 1);
      setError(null);
    } catch (err) {
      setError('获取待办事项失败');
      console.error('获取待办事项失败:', err);
      setTodos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      await showAlert('提示', '请输入待办事项标题', 'warning');
      return;
    }
    
    // 映射管理员字段到数据库字段
    const todoData: Partial<Todo> = {
      title: formData.title,
      description: formData.description,
      status: formData.status,
      priority: Number(formData.priority),
      category: formData.category,
      due_date: formData.due_date,
      ...(formData.status === 'completed' ? {
        completion_notes: completionData.notes,
        completion_photos: completionData.photos
      } : {})
    };

    try {
      if (editingTodo) {
        await apiService.put(`/todos/${editingTodo.id}`, todoData);
        await showAlert('✅ 更新成功', '待办事项已更新！', 'success');
      } else {
        await apiService.post('/todos', todoData);
        await showAlert('✅ 创建成功', '待办事项已创建！', 'success');
      }

      setShowForm(false);
      setEditingTodo(null);
      resetForm();
      fetchTodos(currentPage);
    } catch (error) {
      console.error('保存待办事项失败:', error);
      await showAlert('❌ 保存失败', `保存失败: ${(error as Error).message || '请检查网络连接后重试'}`, 'error');
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

  const handleDelete = async (id: string) => {
    console.log('开始删除待办事项，ID:', id);
    
    // 找到对应的待办事项标题，用于更友好的提示
    const todoToDelete = todos.find(todo => todo.id === id);
    const todoTitle = todoToDelete?.title || '这个待办事项';
    
    const confirmed = await showConfirm(
      '⚠️ 确认删除', 
      `确定要删除 "${todoTitle}" 吗？此操作不可恢复！`,
      '删除'
    );
    if (!confirmed) return;

    try {
      console.log('用户确认删除，正在调用API...');
      const response = await apiService.delete(`/todos/${id}`);
      console.log('删除API响应:', response);
      
      // 如果删除的是最后一页的最后一条，跳转到上一页
      const newCurrentPage = todos.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      await fetchTodos(newCurrentPage);
      
      await showAlert('✅ 删除成功', '待办事项删除成功！', 'success');
    } catch (error) {
      console.error('删除失败:', error);
      await showAlert('❌ 删除失败', `删除失败: ${(error as Error).message || '请重试'}`, 'error');
    }
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title || '',
      description: todo.description || '',
      priority: todo.priority || 3,
      category: todo.category || 'general',
      due_date: todo.due_date || '',
      status: todo.status || 'pending'
    });
    if (todo.status === 'completed') {
      setCompletionData({
        notes: todo.completion_notes || '',
        photos: Array.isArray(todo.completion_photos) ? todo.completion_photos : []
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

  const removePhoto = (index: number) => {
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

      {/* 分页信息 */}
      <div className="mb-4 text-sm text-gray-600">
        共 {totalCount} 个待办事项，第 {currentPage} 页 / 共 {totalPages} 页
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
                      : todo.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : todo.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {todo.status === 'completed' ? '已完成' : todo.status === 'pending' ? '待办' : todo.status === 'cancelled' ? '已取消' : '未知'}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    todo.priority >= 3 
                      ? 'bg-red-100 text-red-800' 
                      : todo.priority >= 2
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {todo.priority >= 3 ? '高优先级' : todo.priority >= 2 ? '中优先级' : '低优先级'}
                  </span>
                  <span className="text-gray-500">
                    截止：{todo.due_date ? new Date(todo.due_date).toLocaleDateString('zh-CN') : '无'}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-1 ml-4">
                <button
                  onClick={() => handleEdit(todo)}
                  className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-md"
                  title="编辑待办"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(todo.id!)}
                  className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-md"
                  title="删除待办"
                >\n                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 分页控件 */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            上一页
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            下一页
          </button>
        </div>
      )}

      {/* 新建/编辑模态框 - 页面中央弹出 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-light text-gray-800">
                {editingTodo ? '编辑待办事项' : '创建新的待办'}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">标题 *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-gray-50/50 transition-all duration-200 placeholder-gray-400"
                  placeholder="给待办事项起个名字"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">详细描述</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-gray-50/50 transition-all duration-200 placeholder-gray-400 resize-none"
                  placeholder="详细描述这个待办事项的内容和要求..."
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">优先级</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-gray-50/50 transition-all duration-200"
                  >
                    <option value={1}>🟢 低优先级</option>
                    <option value={2}>🟡 中优先级</option>
                    <option value={3}>🔴 高优先级</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-gray-50/50 transition-all duration-200"
                  >
                    <option value="general">📋 通用</option>
                    <option value="work">💼 工作</option>
                    <option value="life">🏠 生活</option>
                    <option value="study">📚 学习</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-gray-50/50 transition-all duration-200"
                  >
                    <option value="pending">⏳ 待办</option>
                    <option value="completed">✅ 已完成</option>
                    <option value="cancelled">❌ 已取消</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">截止日期</label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-gray-50/50 transition-all duration-200"
                  />
                </div>
              </div>

              {formData.status === 'completed' && (
                <div className="space-y-4 border-t border-gray-100 pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">完成备注</label>
                    <textarea
                      name="notes"
                      value={completionData.notes}
                      onChange={(e) => setCompletionData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-gray-50/50 transition-all duration-200 placeholder-gray-400 resize-none"
                      placeholder="分享完成这个待办的心得体会和经验..."
                      rows="2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">完成照片</label>
                    <ImageUploader
                      existingImages={completionData.photos || []}
                      onImagesUploaded={(urls) => {
                        setCompletionData(prev => ({
                          ...prev,
                          photos: [...(prev.photos || []), ...urls]
                        }));
                      }}
                      onRemoveImage={removePhoto}
                      maxImages={10}
                      folder="todos"
                      maxFileSize={5 * 1024 * 1024} // 5MB限制
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all duration-200 font-medium shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30"
                >
                  {editingTodo ? '更新待办' : '创建待办'}
                </button>
              </div>
            </form>
          </div>
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

      {/* 模态框组件 - 用于确认删除和提示信息 */}
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
  );
};

export default AdminTodos
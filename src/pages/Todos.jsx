import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import { CheckSquare, Clock, Calendar, Tag, AlertCircle } from 'lucide-react';

export default function Todos() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, completed

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

  const getFilteredTodos = () => {
    if (filter === 'all') return todos;
    return todos.filter(todo => todo.status === filter);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      1: 'bg-gray-100 text-gray-600',
      2: 'bg-blue-100 text-blue-600',
      3: 'bg-yellow-100 text-yellow-600',
      4: 'bg-orange-100 text-orange-600',
      5: 'bg-red-100 text-red-600'
    };
    return colors[priority] || colors[1];
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      completed: 'bg-green-50 text-green-700 border-green-200',
      cancelled: 'bg-gray-50 text-gray-500 border-gray-200'
    };
    return colors[status] || colors.pending;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-flex flex-col items-center space-y-3">
              <div className="animate-pulse">
                <CheckSquare className="w-12 h-12 text-stone-400 mx-auto mb-4" />
                <div className="h-2 bg-stone-200 rounded-full w-48 mb-4"></div>
                <div className="h-1.5 bg-stone-200 rounded-full w-32"></div>
              </div>
              <div className="mt-8 space-y-4 w-full max-w-md">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-stone-200 rounded w-3/4"></div>
                      <div className="h-3 bg-stone-200 rounded w-1/2"></div>
                      <div className="flex space-x-2 mt-3">
                        <div className="h-6 bg-stone-200 rounded-full w-16"></div>
                        <div className="h-6 bg-stone-200 rounded-full w-20"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredTodos = getFilteredTodos();

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <CheckSquare className="w-12 h-12 text-stone-800 mx-auto mb-4" />
            <h1 className="text-4xl font-light text-stone-800 mb-4">我们的待办事项</h1>
            <p className="text-stone-600 font-light">一起完成的小目标，记录我们的点点滴滴</p>
          </div>

        {/* 筛选器 */}
        <div className="flex justify-center space-x-2 mb-8">
          {[
            { value: 'all', label: '全部' },
            { value: 'pending', label: '待办' },
            { value: 'completed', label: '已完成' }
          ].map((filterItem) => (
            <button
              key={filterItem.value}
              onClick={() => setFilter(filterItem.value)}
              className={`px-4 py-2 rounded-full text-sm font-light transition-all ${
                filter === filterItem.value
                  ? 'bg-stone-800 text-white shadow-lg'
                  : 'bg-white/70 text-stone-600 hover:bg-white hover:shadow-md border border-white/20'
              }`}
            >
              {filterItem.label}
            </button>
          ))}
        </div>

        {/* 待办事项列表 */}
        <div className="space-y-4">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-16">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 max-w-sm mx-auto border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
              <AlertCircle className="w-16 h-16 text-stone-400 mx-auto mb-4" />
              <h3 className="text-lg font-light text-stone-700 mb-2">暂无待办事项</h3>
              <p className="text-sm text-stone-500 font-light">让我们从创建第一个待办开始吧！</p>
            </div>
          </div>
          ) : (
            filteredTodos.map(todo => (
              <div
                key={todo.id}
                className="backdrop-blur-sm bg-white/60 border border-white/20 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)] transition-all duration-500 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-light text-stone-800 mb-2">
                      {todo.title}
                    </h3>
                    
                    {todo.description && (
                      <p className="text-stone-600 text-sm font-light mb-3 leading-relaxed">{todo.description}</p>
                    )}

                    <div className="flex items-center space-x-4 text-sm">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-light ${
                      todo.priority === 5 ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                      todo.priority === 4 ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                      todo.priority === 3 ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      todo.priority === 2 ? 'bg-sky-100 text-sky-700 border border-sky-200' :
                      'bg-stone-100 text-stone-700 border border-stone-200'
                    }`}>
                      优先级 {todo.priority}
                    </span>
                      
                      {todo.category !== 'general' && (
                        <span className="inline-flex items-center text-stone-600 font-light">
                          <Tag className="w-3 h-3 mr-1" />
                          {todo.category}
                        </span>
                      )}
                      
                      {todo.due_date && (
                        <span className="inline-flex items-center text-stone-600 font-light">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(todo.due_date)}
                        </span>
                      )}
                    </div>

                    {todo.status === 'completed' && todo.completed_at && (
                  <div className="mt-3 pt-3 border-t border-stone-200">
                    <p className="text-sm text-green-700 font-light">
                      ✅ 完成于 {formatDate(todo.completed_at)}
                    </p>
                    
                    {todo.completion_notes && (
                      <p className="text-sm text-stone-700 mt-1 font-light leading-relaxed">
                        💬 {todo.completion_notes}
                      </p>
                    )}
                    
                    {todo.completion_photos && todo.completion_photos.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-stone-600 mb-1 font-light">完成照片:</p>
                    <div className="flex space-x-2">
                      {todo.completion_photos.slice(0, 3).map((photo, idx) => (
                        <img
                          key={idx}
                          src={photo}
                          alt="完成照片"
                          className="w-16 h-16 rounded-xl object-cover border border-stone-200 transition-transform hover:scale-110"
                        />
                      ))}
                      {todo.completion_photos.length > 3 && (
                        <span className="text-xs text-stone-600 self-center font-light">
                          +{todo.completion_photos.length - 3}
                        </span>
                      )}
                    </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
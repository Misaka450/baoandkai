import { useState, useEffect } from 'react'
import { CheckSquare, Clock, Calendar, Tag, Plus, Heart, Camera, Star, Trash2, Edit3 } from 'lucide-react'
import { apiRequest } from '../utils/api'

export default function Todos() {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, completed
  const [showForm, setShowForm] = useState(false)
  const [editingTodo, setEditingTodo] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    completed: false,
    priority: 'medium',
    due_date: ''
  })

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    try {
      console.log('正在获取待办事项...')
      const data = await apiRequest('/api/todos')
      console.log('获取到的待办事项:', data)
      setTodos(data || [])
    } catch (error) {
      console.error('获取待办事项失败:', error)
      setTodos([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingTodo) {
        await apiRequest(`/api/todos/${editingTodo.id}`, 'PUT', formData)
        setEditingTodo(null)
      } else {
        await apiRequest('/api/todos', 'POST', formData)
      }
      
      setFormData({ title: '', description: '', completed: false, priority: 'medium', due_date: '' })
      setShowForm(false)
      await fetchTodos()
    } catch (error) {
      console.error('保存待办事项失败:', error)
    }
  }

  const handleDelete = async (id) => {
    try {
      await apiRequest(`/api/todos/${id}`, 'DELETE')
      await fetchTodos()
    } catch (error) {
      console.error('删除待办事项失败:', error)
    }
  }

  const handleEdit = (todo) => {
    setEditingTodo(todo)
    setFormData({
      title: todo.title || '',
      description: todo.description || '',
      completed: todo.completed || false,
      priority: todo.priority || 'medium',
      due_date: todo.due_date || ''
    })
    setShowForm(true)
  }

  const getFilteredTodos = () => {
    if (filter === 'all') return todos
    return todos.filter(todo => {
      if (filter === 'pending') return !todo.completed
      if (filter === 'completed') return todo.completed
      return true
    })
  }

  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200'
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-pulse">
              <CheckSquare className="w-12 h-12 text-stone-400 mx-auto mb-4" />
              <div className="h-2 bg-stone-200 rounded-full w-48 mb-4"></div>
              <div className="h-1.5 bg-stone-200 rounded-full w-32"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const filteredTodos = getFilteredTodos()

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <CheckSquare className="w-12 h-12 text-stone-800 mx-auto mb-4" />
          <h1 className="text-4xl font-light text-stone-800 mb-4">我们的待办事项</h1>
          <p className="text-stone-600 font-light">一起完成的小目标，记录我们的点点滴滴</p>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-6 py-3 bg-stone-800 text-white rounded-full hover:bg-stone-700 transition-colors shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            添加待办
          </button>
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

        {/* 添加/编辑表单 */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
              <h2 className="text-2xl font-light text-stone-800 mb-6">
                {editingTodo ? '编辑待办' : '添加待办'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-light text-stone-700 mb-2">标题 *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-light text-stone-700 mb-2">描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-light text-stone-700 mb-2">优先级</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-light text-stone-700 mb-2">截止日期</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                  />
                </div>
                {editingTodo && (
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.completed}
                        onChange={(e) => setFormData({...formData, completed: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm font-light text-stone-700">已完成</span>
                    </label>
                  </div>
                )}
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-stone-800 text-white py-2 rounded-lg hover:bg-stone-700 transition-colors"
                  >
                    {editingTodo ? '更新' : '添加'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingTodo(null)
                      setFormData({ title: '', description: '', completed: false, priority: 'medium', due_date: '' })
                    }}
                    className="flex-1 bg-stone-200 text-stone-700 py-2 rounded-lg hover:bg-stone-300 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 待办事项列表 */}
        <div className="space-y-4">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 max-w-sm mx-auto border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
                <CheckSquare className="w-16 h-16 text-stone-400 mx-auto mb-4" />
                <h3 className="text-lg font-light text-stone-700 mb-2">暂无待办事项</h3>
                <p className="text-sm text-stone-500 font-light">让我们从创建第一个待办开始吧！</p>
              </div>
            </div>
          ) : (
            filteredTodos.map(todo => (
              <div
                key={todo.id}
                className={`backdrop-blur-sm bg-white/60 border border-white/20 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)] transition-all duration-500 hover:-translate-y-1 ${
                  todo.completed ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className={`p-2.5 rounded-xl mr-3 shadow-sm ${
                        todo.completed ? 'bg-green-100' : 'bg-stone-100'
                      }`}>
                        <CheckSquare className={`w-4 h-4 ${
                          todo.completed ? 'text-green-700' : 'text-stone-700'
                        }`} />
                      </div>
                      <h3 className={`text-lg font-light ${
                        todo.completed ? 'line-through text-stone-500' : 'text-stone-800'
                      }`}>
                        {todo.title}
                      </h3>
                    </div>
                    
                    {todo.description && (
                      <p className="text-stone-600 text-sm font-light mb-3 leading-relaxed">
                        {todo.description}
                      </p>
                    )}

                    <div className="flex items-center space-x-3 text-sm">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-light ${
                        priorityColors[todo.priority] || priorityColors.medium
                      }`}>
                        {todo.priority === 'high' ? '高优先级' : 
                         todo.priority === 'medium' ? '中优先级' : '低优先级'}
                      </span>
                      
                      {todo.due_date && (
                        <span className="inline-flex items-center text-stone-600 font-light">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(todo.due_date)}
                        </span>
                      )}
                      
                      <span className="inline-flex items-center text-stone-600 font-light">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(todo.created_at).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(todo)}
                      className="p-2 text-stone-600 hover:text-stone-800 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(todo.id)}
                      className="p-2 text-stone-600 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
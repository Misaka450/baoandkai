import { useState, useEffect } from 'react'
import { CheckSquare, Clock, Calendar, Tag, Heart, Camera, Star, ChevronDown } from 'lucide-react'
import { apiRequest } from '../utils/api'
import ImageModal from '../components/ImageModal'

export default function Todos() {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, completed
  const [expandedTodos, setExpandedTodos] = useState(new Set()) // 记录展开的待办ID
  const [selectedImage, setSelectedImage] = useState(null) // 当前选中的放大图片

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

// 只读模式，移除所有添加、编辑、删除功能

  // 映射数据库字段到前端字段
  const mapTodoFields = (todo) => {
    return {
      ...todo,
      completed: todo.status === 'completed',
      priority: todo.priority === 3 ? 'high' : todo.priority === 2 ? 'medium' : 'low'
    }
  }

  const getFilteredTodos = () => {
    const mappedTodos = todos.map(mapTodoFields)
    if (filter === 'all') return mappedTodos
    return mappedTodos.filter(todo => {
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

  // 切换待办的展开/收起状态
  const toggleTodoExpand = (todoId) => {
    setExpandedTodos(prev => {
      const newSet = new Set(prev)
      if (newSet.has(todoId)) {
        newSet.delete(todoId)
      } else {
        newSet.add(todoId)
      }
      return newSet
    })
  }

  // 检查待办是否展开
  const isTodoExpanded = (todoId) => expandedTodos.has(todoId)

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
                <CheckSquare className="w-16 h-16 text-stone-400 mx-auto mb-4" />
                <h3 className="text-lg font-light text-stone-700 mb-2">暂无待办事项</h3>
                <p className="text-sm text-stone-500 font-light">让我们从创建第一个待办开始吧！</p>
              </div>
            </div>
          ) : (
            filteredTodos.map(todo => (
              <div
                key={todo.id}
                className={`backdrop-blur-sm border rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1 ${
                  todo.completed 
                    ? 'bg-gradient-to-br from-green-50/90 via-emerald-50/80 to-teal-50/70 border-green-200/50 shadow-[0_8px_32px_rgba(34,197,94,0.15)] hover:shadow-[0_12px_48px_rgba(34,197,94,0.25)] ring-1 ring-green-100/50' 
                    : 'bg-white/60 border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className={`p-2.5 rounded-xl mr-3 shadow-sm ${
                        todo.completed ? 'bg-gradient-to-br from-green-100 to-emerald-100 ring-1 ring-green-200' : 'bg-stone-100'
                      }`}>
                        <CheckSquare className={`w-4 h-4 ${
                          todo.completed ? 'text-green-600' : 'text-stone-700'
                        }`} />
                      </div>
                      <h3 className={`text-lg font-light ${
                        todo.completed 
                          ? 'text-green-800 font-medium' 
                          : 'text-stone-800'
                      }`}>
                        {todo.title}
                        {todo.completed && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✨ 已完成
                          </span>
                        )}
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

                    {/* 完成照片展示 */}
                    {/* 完成记录 - 可折叠展示 */}
                    {todo.completed && (todo.completion_photos || todo.completion_notes) && (
                      <div className="mt-4">
                        <button
                          onClick={() => toggleTodoExpand(todo.id)}
                          className="flex items-center text-sm transition-colors group"
                        >
                          <Camera className="w-3 h-3 mr-1.5 text-green-600 group-hover:text-green-700 transition-transform group-hover:scale-110" />
                          <span className="text-green-700 font-medium group-hover:text-green-800">
                            {isTodoExpanded(todo.id) ? '收起记录' : '查看完成记录'}
                          </span>
                          <ChevronDown 
                            className={`w-3 h-3 ml-1.5 text-green-600 group-hover:text-green-700 transition-transform duration-200 ${
                              isTodoExpanded(todo.id) ? 'rotate-180' : ''
                            }`} 
                          />
                        </button>
                        
                        {/* 折叠内容 */}
                        <div className={`overflow-hidden transition-all duration-300 ${
                          isTodoExpanded(todo.id) ? 'max-h-96 mt-4' : 'max-h-0'
                        }`}>
                          {/* 完成照片 */}
                          {todo.completion_photos && (
                            <div className="mb-4">
                              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {(Array.isArray(todo.completion_photos) ? todo.completion_photos : 
                                  (typeof todo.completion_photos === 'string' ? JSON.parse(todo.completion_photos) : [])
                                ).map((photo, index) => (
                                  <div key={index} className="relative group">
                                    <img 
                                      src={photo} 
                                      alt={`完成照片 ${index + 1}`}
                                      className="w-full h-16 object-cover rounded-lg border-2 border-green-100 hover:border-green-300 hover:shadow-md hover:scale-105 transition-all cursor-pointer"
                                      onClick={() => setSelectedImage(photo)}
                                    />
                                    <div className="absolute inset-0 bg-green-600/0 group-hover:bg-green-600/10 rounded-lg transition-colors"></div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 完成心得 */}
                          {todo.completion_notes && (
                            <div>
                              <div className="flex items-center text-sm text-green-700 mb-2 font-medium">
                                <Heart className="w-4 h-4 mr-2 text-green-600" />
                                <span>完成心得</span>
                              </div>
                              <div className="text-sm text-green-800 bg-gradient-to-r from-green-50/80 to-emerald-50/80 rounded-xl p-4 border border-green-100 shadow-sm">
                                <div className="flex items-start">
                                  <div className="w-1 h-full bg-gradient-to-b from-green-300 to-emerald-300 rounded-full mr-3"></div>
                                  <div className="flex-1">
                                    {todo.completion_notes}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* 图片放大模态框 */}
      <ImageModal
        isOpen={selectedImage !== null}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage}
        alt="完成照片"
      />
    </div>
  )
}
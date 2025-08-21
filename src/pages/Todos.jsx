import { useState, useEffect, useCallback } from 'react'
import { CheckSquare, Clock, Calendar, Tag, Heart, Camera, Star, ChevronDown } from 'lucide-react'
import { apiService } from '../services/apiService'
import ImageModal from '../components/ImageModal'
import { debounce, formatDate, mapPriority, priorityColors, LoadingSpinner } from '../utils/common.js'

export default function Todos() {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, completed
  const [priorityFilter, setPriorityFilter] = useState('all') // all, high, medium, low
  const [expandedTodos, setExpandedTodos] = useState(new Set()) // 记录展开的待办ID
  const [selectedImage, setSelectedImage] = useState(null) // 当前选中的放大图片
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 10

  useEffect(() => {
    fetchTodos(currentPage)
  }, [currentPage])
  
  // 使用公共防抖函数
  const debouncedFetchTodos = useCallback(
    debounce((page) => {
      fetchTodos(page)
    }, 300),
    []
  )

  const fetchTodos = async (page = 1) => {
    try {
      console.log('正在获取待办事项...')
      const { data } = await apiService.get(`/api/todos?page=${page}&limit=${itemsPerPage}`)
      console.log('获取到的待办事项:', data)
      setTodos(data.data || [])
      setTotalPages(data.totalPages || 1)
      setTotalCount(data.totalCount || 0)
      setCurrentPage(data.currentPage || 1)
    } catch (error) {
      console.error('获取待办事项失败:', error)
      setTodos([])
    } finally {
      setLoading(false)
    }
  }

// 只读模式，移除所有添加、编辑、删除功能

  // 映射数据库字段到前端字段 - 简化为三种优先级
  const mapTodoFields = (todo) => {
    // 将数据库的1-5优先级映射为三种：高(3)、中(2)、低(1)
    let priority = 'medium'; // 默认中优先级
    if (todo.priority >= 3) {
      priority = 'high';
    } else if (todo.priority <= 1) {
      priority = 'low';
    }
    
    return {
      ...todo,
      completed: todo.status === 'completed',
      priority: priority
    }
  }

  const getFilteredTodos = () => {
    const mappedTodos = todos.map(mapTodoFields)
    
    // 先按完成状态筛选
    let filtered = mappedTodos
    if (filter !== 'all') {
      filtered = filtered.filter(todo => {
        if (filter === 'pending') return !todo.completed
        if (filter === 'completed') return todo.completed
        return true
      })
    }
    
    // 再按优先级筛选
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(todo => todo.priority === priorityFilter)
    }
    
    return filtered
  }

  // 移除 priorityColors 和 formatDate 的重复定义
  
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

  const isTodoExpanded = (todoId) => expandedTodos.has(todoId)

  // 使用统一的加载组件
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <CheckSquare className="w-12 h-12 text-stone-800 mx-auto mb-4" />
            <h1 className="text-4xl font-light text-stone-800 mb-4">我们的待办事项</h1>
            <p className="text-stone-600 font-light mb-8">一起完成的小目标，记录我们的点点滴滴</p>
            <LoadingSpinner message="正在加载待办事项..." />
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

        {/* 优先级筛选 */}
        <div className="flex justify-center space-x-2 mb-8">
          {['all', 'high', 'medium', 'low'].map((priority) => (
            <button
              key={priority}
              onClick={() => setPriorityFilter(priority)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                priorityFilter === priority
                  ? 'bg-stone-800 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {priority === 'all' ? '全部' : 
               priority === 'high' ? '高' :
               priority === 'medium' ? '中' : '低'}
            </button>
          ))}
        </div>



        {/* 分页信息 */}
        <div className="text-center mb-6">
          <p className="text-sm text-stone-600">
            共 {totalCount} 个待办事项，第 {currentPage} 页 / 共 {totalPages} 页
          </p>
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
                        {todo.priority === 'high' ? '高' : 
                         todo.priority === 'medium' ? '中' : '低'}
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
                                  <div 
                                    key={index} 
                                    className="relative group cursor-pointer"
                                    onClick={(e) => {
                                      console.log('图片区域被点击:', photo);
                                      e.stopPropagation();
                                      setSelectedImage(photo);
                                    }}
                                  >
                                    <img 
                                      src={photo} 
                                      alt={`完成照片 ${index + 1}`}
                                      className="w-full h-16 object-cover rounded-lg border-2 border-green-100 hover:border-green-300 hover:shadow-md hover:scale-105 transition-all pointer-events-none"
                                    />
                                    <div className="absolute inset-0 bg-green-600/0 group-hover:bg-green-600/10 rounded-lg transition-colors pointer-events-none"></div>
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

          {/* 分页控件 */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-white/60 border border-white/20 text-stone-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                        ? 'bg-stone-800 text-white'
                        : 'bg-white/60 border border-white/20 text-stone-700 hover:bg-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-white/60 border border-white/20 text-stone-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          )}
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
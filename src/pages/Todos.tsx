import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../services/apiService'
import type { Todo } from '../types'
import ImageModal from '../components/ImageModal'
import Icon from '../components/icons/Icons'

interface TodosResponse {
  data: Todo[]
  totalPages: number
  totalCount: number
  currentPage: number
}

const stickyColors = [
  { bg: 'bg-pastel-pink', border: 'border-pink-100', text: 'text-pink-700', icon: 'text-primary' },
  { bg: 'bg-pastel-blue', border: 'border-blue-100', text: 'text-blue-700', icon: 'text-blue-400' },
  { bg: 'bg-pastel-green', border: 'border-green-100', text: 'text-green-700', icon: 'text-green-400' },
  { bg: 'bg-pastel-yellow', border: 'border-yellow-100', text: 'text-yellow-700', icon: 'text-yellow-500' },
  { bg: 'bg-pastel-purple', border: 'border-purple-100', text: 'text-purple-700', icon: 'text-purple-400' },
]

export default function Todos() {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const { data: todosData, isLoading: loading } = useQuery({
    queryKey: ['todos', currentPage, itemsPerPage],
    queryFn: async () => {
      const { data, error } = await apiService.get<TodosResponse>(`/todos?page=${currentPage}&limit=${itemsPerPage}`)
      if (error) throw new Error(error)
      return data
    }
  })

  const todos = todosData?.data || []
  const totalCount = todosData?.totalCount || 0
  const completedCount = useMemo(() => todos.filter(t => t.status === 'completed').length, [todos])
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  if (loading) return <div className="min-h-screen pt-32 text-center opacity-50">加载小愿望中...</div>

  return (
    <div className="min-h-screen bg-background-light text-slate-700 transition-colors duration-300">
      <main className="pt-32 pb-20 px-4 max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">甜蜜共享清单</h1>
          <p className="text-slate-400 italic font-handwriting text-2xl">
            记录我们的每一个小愿望，一起去完成它们吧 ✨
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {todos.map((todo, idx) => {
            const isCompleted = todo.status === 'completed'
            const theme = stickyColors[idx % stickyColors.length]!
            return (
              <div
                key={todo.id}
                className={`sticky-note group relative ${theme.bg} p-8 rounded-3xl shadow-sm border ${theme.border} flex flex-col min-h-[220px]`}
              >
                <div className={`absolute top-4 right-4 ${theme.icon} opacity-20 group-hover:opacity-100 transition-opacity`}>
                  <Icon name="push_pin" size={24} />
                </div>

                <div className="flex-grow">
                  <h3 className={`font-handwriting text-2xl mb-4 ${theme.text}`}>{todo.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{todo.description}</p>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center border-2 transition-all ${isCompleted ? `border-primary animate-heart-pop` : 'border-gray-200'
                      }`}>
                      <Icon
                        name="favorite"
                        size={16}
                        className={isCompleted ? "text-primary fill-current" : "text-gray-300"}
                      />
                    </div>
                    <span className={`text-xs font-semibold uppercase tracking-wider ${isCompleted ? 'text-primary' : 'text-gray-400'}`}>
                      {isCompleted ? '已完成' : '进行中'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {todo.due_date ? new Date(todo.due_date).toLocaleDateString() : 'SOMEDAY'}
                  </span>
                </div>

                {/* 完成信息展示 */}
                {isCompleted && (
                  (todo.completion_notes || (todo.completion_photos && (Array.isArray(todo.completion_photos) ? todo.completion_photos.length > 0 : todo.completion_photos))) && (
                    <div className="mt-4 pt-4 border-t border-slate-200/50">
                      {todo.completion_notes && (
                        <p className="text-xs text-slate-500 italic mb-2">"{todo.completion_notes}"</p>
                      )}
                      {todo.completion_photos && (() => {
                        const photos = Array.isArray(todo.completion_photos)
                          ? todo.completion_photos
                          : (typeof todo.completion_photos === 'string' ? todo.completion_photos.split(',').filter(Boolean) : [])
                        return photos.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {photos.slice(0, 3).map((photo, i) => (
                              <img
                                key={i}
                                src={photo}
                                alt="完成照片"
                                className="w-12 h-12 rounded-lg object-cover cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => setSelectedImage(photo)}
                              />
                            ))}
                          </div>
                        )
                      })()}
                    </div>
                  ))}
              </div>
            )
          })}

          <div className="group relative bg-slate-50 p-8 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center min-h-[220px] cursor-pointer hover:bg-slate-100 transition-colors">
            <Icon name="add_circle" size={40} className="text-slate-300 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-slate-400 text-sm font-medium">在管理后台添加愿望</span>
          </div>
        </div>

        {/* 进度条 */}
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-bold text-lg">我们的进度</h4>
            <span className="text-primary font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
            <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="mt-6 text-center text-sm text-slate-400 italic">
            “我们已经共同完成了 {completedCount} 个小目标，还有许多美好的明天在等着我们。”
          </p>
        </div>
      </main>

      <ImageModal
        isOpen={selectedImage !== null}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage || undefined}
      />
    </div>
  )
}
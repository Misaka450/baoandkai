import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../services/apiService'
import type { Todo } from '../types'
import ImageModal from '../components/ImageModal'
import Icon from '../components/icons/Icons'
import { Skeleton } from '../components/Skeleton'

interface TodosResponse {
  data: Todo[]
  totalPages: number
  totalCount: number
  currentPage: number
}

const stickyColors = [
  { bg: 'bg-[#FFF9F0]', border: 'border-[#F0E6D2]', text: 'text-amber-900', accent: 'bg-amber-100', icon: 'text-amber-300' },
  { bg: 'bg-[#F0FAFF]', border: 'border-[#D2E6F0]', text: 'text-blue-900', accent: 'bg-blue-100', icon: 'text-blue-300' },
  { bg: 'bg-[#FFF0F5]', border: 'border-[#F0D2E6]', text: 'text-rose-900', accent: 'bg-rose-100', icon: 'text-rose-300' },
  { bg: 'bg-[#F5F0FF]', border: 'border-[#E6D2F0]', text: 'text-indigo-900', accent: 'bg-indigo-100', icon: 'text-indigo-300' },
  { bg: 'bg-[#F0FFF5]', border: 'border-[#D2F0E6]', text: 'text-emerald-900', accent: 'bg-emerald-100', icon: 'text-emerald-300' },
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

  if (loading) return (
    <div className="min-h-screen pt-40 max-w-6xl mx-auto px-6 text-center">
      <Skeleton className="h-12 w-64 mx-auto mb-4" />
      <Skeleton className="h-4 w-48 mx-auto mb-16" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-[2rem]" />)}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen text-slate-700 transition-colors duration-300">
      <main className="max-w-6xl mx-auto px-6 pb-32 pt-40 relative">
        <header className="text-center mb-24 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-black text-gradient tracking-tight mb-6">愿望清单</h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest leading-relaxed">
            Dream it. Wish it. Do it together.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-24">
          {todos.map((todo, idx) => {
            const isCompleted = todo.status === 'completed'
            const theme = stickyColors[idx % stickyColors.length]!
            return (
              <div
                key={todo.id}
                className={`premium-card !p-10 relative overflow-hidden group hover:rotate-1 transition-all duration-500 animate-slide-up ${theme.bg} ${theme.border} min-h-[300px] flex flex-col`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                {/* 便签针效果 */}
                <div className={`absolute top-6 right-6 ${theme.icon} rotate-12 group-hover:rotate-0 transition-transform`}>
                  <Icon name="push_pin" size={28} />
                </div>

                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-6">
                    <span className={`premium-badge !text-[9px] !bg-white/60 !text-slate-500 border-none`}>
                      {todo.due_date ? new Date(todo.due_date).toLocaleDateString() : 'SOMEDAY'}
                    </span>
                  </div>
                  <h3 className={`text-2xl font-black mb-4 tracking-tight ${theme.text}`}>{todo.title}</h3>
                  <p className="text-slate-600 font-medium text-sm leading-relaxed opacity-80">{todo.description}</p>
                </div>

                <div className="mt-10 flex items-center justify-between pt-6 border-t border-dashed border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isCompleted ? 'bg-primary text-white shadow-lg shadow-primary/30 animate-elastic' : 'bg-white border-2 border-slate-100 text-slate-200'}`}>
                      <Icon name="favorite" size={18} className={isCompleted ? "fill-current" : ""} />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'text-primary' : 'text-slate-300'}`}>
                      {isCompleted ? 'Fulfilled' : 'In Progress'}
                    </span>
                  </div>
                </div>

                {/* 完成勋章 */}
                {isCompleted && (
                  <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center rotate-12 pointer-events-none">
                    <Icon name="verified" size={48} className="text-primary/10" />
                  </div>
                )}

                {/* 完成备注和图片 */}
                {isCompleted && (todo.completion_notes || todo.completion_photos) && (
                  <div className="mt-6 space-y-4">
                    {todo.completion_notes && (
                      <p className="text-xs text-slate-500 italic leading-relaxed">"{todo.completion_notes}"</p>
                    )}
                    {todo.completion_photos && (() => {
                      const photos = Array.isArray(todo.completion_photos) ? todo.completion_photos : (typeof todo.completion_photos === 'string' ? todo.completion_photos.split(',').filter(Boolean) : [])
                      return photos.length > 0 && (
                        <div className="flex gap-2.5">
                          {photos.slice(0, 3).map((photo, i) => (
                            <div key={i} className="w-12 h-12 rounded-xl overflow-hidden shadow-sm hover:scale-110 active:scale-95 transition-all cursor-pointer border-2 border-white">
                              <img src={photo} alt="Done" className="w-full h-full object-cover" onClick={() => setSelectedImage(photo)} />
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            )
          })}

          <div className="group premium-card !p-0 !bg-slate-50/50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center min-h-[300px] cursor-pointer hover:bg-white hover:border-primary/40 transition-all animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="w-20 h-20 rounded-3xl bg-white shadow-sm flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:scale-110 group-hover:rotate-12 transition-all mb-4">
              <Icon name="add_circle" size={40} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Secret wish</p>
          </div>
        </div>

        {/* 进度控制面板 */}
        <section className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="premium-card p-12 max-w-3xl mx-auto overflow-hidden relative group">
            <div className="absolute -top-12 -left-12 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>

            <div className="flex items-center justify-between mb-10 relative z-10">
              <div>
                <span className="premium-badge mb-3">JOURNEY PROGRESS</span>
                <h4 className="text-3xl font-black text-slate-800 tracking-tight">我们的愿望进度</h4>
              </div>
              <div className="text-right">
                <div className="text-5xl font-black text-primary tracking-tighter">{progress}%</div>
              </div>
            </div>

            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden mb-8 shadow-inner relative z-10">
              <div className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-1000 relative" style={{ width: `${progress}%` }}>
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]"></div>
              </div>
            </div>

            <p className="text-center text-slate-400 font-medium italic opacity-80 relative z-10">
              “我们已经共同完成了 {completedCount} 个甜蜜的约定，未来还有无限可能。”
            </p>
          </div>
        </section>
      </main>

      <ImageModal
        isOpen={selectedImage !== null}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage || undefined}
      />
    </div>
  )
}
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { notesService } from '../services/apiService'
import Icon from './icons/Icons'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { RESPONSIVE_GRID, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../constants/styles'

interface Note {
  id: number
  content: string
  color: string
  created_at?: string
  likes?: number
}

interface colorStyle {
  bg: string
  border: string
  text: string
  icon: string
  shadow: string
}

const colorMap: Record<string, colorStyle> = {
  pink: { bg: 'bg-morandi-pink', border: 'border-white/20', text: 'text-white', icon: 'text-white/80', shadow: 'shadow-morandi-pink/30' },
  orange: { bg: 'bg-morandi-yellow', border: 'border-white/20', text: 'text-stone-700', icon: 'text-stone-500/60', shadow: 'shadow-morandi-yellow/30' },
  green: { bg: 'bg-morandi-green', border: 'border-white/20', text: 'text-stone-800/80', icon: 'text-stone-600/60', shadow: 'shadow-morandi-green/30' },
  blue: { bg: 'bg-morandi-blue', border: 'border-white/20', text: 'text-white', icon: 'text-white/80', shadow: 'shadow-morandi-blue/30' },
  purple: { bg: 'bg-morandi-purple', border: 'border-white/20', text: 'text-white', icon: 'text-white/80', shadow: 'shadow-morandi-purple/30' },
}

const getRandomColorName = () => {
  const colors = Object.keys(colorMap)
  return colors[Math.floor(Math.random() * colors.length)] || 'pink'
}

export default function StickyNotes() {
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [newNote, setNewNote] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  useBodyScrollLock(showAddModal)

  // 使用 React Query 获取便签数据，自动缓存和刷新
  const { data: notesData, isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const response = await notesService.getAll()
      const responseData = response.data
      if (Array.isArray(responseData)) return responseData
      if (responseData && 'data' in responseData && Array.isArray(responseData.data)) return responseData.data
      return []
    },
    staleTime: 2 * 60 * 1000,
  })

  const notes = notesData || []

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    const color = getRandomColorName()
    await notesService.create({ content: newNote, color })
    setNewNote('')
    setShowAddModal(false)
    // 创建后刷新缓存
    queryClient.invalidateQueries({ queryKey: ['notes'] })
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这条碎碎念吗？')) return
    await notesService.delete(id)
    // 删除后刷新缓存
    queryClient.invalidateQueries({ queryKey: ['notes'] })
  }

  if (isLoading) return <div className="text-center py-10 opacity-50">加载中...</div>

  return (
    <div className={RESPONSIVE_GRID}>
      {notes.map((note, idx) => {
        const colorKey = (note.color && colorMap[note.color]) ? note.color : Object.keys(colorMap)[idx % Object.keys(colorMap).length] || 'pink'
        const style = colorMap[colorKey]!
        const rotations = ['rotate-1', 'rotate-2', 'rotate-3', 'rotate-[-1deg]', 'rotate-[-2deg]', 'rotate-[-3deg]']
        const rotation = rotations[idx % rotations.length]
        return (
          <div key={note.id} className={`${style.bg} p-10 py-12 rounded-2xl border ${style.border} flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] shadow-xl ${style.shadow} cursor-default group relative ${rotation}`}>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-stone-400/80 drop-shadow-sm group-hover:scale-110 transition-transform">
              <Icon name="push_pin" size={24} />
            </div>

            <p className={`${style.text} text-xl leading-relaxed mb-10 font-medium font-handwriting tracking-wide`}>"{note.content}"</p>
            <div className={`flex items-center justify-between border-t ${style.border} pt-6 mt-auto`}>
              <div className={`flex items-center space-x-5 ${style.icon}`}>
                <span className="flex items-center space-x-1.5 hover:scale-110 transition-transform cursor-pointer">
                  <Icon name="favorite" size={20} />
                  <span className="text-sm font-bold">{note.likes || 0}</span>
                </span>
                <span className="flex items-center space-x-1.5 hover:scale-110 transition-transform cursor-pointer">
                  <Icon name="chat_bubble" size={20} />
                  <span className="text-sm font-bold">0</span>
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-[11px] ${style.text} opacity-40 font-bold uppercase tracking-widest`}>
                  {note.created_at ? new Date(note.created_at).toLocaleDateString() : 'JUST NOW'}
                </span>
                {isAdmin && (
                  <button onClick={() => handleDelete(note.id)} className={`${style.text} opacity-20 hover:opacity-100 hover:text-red-500 transition-all flex items-center justify-center p-1`}>
                    <Icon name="delete" size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {isAdmin && (
        <div
          onClick={() => setShowAddModal(true)}
          className="border-2 border-dashed border-gray-200 p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-300 hover:border-primary/50 hover:text-primary transition-all group cursor-pointer min-h-[160px]"
        >
          <Icon name="add_circle" size={48} className="mb-4 group-hover:scale-110 transition-transform" />
          <p className="font-bold">记录下一段回忆</p>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="glass-card p-8 rounded-3xl w-full max-w-lg animate-slide-up">
            <h3 className="text-2xl font-display mb-6">记录新碎碎念</h3>
            <textarea
              className="w-full bg-slate-50 rounded-2xl p-4 min-h-[120px] mb-6 focus:ring-2 focus:ring-primary outline-none"
              placeholder="在这里写下你的心情..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowAddModal(false)}
                className={SECONDARY_BUTTON}
              >
                取消
              </button>
              <button
                onClick={handleAddNote}
                className={PRIMARY_BUTTON}
              >
                发布
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

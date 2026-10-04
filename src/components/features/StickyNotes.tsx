import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { notesService } from '../../services/apiService'
import Icon from '../icons/Icons'
import { useToast } from '../common/Toast'
import Modal from '../modals/Modal'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { RESPONSIVE_GRID, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../../constants/styles'
import { formatDate } from '../../utils/common'

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
  const toast = useToast()
  const [newNote, setNewNote] = useState('')
  const [selectedColor, setSelectedColor] = useState('pink')
  const [showAddModal, setShowAddModal] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

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
    if (!newNote.trim()) {
      toast.warning('请输入碎碎念内容哦')
      return
    }
    const color = selectedColor || getRandomColorName()
    try {
      await notesService.create({ content: newNote, color })
      setNewNote('')
      setShowAddModal(false)
      toast.success('碎碎念已贴上啦')
      // 创建后刷新缓存
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    } catch (err) {
      toast.error('贴便签失败，请稍后重试')
    }
  }

  const handleDelete = (id: number) => {
    setDeleteConfirmId(id)
  }

  const confirmDelete = async (id: number) => {
    try {
      await notesService.delete(id)
      toast.success("碎碎念已删除")
      setDeleteConfirmId(null)
      queryClient.invalidateQueries({ queryKey: ["notes"] })
    } catch {
      toast.error("删除失败，请稍后重试")
    }
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
          <div key={note.id} className={`${style.bg} p-6 sm:p-8 md:p-10 py-8 sm:py-10 md:py-12 rounded-2xl border ${style.border} flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] shadow-xl ${style.shadow} cursor-default group relative ${rotation}`}>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-stone-400/80 drop-shadow-sm group-hover:scale-110 transition-transform">
              <Icon name="push_pin" size={24} />
            </div>

            <p className={`${style.text} text-xl leading-relaxed mb-6 md:mb-10 font-medium font-handwriting tracking-wide`}>"{note.content}"</p>
            <div className={`flex items-center justify-between border-t ${style.border} pt-6 mt-auto`}>
              <div className={`flex items-center space-x-5 ${style.icon}`}>
                <span className="flex items-center space-x-1.5 hover:scale-110 transition-transform cursor-pointer">
                  <Icon name="favorite" size={20} />
                  <span className="text-sm font-bold">{note.likes || 0}</span>
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-[11px] ${style.text} opacity-40 font-bold uppercase tracking-widest`}>
                  {note.created_at ? formatDate(note.created_at, 'short') : 'JUST NOW'}
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

      {/* 发布碎碎念弹窗 */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="记录新碎碎念"
      >
        <div className="space-y-4">
          {/* 莫兰迪便签颜色自选 */}
          <div>
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">选择贴纸颜色</span>
            <div className="flex items-center space-x-3">
              {Object.entries(colorMap).map(([cKey, cVal]) => (
                <button
                  key={cKey}
                  type="button"
                  onClick={() => setSelectedColor(cKey)}
                  className={`w-8 h-8 rounded-full ${cVal.bg} transition-all duration-200 ${selectedColor === cKey ? "scale-110 ring-2 ring-offset-2 ring-primary shadow-md" : "opacity-80 hover:opacity-100 hover:scale-105"}`}
                  aria-label={`选择${cKey}颜色`}
                />
              ))}
            </div>
          </div>

          <textarea
            className="w-full bg-slate-50 rounded-2xl p-4 min-h-[120px] focus:ring-2 focus:ring-primary outline-none text-slate-700"
            placeholder="在这里写下你的心情..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />

          <div className="flex justify-end space-x-3 pt-2">
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
      </Modal>

      {/* 莫兰迪删除确认弹窗 */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="确认删除"
      >
        <div className="text-center py-2 space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#FFEDF3] text-rose-500 flex items-center justify-center mx-auto shadow-inner border border-rose-100">
            <Icon name="delete" size={26} />
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            确定要撕下并删除这条碎碎念便签吗？此操作不可恢复。
          </p>
          <div className="flex justify-center gap-3 pt-3">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className={SECONDARY_BUTTON}
            >
              取消
            </button>
            <button
              onClick={() => {
                if (deleteConfirmId !== null) {
                  confirmDelete(deleteConfirmId)
                }
              }}
              className="px-8 py-2.5 bg-gradient-to-r from-morandi-rose to-rose-400 text-white rounded-full font-bold shadow-md hover:scale-105 transition-transform"
            >
              确认删除
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

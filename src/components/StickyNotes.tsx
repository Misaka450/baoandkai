import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/apiService'
import Icon from './icons/Icons'

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
  pink: { bg: 'bg-pastel-pink', border: 'border-pink-100', text: 'text-pink-700', icon: 'text-primary', shadow: 'shadow-pink-100/50' },
  orange: { bg: 'bg-pastel-yellow', border: 'border-yellow-100', text: 'text-yellow-700', icon: 'text-yellow-500', shadow: 'shadow-yellow-100/50' },
  green: { bg: 'bg-pastel-green', border: 'border-green-100', text: 'text-green-700', icon: 'text-green-400', shadow: 'shadow-green-100/50' },
  blue: { bg: 'bg-pastel-blue', border: 'border-blue-100', text: 'text-blue-700', icon: 'text-blue-400', shadow: 'shadow-blue-100/50' },
  purple: { bg: 'bg-pastel-purple', border: 'border-purple-100', text: 'text-purple-700', icon: 'text-purple-400', shadow: 'shadow-purple-100/50' },
}

const getRandomColorName = () => {
  const colors = Object.keys(colorMap)
  return colors[Math.floor(Math.random() * colors.length)] || 'pink'
}

export default function StickyNotes() {
  const { isAdmin } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const response = await apiService.get<{ data: Note[] } | Note[]>('/notes')
      const responseData = response.data
      let notesData: Note[] = []
      if (responseData) {
        if (Array.isArray(responseData)) notesData = responseData
        else if ('data' in responseData && Array.isArray(responseData.data)) notesData = responseData.data
      }
      setNotes(notesData)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    const color = getRandomColorName()
    await apiService.post('/notes', { content: newNote, color })
    setNewNote('')
    setShowAddModal(false)
    fetchNotes()
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这条碎碎念吗？')) return
    await apiService.delete(`/notes/${id}`)
    fetchNotes()
  }

  if (loading) return <div className="text-center py-10 opacity-50">加载中...</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {notes.map((note, idx) => {
        const style = colorMap[note.color] || colorMap.pink!
        return (
          <div key={note.id} className={`${style.bg} p-8 rounded-[2.5rem] border ${style.border} flex flex-col justify-between hover:rotate-1 transition-transform cursor-default group`}>
            <p className={`${style.text} text-lg leading-relaxed mb-8 italic`}>“{note.content}”</p>
            <div className={`flex items-center justify-between border-t ${style.border} pt-4`}>
              <div className={`flex items-center space-x-4 ${style.icon}`}>
                <span className="flex items-center space-x-1 hover:scale-110 transition-transform cursor-pointer">
                  <Icon name="favorite" size={18} />
                  <span className="text-xs font-bold">{note.likes || 0}</span>
                </span>
                <span className="flex items-center space-x-1 hover:scale-110 transition-transform cursor-pointer">
                  <Icon name="chat_bubble" size={18} />
                  <span className="text-xs font-bold">0</span>
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                  {note.created_at ? new Date(note.created_at).toLocaleDateString() : 'JUST NOW'}
                </span>
                {isAdmin && (
                  <button onClick={() => handleDelete(note.id)} className="text-gray-300 hover:text-red-500 transition-colors flex items-center justify-center">
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
                className="px-6 py-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddNote}
                className="px-8 py-2 bg-primary text-white rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
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
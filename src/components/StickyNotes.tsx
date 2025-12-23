import { useState, useEffect } from 'react'
import { Heart, Trash2, Plus, Loader2, MessageSquare, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/apiService'

// 定义颜色方案接口
interface ColorScheme {
  name: string
  gradient: string
  border: string
  text: string
}

// 定义碎碎念笔记接口
interface Note {
  id: number
  content: string
  color: string
  created_at?: string
  likes?: number
}

// 莫兰迪色系配色方案
const colorSchemes: ColorScheme[] = [
  { name: 'rose', gradient: 'bg-gradient-to-br from-rose-50/80 to-rose-100/80', border: 'border-rose-200/30', text: 'text-rose-800' },
  { name: 'amber', gradient: 'bg-gradient-to-br from-amber-50/80 to-amber-100/80', border: 'border-amber-200/30', text: 'text-amber-800' },
  { name: 'slate', gradient: 'bg-gradient-to-br from-slate-50/80 to-slate-100/80', border: 'border-slate-200/30', text: 'text-slate-800' },
  { name: 'emerald', gradient: 'bg-gradient-to-br from-emerald-50/80 to-emerald-100/80', border: 'border-emerald-200/30', text: 'text-emerald-800' },
  { name: 'violet', gradient: 'bg-gradient-to-br from-violet-50/80 to-violet-100/80', border: 'border-violet-200/30', text: 'text-violet-800' },
  { name: 'stone', gradient: 'bg-gradient-to-br from-stone-50/80 to-stone-100/80', border: 'border-stone-200/30', text: 'text-stone-800' }
]

// 获取随机颜色
const getRandomColor = (): ColorScheme => {
  const index = Math.floor(Math.random() * colorSchemes.length)
  return colorSchemes[index] ?? colorSchemes[0]!
}

export default function StickyNotes() {
  const { isAdmin, token } = useAuth() // 改为使用isAdmin而不是isLoggedIn
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [addLoading, setAddLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null)

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const response = await apiService.get<{ data: Note[] } | Note[]>('/notes')

      // API返回格式: { data: [...], pagination: {...} }
      const responseData = response.data
      let notesData: Note[] = []
      if (responseData) {
        if (Array.isArray(responseData)) {
          notesData = responseData
        } else if ('data' in responseData && Array.isArray(responseData.data)) {
          notesData = responseData.data
        }
      }

      setNotes(notesData)
    } catch (error) {
      console.error('获取碎碎念失败:', error)
      setNotes([])
    } finally {
      setLoading(false)
    }
  }

  const addNote = async () => {
    if (!newNote.trim()) return
    if (!isAdmin) {
      alert('只有管理员才能添加碎碎念！')
      return
    }

    setAddLoading(true)
    try {
      const randomColor = getRandomColor()

      const { data, error } = await apiService.post('/notes', {
        content: newNote,
        color: randomColor.name
      })

      if (!error) {
        await fetchNotes()
        setNewNote('')
        setShowAddModal(false)
      } else {
        console.error('添加失败:', error)
      }
    } catch (error) {
      console.error('添加碎碎念失败:', error)
    } finally {
      setAddLoading(false)
    }
  }

  const deleteNote = async (id: number) => {
    if (!isAdmin) {
      alert('只有管理员才能删除碎碎念！')
      return
    }

    setDeleteLoading(true)
    try {
      const { error } = await apiService.delete(`/notes/${id}`)

      if (!error) {
        await fetchNotes()
        setShowDeleteModal(false)
        setNoteToDelete(null)
      } else {
        alert(error || '删除失败，请重试')
        console.error('删除失败:', error)
      }
    } catch (error) {
      console.error('删除碎碎念失败:', error)
      alert('网络错误，请检查网络连接后重试')
    } finally {
      setDeleteLoading(false)
    }
  }

  const openAddModal = () => {
    setShowAddModal(true)
  }

  const closeAddModal = () => {
    setShowAddModal(false)
    setNewNote('')
  }

  const openDeleteModal = (note: Note) => {
    setNoteToDelete(note)
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setNoteToDelete(null)
  }

  const confirmDelete = () => {
    if (noteToDelete) {
      deleteNote(noteToDelete.id)
    }
  }

  const getColorScheme = (colorName: string): ColorScheme => {
    const found = colorSchemes.find(scheme => scheme.name === colorName)
    return found ?? getRandomColor()
  }

  // 兼容旧的颜色格式
  const getNoteColorScheme = (noteColor: string): ColorScheme => {
    if (colorSchemes.some(scheme => scheme.name === noteColor)) {
      return getColorScheme(noteColor)
    }

    const colorMapping: Record<string, ColorScheme> = {
      'bg-yellow-100 border-yellow-200': colorSchemes[1]!,
      'bg-pink-100 border-pink-200': colorSchemes[0]!,
      'bg-blue-100 border-blue-200': colorSchemes[2]!,
      'from-green-50 to-emerald-50 border-emerald-200': colorSchemes[3]!,
      'bg-purple-100 border-purple-200': colorSchemes[4]!,
      'bg-orange-100 border-orange-200': colorSchemes[1]!
    }

    return colorMapping[noteColor] || getRandomColor()
  }

  // 修改返回的JSX部分
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="inline-flex flex-col items-center space-y-3">
              <div className="animate-pulse">
                <div className="h-2 bg-stone-200 rounded-full w-48 mb-4"></div>
                <div className="h-1.5 bg-stone-200 rounded-full w-32"></div>
              </div>
              <div className="mt-8 space-y-4 w-full max-w-md">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-stone-200 rounded w-3/4"></div>
                      <div className="h-3 bg-stone-200 rounded w-1/2"></div>
                      <div className="h-2 bg-stone-200 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-stone-800 mb-4">
            碎碎念
          </h1>
          <p className="text-stone-600 text-lg max-w-2xl mx-auto">
            记录生活中的小确幸和感悟，让美好时光在此停留
          </p>
        </div>

        {/* 添加按钮 - 仅管理员可见 */}
        {isAdmin && (
          <div className="flex justify-center mb-8">
            <button
              onClick={openAddModal}
              className="inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm border border-white/30 rounded-full text-stone-700 hover:bg-white/90 transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
            >
              <Plus className="w-5 h-5 mr-2" />
              添加碎碎念
            </button>
          </div>
        )}

        {/* 碎碎念网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => {
            const colorScheme = getNoteColorScheme(note.color)
            return (
              <div
                key={note.id}
                className={`${colorScheme.gradient} ${colorScheme.border} rounded-2xl p-6 backdrop-blur-sm border shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-200 transform hover:-translate-y-1`}
              >
                <div className={`${colorScheme.text} text-sm leading-relaxed mb-4`}>
                  {note.content}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center text-stone-500 hover:text-rose-500 transition-colors">
                      <Heart className="w-4 h-4" />
                      <span className="ml-1 text-xs">{note.likes || 0}</span>
                    </button>
                    <button className="flex items-center text-stone-500 hover:text-blue-500 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      <span className="ml-1 text-xs">0</span>
                    </button>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => openDeleteModal(note)}
                      className="text-stone-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 空状态 */}
        {notes.length === 0 && !loading && (
          <div className="text-center py-16">
            <MessageSquare className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-600 mb-2">
              还没有碎碎念
            </h3>
            <p className="text-stone-500">
              {isAdmin ? '点击上方按钮添加第一条碎碎念吧！' : '等待管理员添加碎碎念...'}
            </p>
          </div>
        )}

        {/* 添加模态框 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-stone-800">添加碎碎念</h3>
                <button
                  onClick={closeAddModal}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="写下你的碎碎念..."
                className="w-full h-32 p-3 border border-stone-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-stone-300"
              />

              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={closeAddModal}
                  className="px-4 py-2 text-stone-600 hover:text-stone-800"
                >
                  取消
                </button>
                <button
                  onClick={addNote}
                  disabled={addLoading || !newNote.trim()}
                  className="px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    '添加'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认模态框 */}
        {showDeleteModal && noteToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-stone-800">确认删除</h3>
                <button
                  onClick={closeDeleteModal}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-stone-600 mb-4">
                确定要删除这条碎碎念吗？此操作不可撤销。
              </p>

              <div className="bg-stone-50 rounded-lg p-4 mb-4">
                <p className="text-stone-800 text-sm">{noteToDelete.content}</p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-stone-600 hover:text-stone-800"
                >
                  取消
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    '确认删除'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
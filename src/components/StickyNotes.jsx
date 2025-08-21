import { useState, useEffect } from 'react'
import { Heart, Trash2, Plus, Loader2, MessageSquare, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const API_BASE = '/api'

// 莫兰迪色系配色方案 - 与时间轴统一
const colorSchemes = [
  { name: 'rose', gradient: 'bg-gradient-to-br from-rose-50/80 to-rose-100/80', border: 'border-rose-200/30', text: 'text-rose-800' },
  { name: 'amber', gradient: 'bg-gradient-to-br from-amber-50/80 to-amber-100/80', border: 'border-amber-200/30', text: 'text-amber-800' },
  { name: 'slate', gradient: 'bg-gradient-to-br from-slate-50/80 to-slate-100/80', border: 'border-slate-200/30', text: 'text-slate-800' },
  { name: 'emerald', gradient: 'bg-gradient-to-br from-emerald-50/80 to-emerald-100/80', border: 'border-emerald-200/30', text: 'text-emerald-800' },
  { name: 'violet', gradient: 'bg-gradient-to-br from-violet-50/80 to-violet-100/80', border: 'border-violet-200/30', text: 'text-violet-800' },
  { name: 'stone', gradient: 'bg-gradient-to-br from-stone-50/80 to-stone-100/80', border: 'border-stone-200/30', text: 'text-stone-800' }
]

// 获取随机颜色
const getRandomColor = () => {
  return colorSchemes[Math.floor(Math.random() * colorSchemes.length)]
}

export default function StickyNotes() {
  const { isAdmin, token } = useAuth() // 改为使用isAdmin而不是isLoggedIn
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [addLoading, setAddLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState(null)

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/notes`)
      const data = await response.json()
      console.log('获取到的碎碎念数据:', data)
      
      if (Array.isArray(data)) {
        setNotes(data)
      } else if (data.success && Array.isArray(data.notes)) {
        setNotes(data.notes || [])
      } else {
        console.error('API返回格式错误:', data)
        setNotes([])
      }
    } catch (error) {
      console.error('获取碎碎念失败:', error)
      setNotes([])
    } finally {
      setLoading(false)
    }
  }

  const addNote = async () => {
    if (!newNote.trim()) return
    if (!isAdmin) { // 改为检查isAdmin
      alert('只有管理员才能添加碎碎念！')
      return
    }

    setAddLoading(true)
    try {
      const randomColor = getRandomColor()
      
      const response = await fetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newNote,
          color: randomColor.name
        })
      })

      const data = await response.json()
      console.log('添加碎碎念返回:', data)
      
      if (response.ok) {
        await fetchNotes()
        setNewNote('')
        setShowAddModal(false)
      } else {
        console.error('添加失败:', data)
      }
    } catch (error) {
      console.error('添加碎碎念失败:', error)
    } finally {
      setAddLoading(false)
    }
  }

  const deleteNote = async (id) => {
    if (!isAdmin) { // 改为检查isAdmin
      alert('只有管理员才能删除碎碎念！')
      return
    }

    setDeleteLoading(true)
    try {
      const response = await fetch(`${API_BASE}/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (response.ok) {
        await fetchNotes()
        setShowDeleteModal(false)
        setNoteToDelete(null)
      } else {
        // 添加错误提示
        alert(data.error || '删除失败，请重试')
        console.error('删除失败:', data)
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

  const openDeleteModal = (note) => {
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

  const getColorScheme = (colorName) => {
    return colorSchemes.find(scheme => scheme.name === colorName) || getRandomColor()
  }

  // 兼容旧的颜色格式
  const getNoteColorScheme = (noteColor) => {
    if (colorSchemes.some(scheme => scheme.name === noteColor)) {
      return getColorScheme(noteColor)
    }
    
    const colorMapping = {
      'bg-yellow-100 border-yellow-200': colorSchemes[1],
      'bg-pink-100 border-pink-200': colorSchemes[0],
      'bg-blue-100 border-blue-200': colorSchemes[2],
      'from-green-50 to-emerald-50 border-emerald-200': colorSchemes[3],
      'bg-purple-100 border-purple-200': colorSchemes[4],
      'bg-orange-100 border-orange-200': colorSchemes[1]
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
        <div className="animate-slide-up">
          <div className="flex justify-between items-center mb-12">
            <h1 className="text-4xl font-light text-stone-800">我们的碎碎念</h1>
            {isAdmin && ( // 改为检查isAdmin
              <button
                onClick={openAddModal}
                className="bg-gradient-to-r from-rose-400 to-amber-400 text-white px-6 py-3 rounded-2xl font-light shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.16)] transition-all duration-300 flex items-center space-x-2 hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                <span>添加碎碎念</span>
              </button>
            )}
          </div>
          
          {/* 碎碎念列表 */}
          {notes.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex flex-col items-center space-y-6">
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-10 h-10 text-stone-400" />
                </div>
                <div>
                  <h3 className="text-xl font-light text-stone-800 mb-2">还没有碎碎念</h3>
                  <p className="text-stone-600 font-light">
                    {isAdmin ? '点击"添加碎碎念"按钮来创建第一条吧！' : '这里还没有碎碎念哦～'} // 改为检查isAdmin
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {notes.map((note) => {
                const colorScheme = getNoteColorScheme(note.color)
                return (
                  <div
                    key={note.id}
                    className={`backdrop-blur-sm border rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)] transition-all duration-500 hover:-translate-y-1 ${colorScheme.gradient} ${colorScheme.border}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <p className={`${colorScheme.text} font-light leading-relaxed text-sm`}>{note.content}</p>
                      </div>
                      {isAdmin && ( // 改为检查isAdmin
                        <button
                          onClick={() => openDeleteModal(note)}
                          className="ml-2 p-2 text-stone-400 hover:text-stone-600 hover:bg-white/30 rounded-full transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="border-t border-white/20 my-4"></div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-stone-500 font-light">
                        {new Date(note.created_at).toLocaleDateString('zh-CN')}
                      </span>
                      <Heart className="w-4 h-4 text-rose-400" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* 添加碎碎念弹窗 */}
          {showAddModal && isAdmin && ( // 添加isAdmin检查
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 max-w-md w-full shadow-[0_20px_80px_rgba(0,0,0,0.16)] animate-scale-in">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-light text-stone-800">添加碎碎念</h3>
                  <button
                    onClick={closeAddModal}
                    className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-100/50 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-light text-stone-700 mb-2">
                      内容
                    </label>
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="写下你想说的话..."
                      className="w-full px-4 py-3 bg-white/50 border border-stone-200/50 rounded-2xl font-light text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-200/50 focus:border-transparent resize-none"
                      rows={4}
                      autoFocus
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={closeAddModal}
                      className="flex-1 px-4 py-3 bg-stone-100/50 text-stone-600 rounded-2xl font-light hover:bg-stone-200/50 transition-all"
                    >
                      取消
                    </button>
                    <button
                      onClick={addNote}
                      disabled={!newNote.trim() || addLoading}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-400 to-amber-400 text-white rounded-2xl font-light shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.16)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      ) : (
                        '添加'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 删除确认弹窗 */}
          {showDeleteModal && isAdmin && ( // 添加isAdmin检查
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 max-w-sm w-full shadow-[0_20px_80px_rgba(0,0,0,0.16)] animate-scale-in">
                <h3 className="text-xl font-light text-stone-800 mb-4">确认删除</h3>
                <p className="text-stone-600 font-light mb-6">
                  确定要删除这条碎碎念吗？
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={closeDeleteModal}
                    className="flex-1 px-4 py-3 bg-stone-100/50 text-stone-600 rounded-2xl font-light hover:bg-stone-200/50 transition-all"
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deleteLoading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-rose-400 to-red-400 text-white rounded-2xl font-light shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.16)] transition-all"
                  >
                    {deleteLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      '删除'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
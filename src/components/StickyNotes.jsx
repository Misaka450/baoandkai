import { useState, useEffect } from 'react'
import { Heart, Trash2, Plus, Loader2 } from 'lucide-react'

const API_BASE = '/api'
const ADMIN_TOKEN = 'admin-token-123456789'

const colorSchemes = [
  { name: 'yellow', gradient: 'bg-gradient-card-1', border: 'border-amber-200' },
  { name: 'pink', gradient: 'bg-gradient-card-2', border: 'border-rose-200' },
  { name: 'blue', gradient: 'bg-gradient-card-3', border: 'border-indigo-200' },
  { name: 'green', gradient: 'bg-gradient-card-4', border: 'border-emerald-200' },
  { name: 'purple', gradient: 'bg-gradient-card-5', border: 'border-violet-200' },
  { name: 'orange', gradient: 'bg-gradient-card-6', border: 'border-red-200' }
]

export default function StickyNotes() {
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [selectedColor, setSelectedColor] = useState(colorSchemes[0])
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState(null)

  useEffect(() => {
    fetchNotes()
  }, [])

  const fetchNotes = async () => {
    try {
      const response = await fetch(`${API_BASE}/notes`)
      const data = await response.json()
      if (data.success) {
        setNotes(data.notes)
      }
    } catch (error) {
      console.error('获取碎碎念失败:', error)
    }
  }

  const addNote = async () => {
    if (!newNote.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify({
          content: newNote,
          color: selectedColor.name
        })
      })

      const data = await response.json()
      if (data.success) {
        setNotes([data.note, ...notes])
        setNewNote('')
      }
    } catch (error) {
      console.error('添加碎碎念失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteNote = async (id) => {
    setDeleteLoading(true)
    try {
      const response = await fetch(`${API_BASE}/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setNotes(notes.filter(note => note.id !== id))
        setShowDeleteModal(false)
        setNoteToDelete(null)
      }
    } catch (error) {
      console.error('删除碎碎念失败:', error)
    } finally {
      setDeleteLoading(false)
    }
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
    return colorSchemes.find(scheme => scheme.name === colorName) || colorSchemes[0]
  }

  return (
    <div className="container-modern">
      <div className="animate-slide-up">
        <h1 className="page-title">我们的碎碎念</h1>
        
        {/* 添加新碎碎念 */}
        <div className="glass-card p-6 mb-8 card-hover">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">添加新的碎碎念</h2>
          
          <div className="space-y-4">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="写下你想说的悄悄话..."
              className="input-modern min-h-[100px] resize-none"
            />
            
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-600">选择颜色:</span>
              <div className="flex space-x-2">
                {colorSchemes.map((scheme) => (
                  <button
                    key={scheme.name}
                    onClick={() => setSelectedColor(scheme)}
                    className={`w-8 h-8 rounded-full ${scheme.gradient} border-2 ${
                      selectedColor.name === scheme.name ? 'border-gray-400 scale-110' : 'border-transparent'
                    } transition-all duration-200`}
                  />
                ))}
              </div>
            </div>
            
            <button
              onClick={addNote}
              disabled={loading || !newNote.trim()}
              className="btn-gradient disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  添加中...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  添加碎碎念
                </>
              )}
            </button>
          </div>
        </div>

        {/* 碎碎念列表 */}
        {notes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Heart className="w-10 h-10 text-pink-400" />
            </div>
            <h3 className="empty-title">还没有碎碎念</h3>
            <p className="empty-subtitle">快来添加第一个吧！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {notes.map((note) => {
              const colorScheme = getColorScheme(note.color)
              return (
                <div
                  key={note.id}
                  className={`glass-card p-6 card-hover ${colorScheme.gradient} ${colorScheme.border}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <p className="text-gray-800 leading-relaxed">{note.content}</p>
                    </div>
                    <button
                      onClick={() => openDeleteModal(note)}
                      className="ml-2 p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="divider-modern my-4"></div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(note.created_at).toLocaleDateString('zh-CN')}
                    </span>
                    <Heart className="w-4 h-4 text-pink-400" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 删除确认模态框 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-card p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">确认删除</h3>
              <p className="text-gray-600 mb-6">
                确定要删除这条碎碎念吗？
              </p>
              {noteToDelete && (
                <p className="text-sm text-gray-500 mb-6 italic">
                  "{noteToDelete.content.substring(0, 50)}..."
                </p>
              )}
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={closeDeleteModal}
                className="flex-1 btn-gradient-outline"
                disabled={deleteLoading}
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl py-3 font-semibold shadow-lg hover:shadow-2xl hover:shadow-red-500/25 transform hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                    删除中...
                  </>
                ) : (
                  '确认删除'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
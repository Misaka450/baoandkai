import { useState, useEffect } from 'react'
import { MessageSquare, Heart, Plus, X, Lock, Send, Trash2 } from 'lucide-react'
import { apiRequest } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

export default function StickyNotes() {
  const { user } = useAuth()
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteNoteId, setDeleteNoteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    try {
      const data = await apiRequest('/api/notes')
      setNotes(data || [])
    } catch (error) {
      console.error('加载碎碎念失败:', error)
      setNotes([])
    } finally {
      setLoading(false)
    }
  }

  const addNote = async () => {
    if (!newNote.trim() || !user) return
    
    setSaving(true)
    try {
      const note = {
        content: newNote.trim(),
        color: getRandomColor()
      }
      
      const savedNote = await apiRequest('/api/notes', {
        method: 'POST',
        body: JSON.stringify(note),
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      })
      
      setNotes([savedNote, ...notes])
      setNewNote('')
      setShowInput(false)
    } catch (error) {
      console.error('添加碎碎念失败:', error)
      console.error('错误详情:', error.message, error.stack)
      alert(`添加失败: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (id) => {
    setDeleteNoteId(id)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!user || !deleteNoteId) return
    
    setDeleting(true)
    try {
      await apiRequest(`/api/notes/${deleteNoteId}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })
      setNotes(notes.filter(note => note.id !== deleteNoteId))
      setShowDeleteConfirm(false)
      setDeleteNoteId(null)
    } catch (error) {
      console.error('删除碎碎念失败:', error)
      if (error.message.includes('401')) {
        alert('请先登录后再删除碎碎念')
      }
    } finally {
      setDeleting(false)
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setDeleteNoteId(null)
  }

  const getRandomColor = () => {
    const colors = [
      'from-yellow-50 to-amber-50 border-amber-200',
      'from-pink-50 to-rose-50 border-rose-200',
      'from-blue-50 to-indigo-50 border-indigo-200',
      'from-green-50 to-emerald-50 border-emerald-200',
      'from-purple-50 to-violet-50 border-violet-200',
      'from-orange-50 to-red-50 border-red-200'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center justify-center">
          <MessageSquare className="h-8 w-8 mr-3 text-pink-500" />
          我们的碎碎念
        </h2>
        
        {/* 添加碎碎念按钮 */}
        <div className="mb-8">
          {user && (
            <div className="flex justify-center">
              <button
                onClick={() => setShowInput(!showInput)}
                className="group flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white rounded-2xl font-semibold hover:shadow-2xl hover:shadow-purple-500/25 transform hover:-translate-y-1 transition-all duration-300"
              >
                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                <span>添加新碎碎念</span>
              </button>
            </div>
          )}

          {/* 展开的输入栏 */}
          {showInput && user && (
            <div className="glass-card p-6 mt-6 max-w-lg mx-auto rounded-2xl shadow-xl animate-in slide-in-from-top duration-300">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="写下你想对TA说的话..."
                className="w-full p-4 border border-gray-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all duration-200"
                rows="4"
                autoFocus
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowInput(false)
                    setNewNote('')
                  }}
                  className="px-5 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={addNote}
                  disabled={!newNote.trim() || saving}
                  className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-medium hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all duration-200"
                >
                  <Send className="h-4 w-4" />
                  <span>{saving ? '发送中...' : '发送'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 碎碎念列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`group relative bg-gradient-to-br ${note.color} rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 overflow-hidden`}
            >
              {/* 装饰性背景元素 */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* 内容区域 */}
              <div className="relative p-6 h-full flex flex-col">
                {/* 内容 */}
                <div className="flex-1 mb-4">
                  <p className="text-gray-800 text-base leading-relaxed font-medium">
                    {note.content}
                  </p>
                </div>
                
                {/* 底部信息栏 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4 text-pink-400 fill-current" />
                    <span className="text-xs text-gray-600 font-medium">
                      {new Date(note.created_at).toLocaleDateString('zh-CN', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteClick(note.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200 transform hover:scale-110"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* 悬停时的装饰边框 */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-pink-200 rounded-2xl transition-colors duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>

        {notes.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full mb-4">
              <MessageSquare className="h-10 w-10 text-pink-400" />
            </div>
            <p className="text-gray-500 text-lg">还没有碎碎念，快来写下第一条吧！</p>
            <p className="text-gray-400 text-sm mt-2">记录下你们的每一个心动瞬间</p>
          </div>
        )}
      </div>

      {/* 确认删除对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="glass-card p-8 rounded-2xl max-w-sm mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <Trash2 className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">确认删除</h3>
              <p className="text-gray-600 mb-6">确定要删除这条珍贵的碎碎念吗？此操作无法撤销。</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={cancelDelete}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-medium hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {deleting ? '删除中...' : '确认删除'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
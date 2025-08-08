import { useState, useEffect } from 'react'
import { MessageSquare, Heart, Plus, X, Lock, Send } from 'lucide-react'
import { apiRequest } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'

export default function StickyNotes() {
  const { user } = useAuth()
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showInput, setShowInput] = useState(false)

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
        color: getRandomColor(),
        created_at: new Date().toISOString()
      }
      
      const savedNote = await apiRequest('/api/notes', {
        method: 'POST',
        body: JSON.stringify(note),
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })
      
      setNotes([savedNote, ...notes])
      setNewNote('')
      setShowInput(false)
    } catch (error) {
      console.error('添加碎碎念失败:', error)
      if (error.message.includes('401')) {
        alert('请先登录后再添加碎碎念')
      }
    } finally {
      setSaving(false)
    }
  }

  const deleteNote = async (id) => {
    if (!user) {
      alert('请先登录后再删除碎碎念')
      return
    }
    
    try {
      await apiRequest(`/api/notes/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })
      setNotes(notes.filter(note => note.id !== id))
    } catch (error) {
      console.error('删除碎碎念失败:', error)
      if (error.message.includes('401')) {
        alert('请先登录后再删除碎碎念')
      }
    }
  }

  const getRandomColor = () => {
    const colors = [
      'bg-yellow-100 border-yellow-200',
      'bg-pink-100 border-pink-200',
      'bg-blue-100 border-blue-200',
      'bg-green-100 border-green-200',
      'bg-purple-100 border-purple-200',
      'bg-orange-100 border-orange-200'
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <MessageSquare className="h-6 w-6 mr-2 text-pink-500" />
          碎碎念
        </h2>
        
        {/* 添加碎碎念按钮 */}
        <div className="mb-6">
          {user ? (
            <div className="flex justify-center">
              <button
                onClick={() => setShowInput(!showInput)}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-medium hover:from-pink-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="h-5 w-5" />
                <span>添加碎碎念</span>
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-full text-gray-600">
                <Lock className="h-4 w-4" />
                <span className="text-sm">登录后添加碎碎念</span>
              </div>
            </div>
          )}

          {/* 展开的输入栏 */}
          {showInput && user && (
            <div className="glass-card p-4 mt-4 max-w-md mx-auto animate-in slide-in-from-top duration-200">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="写下你想说的话..."
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-pink-500"
                rows="3"
                autoFocus
              />
              <div className="flex justify-end space-x-2 mt-3">
                <button
                  onClick={() => {
                    setShowInput(false)
                    setNewNote('')
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  取消
                </button>
                <button
                  onClick={addNote}
                  disabled={!newNote.trim() || saving}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 flex items-center"
                >
                  <Send className="h-4 w-4 mr-1" />
                  {saving ? '发送中...' : '发送'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 碎碎念列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`${note.color} border-2 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative group`}
            >
              <p className="text-gray-800 mb-2 whitespace-pre-wrap">{note.content}</p>
              <div className="flex justify-between items-end text-xs text-gray-600">
                <span className="flex items-center">
                  <Heart className="h-3 w-3 mr-1 text-pink-500" />
                  {new Date(note.created_at).toLocaleDateString('zh-CN')}
                </span>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {notes.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">还没有碎碎念，快来写下第一条吧！</p>
          </div>
        )}
      </div>
    </div>
  )
}
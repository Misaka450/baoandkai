import { useState, useEffect } from 'react'
import { Heart, Trash2, Plus, Loader2, MessageSquare, X } from 'lucide-react'

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
      
      // 修复：API直接返回数组，而不是{success, notes}格式
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

    setAddLoading(true)
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
      console.log('添加碎碎念返回:', data)
      
      // 修复：添加成功后重新获取数据
      if (response.ok) {
        await fetchNotes() // 重新获取所有数据
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
    setDeleteLoading(true)
    try {
      const response = await fetch(`${API_BASE}/notes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      })

      const data = await response.json()
      if (response.ok) {
        await fetchNotes() // 重新获取数据
        setShowDeleteModal(false)
        setNoteToDelete(null)
      }
    } catch (error) {
      console.error('删除碎碎念失败:', error)
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
    return colorSchemes.find(scheme => scheme.name === colorName) || colorSchemes[0]
  }

  // 修复：兼容旧的颜色格式
  const getNoteColorScheme = (noteColor) => {
    // 如果是新的颜色名称格式
    if (colorSchemes.some(scheme => scheme.name === noteColor)) {
      return getColorScheme(noteColor)
    }
    
    // 如果是旧的CSS类格式，映射到新的颜色方案
    const colorMapping = {
      'bg-yellow-100 border-yellow-200': colorSchemes[0],
      'bg-pink-100 border-pink-200': colorSchemes[1],
      'bg-blue-100 border-blue-200': colorSchemes[2],
      'from-green-50 to-emerald-50 border-emerald-200': colorSchemes[3],
      'bg-purple-100 border-purple-200': colorSchemes[4],
      'bg-orange-100 border-orange-200': colorSchemes[5]
    }
    
    return colorMapping[noteColor] || colorSchemes[0]
  }

  if (loading) {
    return (
      <div className="container-modern">
        <div className="animate-slide-up">
          <h1 className="page-title">我们的碎碎念</h1>
          <div className="flex justify-center py-8">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-modern">
      <div className="animate-slide-up">
        <div className="flex justify-between items-center mb-8">
          <h1 className="page-title mb-0">我们的碎碎念</h1>
          <button
            onClick={openAddModal}
            className="btn-gradient flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>添加碎碎念</span>
          </button>
        </div>
        
        {/* 碎碎念列表 */}
        {notes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <MessageSquare className="w-10 h-10 text-pink-400" />
            </div>
            <h3 className="empty-title">还没有碎碎念</h3>
            <p className="empty-subtitle">点击"添加碎碎念"按钮来创建第一条吧！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {notes.map((note) => {
              const colorScheme = getNoteColorScheme(note.color)
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

        {/* 添加碎碎念弹窗 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="glass-card p-6 max-w-md w-full animate-scale-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">添加碎碎念</h3>
                <button
                  onClick={closeAddModal}
                  className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择颜色
                  </label>
                  <div className="flex space-x-2">
                    {colorSchemes.map((scheme) => (
                      <button
                        key={scheme.name}
                        onClick={() => setSelectedColor(scheme)}
                        className={`w-8 h-8 rounded-full ${scheme.gradient} border-2 ${
                          selectedColor.name === scheme.name
                            ? `border-gray-800 ${scheme.border}`
                            : 'border-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    内容
                  </label>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="写下你想说的话..."
                    className="input-modern w-full resize-none"
                    rows={4}
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={closeAddModal}
                    className="btn-secondary flex-1"
                  >
                    取消
                  </button>
                  <button
                    onClick={addNote}
                    disabled={!newNote.trim() || addLoading}
                    className="btn-gradient flex-1"
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
          </div>
        )}

        {/* 删除确认弹窗 */}
        {showDeleteModal && noteToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="glass-card p-6 max-w-sm w-full animate-scale-in">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">确认删除</h3>
              <p className="text-gray-600 mb-4">
                确定要删除这条碎碎念吗？
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={closeDeleteModal}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className="btn-danger flex-1"
                >
                  {deleteLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
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
  )
}
import { useState, useEffect, useRef } from 'react'
import { apiService } from '../../services/apiService'
import AdminModal from '../../components/AdminModal'
import { useAdminModal } from '../../hooks/useAdminModal'
import Icon from '../../components/icons/Icons'

interface Todo {
    id: number
    title: string
    description: string
    priority: number
    status: string
    due_date: string
    category: string
    images: string[]
    completion_photos: string[]
    completion_notes: string
}

interface FormData {
    title: string
    description: string
    priority: number
    status: string
    due_date: string
    category: string
    images: string[]
}

const priorities = [
    { value: 1, label: '低', color: 'bg-green-100 text-green-600' },
    { value: 2, label: '中', color: 'bg-yellow-100 text-yellow-600' },
    { value: 3, label: '高', color: 'bg-red-100 text-red-600' }
]
const categories = ['旅行', '居家', '购物', '约会', '其他']

const AdminTodos = () => {
    const [todos, setTodos] = useState<Todo[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [completingTodo, setCompletingTodo] = useState<Todo | null>(null)
    const [completionPhotos, setCompletionPhotos] = useState<string[]>([])
    const [completionNotes, setCompletionNotes] = useState('')
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState<{ percent: number, speed: number } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const completionFileRef = useRef<HTMLInputElement>(null)
    const [formData, setFormData] = useState<FormData>({ title: '', description: '', priority: 2, status: 'pending', due_date: '', category: '其他', images: [] })
    const { modalState, showAlert, showConfirm, closeModal } = useAdminModal()

    useEffect(() => { loadTodos() }, [])

    const loadTodos = async () => {
        try {
            const { data, error } = await apiService.get<{ data: Todo[] }>('/todos?limit=100')
            if (error) throw new Error(error)
            setTodos(data?.data || [])
        } catch (e) { console.error(e) } finally { setLoading(false) }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCompletion = false) => {
        if (!e.target.files?.length) return
        setUploading(true)
        const newImages: string[] = []
        for (const file of Array.from(e.target.files)) {
            try {
                const fd = new FormData()
                fd.append('file', file)
                fd.append('folder', 'todos')
                const { data, error } = await apiService.uploadWithProgress<{ url: string }>(
                    '/uploads',
                    fd,
                    (p) => setUploadProgress({ percent: p.percent, speed: p.speed })
                )
                if (error) throw new Error(error)
                if (data?.url) newImages.push(data.url)
            } catch (err) {
                console.error(err)
            } finally {
                setUploadProgress(null)
            }
        }
        if (isCompletion) {
            setCompletionPhotos(prev => [...prev, ...newImages])
        } else {
            setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }))
        }
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
        if (completionFileRef.current) completionFileRef.current.value = ''
    }

    const removeImage = (index: number, isCompletion = false) => {
        if (isCompletion) {
            setCompletionPhotos(prev => prev.filter((_, i) => i !== index))
        } else {
            setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingId) {
                const { error } = await apiService.put(`/todos/${editingId}`, formData)
                if (error) throw new Error(error)
                await showAlert('成功', '心愿已更新！', 'success')
            } else {
                const { error } = await apiService.post('/todos', formData)
                if (error) throw new Error(error)
                await showAlert('成功', '心愿已创建！', 'success')
            }
            resetForm(); loadTodos()
        } catch { await showAlert('错误', '保存失败', 'error') }
    }

    const handleEdit = (t: Todo) => {
        setEditingId(t.id)
        setFormData({ title: t.title, description: t.description, priority: t.priority, status: t.status, due_date: t.due_date, category: t.category, images: t.images || [] })
        setShowForm(true)
    }

    const handleDelete = async (id: number) => {
        if (!await showConfirm('删除心愿', '确定要删除这个心愿吗？')) return
        try {
            const { error } = await apiService.delete(`/todos/${id}`)
            if (error) throw new Error(error)
            await showAlert('成功', '已删除！', 'success'); loadTodos()
        } catch { await showAlert('错误', '删除失败', 'error') }
    }

    const openCompleteModal = (todo: Todo) => {
        setCompletingTodo(todo)
        setCompletionPhotos(todo.completion_photos || [])
        setCompletionNotes(todo.completion_notes || '')
    }

    const handleComplete = async () => {
        if (!completingTodo) return
        try {
            const { error } = await apiService.put(`/todos/${completingTodo.id}`, {
                ...completingTodo,
                status: 'completed',
                completion_photos: completionPhotos,
                completion_notes: completionNotes
            })
            if (error) throw new Error(error)
            await showAlert('成功', '心愿已完成！恭喜你们！🎉', 'success')
            setCompletingTodo(null)
            setCompletionPhotos([])
            setCompletionNotes('')
            loadTodos()
        } catch { await showAlert('错误', '更新失败', 'error') }
    }

    const toggleStatus = async (t: Todo) => {
        if (t.status !== 'completed') {
            openCompleteModal(t)
        } else {
            try {
                const { error } = await apiService.put(`/todos/${t.id}`, { ...t, status: 'pending', completion_photos: [], completion_notes: '' })
                if (error) throw new Error(error)
                loadTodos()
            } catch { await showAlert('错误', '更新失败', 'error') }
        }
    }

    const resetForm = () => { setShowForm(false); setEditingId(null); setFormData({ title: '', description: '', priority: 2, status: 'pending', due_date: '', category: '其他', images: [] }) }

    const getPriorityStyle = (p: number) => priorities.find(x => x.value === p)?.color || ''

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

    return (
        <div className="animate-fade-in text-slate-700">
            <header className="flex items-center justify-between mb-8">
                <div><h1 className="text-2xl font-bold text-slate-800 mb-1">心愿清单</h1><p className="text-sm text-slate-400">管理我们想做的事情</p></div>
                <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"><Icon name="add" size={20} />新增心愿</button>
            </header>

            {showForm && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-8">
                    <h2 className="text-lg font-bold mb-6 text-slate-800">{editingId ? '编辑心愿' : '新增心愿'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input type="text" placeholder="想做什么？" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm" required />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm">{priorities.map(p => <option key={p.value} value={p.value}>{p.label}优先级</option>)}</select>
                            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                            <input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm" />
                        </div>
                        <textarea placeholder="详细描述（可选）" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm min-h-[80px]" />
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">相关图片</label>
                            <div className="flex flex-wrap gap-3">
                                {formData.images.map((img, i) => (
                                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden group">
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeImage(i)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Icon name="delete" size={20} className="text-white" /></button>
                                    </div>
                                ))}
                                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                                    {uploading ? (
                                        <div className="flex flex-col items-center">
                                            <div className="relative w-10 h-10 mb-1">
                                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                                                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-primary">
                                                    {uploadProgress?.percent || 0}%
                                                </div>
                                            </div>
                                            {uploadProgress && (
                                                <span className="text-[9px] text-slate-400 font-mono leading-none">{uploadProgress.speed} KB/s</span>
                                            )}
                                        </div>
                                    ) : (
                                        <><Icon name="add_photo_alternate" size={20} className="text-slate-400" /><span className="text-xs text-slate-400">上传</span></>
                                    )}
                                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e)} className="hidden" disabled={uploading} />
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" className="px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all">{editingId ? '更新' : '创建'}</button>
                            <button type="button" onClick={resetForm} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">取消</button>
                        </div>
                    </form>
                </div>
            )}

            {/* 完成心愿弹窗 */}
            {completingTodo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-slate-800 mb-2">🎉 完成心愿</h2>
                        <p className="text-slate-500 mb-6">恭喜！记录下这个美好时刻吧~</p>
                        <div className="mb-4 p-4 bg-primary/5 rounded-2xl">
                            <h3 className="font-bold text-slate-800">{completingTodo.title}</h3>
                            <p className="text-sm text-slate-500">{completingTodo.description}</p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-600">完成照片</label>
                                <div className="flex flex-wrap gap-3">
                                    {completionPhotos.map((img, i) => (
                                        <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden group">
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => removeImage(i, true)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Icon name="delete" size={20} className="text-white" /></button>
                                        </div>
                                    ))}
                                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                                        {uploading ? (
                                            <div className="flex flex-col items-center">
                                                <div className="relative w-10 h-10 mb-1">
                                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                                                    <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-primary">
                                                        {uploadProgress?.percent || 0}%
                                                    </div>
                                                </div>
                                                {uploadProgress && (
                                                    <span className="text-[9px] text-slate-400 font-mono leading-none">{uploadProgress.speed} KB/s</span>
                                                )}
                                            </div>
                                        ) : (
                                            <><Icon name="add_photo_alternate" size={20} className="text-slate-400" /><span className="text-xs text-slate-400">上传</span></>
                                        )}
                                        <input ref={completionFileRef} type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e, true)} className="hidden" disabled={uploading} />
                                    </label>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-600">完成感言</label>
                                <textarea value={completionNotes} onChange={(e) => setCompletionNotes(e.target.value)} placeholder="记录一下这次经历的感受..." className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm min-h-[80px]" />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={handleComplete} className="flex-1 py-3 bg-primary text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all">完成心愿</button>
                            <button onClick={() => { setCompletingTodo(null); setCompletionPhotos([]); setCompletionNotes('') }} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">取消</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {todos.length === 0 ? <div className="text-center py-12 text-slate-400"><Icon name="checklist" size={48} className="mx-auto mb-4 opacity-50" /><p>还没有心愿，添加第一个吧！</p></div> : todos.map((t) => (
                    <div key={t.id} className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ${t.status === 'completed' ? 'opacity-70' : ''}`}>
                        <div className="flex items-start gap-4">
                            <button onClick={() => toggleStatus(t)} className={`w-6 h-6 mt-1 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${t.status === 'completed' ? 'bg-primary border-primary text-white' : 'border-slate-300 hover:border-primary'}`}>{t.status === 'completed' && <Icon name="check" size={14} />}</button>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1 flex-wrap">
                                    <h3 className={`font-bold text-slate-800 ${t.status === 'completed' ? 'line-through' : ''}`}>{t.title}</h3>
                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getPriorityStyle(t.priority)}`}>{priorities.find(p => p.value === t.priority)?.label}</span>
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full">{t.category}</span>
                                </div>
                                {t.description && <p className="text-sm text-slate-500 mb-2">{t.description}</p>}
                                {t.due_date && <p className="text-xs text-slate-400 mb-2">截止日期：{t.due_date}</p>}
                                {t.images && t.images.length > 0 && <div className="flex gap-2 mb-2">{t.images.slice(0, 4).map((img, i) => <img key={i} src={img} alt="" className="w-12 h-12 rounded-lg object-cover" />)}</div>}
                                {t.status === 'completed' && t.completion_photos && t.completion_photos.length > 0 && (
                                    <div className="mt-3 p-3 bg-green-50 rounded-xl">
                                        <p className="text-xs text-green-600 font-bold mb-2">✨ 已完成</p>
                                        <div className="flex gap-2">{t.completion_photos.slice(0, 4).map((img, i) => <img key={i} src={img} alt="" className="w-12 h-12 rounded-lg object-cover" />)}</div>
                                        {t.completion_notes && <p className="text-sm text-green-700 mt-2">{t.completion_notes}</p>}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button onClick={() => handleEdit(t)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"><Icon name="edit" size={18} /></button>
                                <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Icon name="delete" size={18} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <AdminModal isOpen={modalState.isOpen} onClose={closeModal} title={modalState.title} message={modalState.message} type={modalState.type} onConfirm={modalState.onConfirm || undefined} showCancel={modalState.showCancel} confirmText={modalState.confirmText} />
        </div>
    )
}

export default AdminTodos

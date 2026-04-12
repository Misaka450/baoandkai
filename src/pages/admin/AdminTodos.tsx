import { useState, useEffect, useRef } from 'react'
import { apiService } from '../../services/apiService'
import AdminModal from '../../components/AdminModal'
import Modal from '../../components/Modal'
import { useAdminModal } from '../../hooks/useAdminModal'
import Icon from '../../components/icons/Icons'
import { getThumbnailUrl } from '../../utils/imageUtils'
import AdminLayout from '../../components/admin/AdminLayout'
import Button from '../../components/admin/ui/Button'
import Card from '../../components/admin/ui/Card'

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
                    '/upload',
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
                await showAlert('成功', '待办事项已更新！', 'success')
            } else {
                const { error } = await apiService.post('/todos', formData)
                if (error) throw new Error(error)
                await showAlert('成功', '待办事项已创建！', 'success')
            }
            resetForm(); loadTodos()
        } catch (err: any) {
            await showAlert('错误', err.message || '保存失败', 'error')
        }
    }

    const handleEdit = (t: Todo) => {
        setEditingId(t.id)
        setFormData({ title: t.title, description: t.description, priority: t.priority, status: t.status, due_date: t.due_date, category: t.category, images: t.images || [] })
        setShowForm(true)
    }

    const handleDelete = async (id: number) => {
        if (!await showConfirm('删除待办', '确定要删除这个待办事项吗？')) return
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
        <AdminLayout title="心愿清单" subtitle="Dreams to be shared, moments to be lived">
            {/* 顶部操作栏 */}
            <div className="flex justify-end mb-6">
                <Button
                    onClick={() => setShowForm(true)}
                    variant="primary"
                    size="lg"
                    className="flex items-center gap-2"
                >
                    <Icon name="add" size={20} />
                    新增心愿
                </Button>
            </div>

            {/* 统一的 Modal 弹窗表单 */}
            <Modal
                isOpen={showForm}
                onClose={resetForm}
                title={editingId ? '修改心愿' : '添加新心愿'}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">心愿标题</label>
                        <input type="text" placeholder="想做什么？" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="premium-input w-full" required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">优先级</label>
                            <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })} className="premium-input w-full appearance-none bg-slate-50 cursor-pointer">{priorities.map(p => <option key={p.value} value={p.value}>{p.label}优先级</option>)}</select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">分类</label>
                            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="premium-input w-full appearance-none bg-slate-50 cursor-pointer">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">截至日期</label>
                            <input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="premium-input w-full" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">详细描述</label>
                        <textarea placeholder="详细描述（可选）" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="premium-input w-full min-h-[100px] resize-none" />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">相关图片</label>
                        <div className="flex flex-wrap gap-4">
                            {formData.images.map((img, i) => (
                                <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden group shadow-md transition-all hover:scale-105">
                                    <img src={getThumbnailUrl(img, 200)} alt="" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => removeImage(i)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Icon name="delete" size={24} className="text-white" /></button>
                                </div>
                            ))}
                            <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group shadow-sm">
                                {uploading ? (
                                    <div className="flex flex-col items-center">
                                        <div className="relative w-10 h-10 mb-1">
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Icon name="add_photo_alternate" size={24} className="text-slate-400 group-hover:text-primary transition-colors" />
                                        <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">上传</span>
                                    </>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e)} className="hidden" disabled={uploading} />
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 sticky bottom-0 bg-white py-4 border-t border-slate-50">
                        <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all">{editingId ? '保存更改' : '立即添加'}</button>
                        <button type="button" onClick={resetForm} className="px-10 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">取消</button>
                    </div>
                </form>
            </Modal>

            {/* 完成心愿弹窗 - 重构为 Modal */}
            <Modal
                isOpen={!!completingTodo}
                onClose={() => { setCompletingTodo(null); setCompletionPhotos([]); setCompletionNotes('') }}
                title="🎉 完成心愿"
            >
                <div className="space-y-6">
                    <p className="text-slate-500 -mt-2">恭喜！记录下这个美好时刻吧~</p>

                    <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                        <h3 className="font-black text-slate-800 text-lg mb-1">{completingTodo?.title}</h3>
                        <p className="text-sm text-slate-500 font-medium">{completingTodo?.description}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">完成照片</label>
                            <div className="flex flex-wrap gap-4">
                                {completionPhotos.map((img, i) => (
                                    <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden group shadow-md transition-all hover:scale-105">
                                        <img src={getThumbnailUrl(img, 200)} alt="" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeImage(i, true)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Icon name="delete" size={24} className="text-white" /></button>
                                    </div>
                                ))}
                                <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group shadow-sm">
                                    {uploading ? (
                                        <div className="flex flex-col items-center">
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                                        </div>
                                    ) : (
                                        <>
                                            <Icon name="add_photo_alternate" size={24} className="text-slate-400 group-hover:text-primary transition-colors" />
                                            <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">上传</span>
                                        </>
                                    )}
                                    <input ref={completionFileRef} type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e, true)} className="hidden" disabled={uploading} />
                                </label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">完成感言</label>
                            <textarea value={completionNotes} onChange={(e) => setCompletionNotes(e.target.value)} placeholder="记录一下这次经历的感受..." className="premium-input w-full min-h-[120px] resize-none" />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-slate-50">
                        <button onClick={handleComplete} className="flex-1 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">任务达成！</button>
                        <button onClick={() => { setCompletingTodo(null); setCompletionPhotos([]); setCompletionNotes('') }} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">再等等</button>
                    </div>
                </div>
            </Modal>

            <div className="space-y-6 pb-20">
                {todos.length === 0 ? (
                    <div className="text-center py-24 glass-card rounded-[3rem]">
                        <Icon name="favorite" size={64} className="mx-auto mb-6 text-primary/20 animate-float" />
                        <p className="text-slate-400 font-bold tracking-tight">我们的愿望盒还是空的...</p>
                    </div>
                ) : (
                    todos.map((t, index) => (
                        <div key={t.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                            <Card padding="lg" className={`group transition-all duration-500 mb-4 ${t.status === 'completed' ? 'bg-slate-50/50' : 'hover:shadow-md'}`}>
                                <div className="flex items-start gap-6">
                                    {/* 弹性交互式复选框 */}
                                    <button
                                        onClick={() => toggleStatus(t)}
                                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 shrink-0 shadow-sm ${t.status === 'completed'
                                            ? 'bg-primary border-primary text-white scale-110 shadow-primary/30'
                                            : 'border-slate-200 bg-white hover:border-primary hover:scale-110 active:scale-90'
                                            }`}
                                    >
                                        {t.status === 'completed' ? <Icon name="check" size={18} /> : <div className="w-2 h-2 rounded-full bg-slate-100 group-hover:bg-primary/20 transition-colors"></div>}
                                    </button>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-4 mb-2 flex-wrap">
                                            <h3 className={`text-xl font-black text-slate-800 transition-all duration-500 ${t.status === 'completed' ? 'opacity-40 italic' : ''}`}>
                                                {t.title}
                                            </h3>
                                            <span className={`premium-badge !bg-slate-50 !text-slate-400 border border-slate-100`}>
                                                {t.category}
                                            </span>
                                            <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-tighter ${t.priority === 3 ? 'bg-red-50 text-red-500' : t.priority === 2 ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'
                                                }`}>
                                                {priorities.find(p => p.value === t.priority)?.label}级优先
                                            </span>
                                        </div>

                                        {t.description && (
                                            <p className={`text-sm font-medium leading-relaxed mb-4 transition-all duration-500 ${t.status === 'completed' ? 'text-slate-300' : 'text-slate-500'}`}>
                                                {t.description}
                                            </p>
                                        )}

                                        {t.due_date && (
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">
                                                <Icon name="event" size={14} />
                                                DEALINE: {t.due_date}
                                            </div>
                                        )}

                                        {/* 图片堆叠预览 */}
                                        {t.images && t.images.length > 0 && (
                                            <div className="flex -space-x-3 mb-4">
                                                {t.images.slice(0, 5).map((img, i) => (
                                                    <div key={i} className="w-12 h-12 rounded-2xl border-2 border-white overflow-hidden shadow-sm hover:translate-y-[-4px] hover:z-10 transition-all duration-300 hover:rotate-2">
                                                        <img src={getThumbnailUrl(img, 100)} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                                {t.images.length > 5 && (
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-400">
                                                        +{t.images.length - 5}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {t.status === 'completed' && (
                                            <div className="mt-6 p-6 bg-primary/5 rounded-[1.5rem] border border-primary/10 animate-fade-in relative overflow-hidden group/success">
                                                <div className="absolute -right-4 -top-4 text-primary/10 group-hover/success:scale-150 transition-transform duration-1000">
                                                    <Icon name="celebration" size={120} />
                                                </div>
                                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <span className="w-4 h-[1px] bg-primary/40"></span>
                                                    ACHIEVED MOMENT
                                                </p>
                                                {t.completion_photos && t.completion_photos.length > 0 && (
                                                    <div className="flex gap-3 mb-4 flex-wrap relative z-10">
                                                        {t.completion_photos.slice(0, 4).map((img, i) => (
                                                            <img key={i} src={getThumbnailUrl(img, 160)} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md hover:scale-110 transition-transform cursor-zoom-in" />
                                                        ))}
                                                    </div>
                                                )}
                                                {t.completion_notes && (
                                                    <p className="text-sm font-bold text-primary/80 italic relative z-10 line-clamp-2">
                                                        "{t.completion_notes}"
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* 悬浮操作按钮 */}
                                    <div className="flex flex-col gap-2 opacity-70 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(t)}
                                            className="w-10 h-10 !p-0"
                                        >
                                            <Icon name="edit" size={18} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(t.id)}
                                            className="w-10 h-10 !p-0 text-red-500 hover:bg-red-500 hover:text-white"
                                        >
                                            <Icon name="delete" size={18} />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ))
                )}
            </div>
            <AdminModal isOpen={modalState.isOpen} onClose={closeModal} title={modalState.title} message={modalState.message} type={modalState.type} onConfirm={modalState.onConfirm || undefined} showCancel={modalState.showCancel} confirmText={modalState.confirmText} />
        </AdminLayout>
    )
}

export default AdminTodos

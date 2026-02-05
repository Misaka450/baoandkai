import { useState, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiService } from '../../services/apiService'
import AdminModal from '../../components/AdminModal'
import Modal from '../../components/Modal'
import { useAdminModal } from '../../hooks/useAdminModal'
import Icon from '../../components/icons/Icons'
import { getThumbnailUrl } from '../../utils/imageUtils'

interface TimelineEvent {
    id: number
    title: string
    description: string
    date: string
    location: string
    category: string
    images: string[]
}

interface FormData {
    title: string
    description: string
    date: string
    location: string
    category: string
    images: string[]
}

const categories = ['日常', '旅行', '纪念日', '特别时刻', '其他']

const AdminTimeline = () => {
    const [events, setEvents] = useState<TimelineEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState<{ percent: number, speed: number } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [formData, setFormData] = useState<FormData>({
        title: '',
        description: '',
        date: '',
        location: '',
        category: '日常',
        images: []
    })
    const { modalState, showAlert, showConfirm, closeModal } = useAdminModal()
    const queryClient = useQueryClient()

    useEffect(() => {
        loadEvents()
    }, [])

    const loadEvents = async () => {
        try {
            const { data, error } = await apiService.get<{ data: TimelineEvent[] }>('/timeline?limit=100')
            if (error) throw new Error(error)
            setEvents(data?.data || [])
        } catch (error) {
            console.error('加载时间轴失败:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setUploading(true)
        const newImages: string[] = []

        for (const file of Array.from(files)) {
            try {
                const formDataUpload = new FormData()
                formDataUpload.append('file', file)
                formDataUpload.append('folder', 'timeline')

                const { data, error } = await apiService.uploadWithProgress<{ url: string }>(
                    '/upload',
                    formDataUpload,
                    (p) => setUploadProgress({ percent: p.percent, speed: p.speed })
                )
                if (error) throw new Error(error)
                if (data?.url) {
                    newImages.push(data.url)
                }
            } catch (error) {
                console.error('上传图片失败:', error)
            } finally {
                setUploadProgress(null)
            }
        }

        setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }))
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const removeImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingId) {
                const { error } = await apiService.put(`/timeline/${editingId}`, formData)
                if (error) throw new Error(error)
                await showAlert('成功', '时间轴事件已更新！', 'success')
            } else {
                const { error } = await apiService.post('/timeline', formData)
                if (error) throw new Error(error)
                await showAlert('成功', '时间轴事件已创建！', 'success')
            }
            resetForm()
            loadEvents()
            // 失效缓存，让 Gallery/Timeline 页面重新加载
            queryClient.invalidateQueries({ queryKey: ['timeline'] });
        } catch (error) {
            await showAlert('错误', '保存时间轴事件失败', 'error')
        }
    }

    const handleEdit = (event: TimelineEvent) => {
        setEditingId(event.id)
        setFormData({
            title: event.title,
            description: event.description,
            date: event.date,
            location: event.location,
            category: event.category,
            images: event.images || []
        })
        setShowForm(true) // 弹出 Modal
    }

    const handleDelete = async (id: number) => {
        const confirmed = await showConfirm('删除事件', '确定要删除这个时间轴事件吗？')
        if (!confirmed) return

        try {
            const { error } = await apiService.delete(`/timeline/${id}`)
            if (error) throw new Error(error)
            await showAlert('成功', '事件已删除！', 'success')
            loadEvents()
        } catch (error) {
            await showAlert('错误', '删除事件失败', 'error')
        }
    }

    const resetForm = () => {
        setShowForm(false)
        setEditingId(null)
        setFormData({ title: '', description: '', date: '', location: '', category: '日常', images: [] })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="animate-fade-in text-slate-700">
            {/* 粘性玻璃头部 */}
            <header className="premium-glass -mx-4 px-4 py-6 mb-8 flex items-center justify-between backdrop-blur-xl">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">时间轴<span className="text-primary tracking-tighter ml-1">JOURNAL</span></h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memories are timeless treasures</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
                >
                    <Icon name="add" size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                    添加事件
                </button>
            </header>

            {/* 统一的 Modal 弹窗表单 */}
            <Modal
                isOpen={showForm}
                onClose={resetForm}
                title={editingId ? '编辑美好回忆' : '记录新时刻'}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">事件标题</label>
                            <input
                                type="text"
                                placeholder="给这一刻起个名字..."
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="premium-input w-full"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">日期</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="premium-input w-full"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">地点</label>
                            <div className="relative">
                                <Icon name="location_on" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input
                                    type="text"
                                    placeholder="当时在哪儿？"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    className="premium-input pl-14 w-full"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">分类</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="premium-input appearance-none bg-slate-50 cursor-pointer w-full"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">回忆细节</label>
                        <textarea
                            placeholder="写下当下的心情与细节..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="premium-input min-h-[140px] resize-none w-full"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">珍贵照片</label>
                        <div className="flex flex-wrap gap-4">
                            {formData.images.map((img, index) => (
                                <div key={index} className="relative w-28 h-28 rounded-2xl overflow-hidden group shadow-md transition-all hover:scale-105">
                                    <img src={getThumbnailUrl(img, 200)} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f1f5f9" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%2394a3b8" font-size="12">图片</text></svg>' }} />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                    >
                                        <Icon name="delete" size={24} className="text-white" />
                                    </button>
                                </div>
                            ))}
                            <label className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group shadow-sm">
                                {uploading ? (
                                    <div className="flex flex-col items-center">
                                        <div className="relative w-12 h-12 mb-1">
                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary">
                                                {uploadProgress?.percent || 0}%
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                            <Icon name="add_photo_alternate" size={24} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-400 mt-2">上传照片</span>
                                    </>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 sticky bottom-0 bg-white py-4 border-t border-slate-50">
                        <button
                            type="submit"
                            className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            {editingId ? '保存更改' : '记录此刻'}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-10 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                        >
                            取消
                        </button>
                    </div>
                </form>
            </Modal>

            <div className="space-y-8 pb-20">
                {events.length === 0 ? (
                    <div className="text-center py-24 glass-card rounded-[3rem]">
                        <Icon name="auto_awesome" size={64} className="mx-auto mb-6 text-primary/20 animate-float" />
                        <p className="text-slate-400 font-bold tracking-tight">我们的故事，正等待被书写...</p>
                    </div>
                ) : (
                    events.map((event, index) => (
                        <div key={event.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className={`premium-card p-10 group ${editingId === event.id ? 'ring-4 ring-primary/20' : ''}`}>
                                <div className="flex flex-col lg:flex-row gap-8">
                                    {/* 左侧：图片墙或占位 */}
                                    {event.images && event.images.length > 0 && (
                                        <div className="lg:w-48 flex-shrink-0">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-110 opacity-0 group-hover:opacity-40 transition-opacity duration-700"></div>
                                                <div className="grid grid-cols-2 gap-2 relative">
                                                    {event.images.slice(0, 4).map((img, i) => (
                                                        <div key={i} className={`aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-sm transition-all duration-500 group-hover:scale-105 group-hover:rotate-${i % 2 === 0 ? '3' : '-3'}`}>
                                                            <img src={getThumbnailUrl(img, 200)} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                    ))}
                                                    {event.images.length === 1 && <div className="aspect-square bg-slate-50 rounded-2xl border-2 border-white"></div>}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-4">
                                            <span className="premium-badge">{event.category}</span>
                                            <div className="h-1 w-1 bg-slate-200 rounded-full"></div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{event.date}</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-800 mb-3 group-hover:text-primary transition-colors">{event.title}</h3>
                                        <p className="text-slate-500 font-medium leading-relaxed mb-6 line-clamp-3 group-hover:line-clamp-none transition-all duration-500">{event.description}</p>

                                        {event.location && (
                                            <p className="text-xs font-bold text-slate-300 flex items-center gap-2 group-hover:text-slate-400 transition-colors">
                                                <Icon name="location_on" size={16} className="text-primary/40" />
                                                {event.location}
                                            </p>
                                        )}
                                    </div>

                                    {/* 右侧：悬浮出现的控制按钮 */}
                                    <div className="flex flex-row lg:flex-col gap-3 opacity-70 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                                        <button
                                            onClick={() => editingId === event.id ? resetForm() : handleEdit(event)}
                                            className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 hover:bg-primary hover:text-white transition-all shadow-sm flex items-center justify-center font-black"
                                        >
                                            <Icon name={editingId === event.id ? "expand_less" : "edit"} size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center"
                                        >
                                            <Icon name="delete" size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <AdminModal
                isOpen={modalState.isOpen}
                onClose={closeModal}
                title={modalState.title}
                message={modalState.message}
                type={modalState.type}
                onConfirm={modalState.onConfirm || undefined}
                showCancel={modalState.showCancel}
                confirmText={modalState.confirmText}
            />
        </div>
    )
}

export default AdminTimeline

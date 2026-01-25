import { useState, useEffect, useRef } from 'react'
import { apiService } from '../../services/apiService'
import AdminModal from '../../components/AdminModal'
import { useAdminModal } from '../../hooks/useAdminModal'
import Icon from '../../components/icons/Icons'

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

                const { data, error } = await apiService.upload<{ url: string }>('/uploads', formDataUpload)
                if (error) throw new Error(error)
                if (data?.url) {
                    newImages.push(data.url)
                }
            } catch (error) {
                console.error('上传图片失败:', error)
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
        setShowForm(true)
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
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-1">时间轴管理</h1>
                    <p className="text-sm text-slate-400">记录我们的美好时光</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                    <Icon name="add" size={20} />
                    添加事件
                </button>
            </header>

            {showForm && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-8">
                    <h2 className="text-lg font-bold mb-6 text-slate-800">
                        {editingId ? '编辑事件' : '新建事件'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="事件标题"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm text-slate-700"
                                required
                            />
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm text-slate-700"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="地点（可选）"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm text-slate-700"
                            />
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm text-slate-700"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <textarea
                            placeholder="事件描述"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm text-slate-700 min-h-[100px]"
                        />

                        {/* 图片上传区域 */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-600">添加图片</label>
                            <div className="flex flex-wrap gap-3">
                                {formData.images.map((img, index) => (
                                    <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden group">
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                        >
                                            <Icon name="delete" size={24} className="text-white" />
                                        </button>
                                    </div>
                                ))}
                                <label className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                                    {uploading ? (
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                    ) : (
                                        <>
                                            <Icon name="add_photo_alternate" size={24} className="text-slate-400" />
                                            <span className="text-xs text-slate-400 mt-1">上传</span>
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

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all"
                            >
                                {editingId ? '更新' : '创建'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                            >
                                取消
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {events.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <Icon name="schedule" size={48} className="mx-auto mb-4 opacity-50" />
                        <p>还没有时间轴事件，记录第一个美好时刻吧！</p>
                    </div>
                ) : (
                    events.map((event) => (
                        <div key={event.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                                            {event.category}
                                        </span>
                                        <span className="text-xs text-slate-400">{event.date}</span>
                                    </div>
                                    <h3 className="font-bold text-slate-800 mb-1">{event.title}</h3>
                                    <p className="text-sm text-slate-500 mb-2">{event.description}</p>
                                    {event.location && (
                                        <p className="text-xs text-slate-400 flex items-center gap-1">
                                            <Icon name="location_on" size={14} />
                                            {event.location}
                                        </p>
                                    )}
                                    {event.images && event.images.length > 0 && (
                                        <div className="flex gap-2 mt-3">
                                            {event.images.slice(0, 4).map((img, i) => (
                                                <img key={i} src={img} alt="" className="w-16 h-16 rounded-lg object-cover" />
                                            ))}
                                            {event.images.length > 4 && (
                                                <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-sm text-slate-500">
                                                    +{event.images.length - 4}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(event)}
                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                    >
                                        <Icon name="edit" size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(event.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <Icon name="delete" size={18} />
                                    </button>
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

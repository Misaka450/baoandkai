import { useState, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { apiService } from '../../services/apiService'
import AdminModal from '../../components/modals/AdminModal'
import Modal from '../../components/modals/Modal'
import { useAdminModal } from '../../hooks/useAdminModal'
import Icon from '../../components/icons/Icons'
import { getThumbnailUrl } from '../../utils/imageUtils'
import Button from '../../components/admin/ui/Button'
import Card from '../../components/admin/ui/Card'
import { hapticFeedback } from '../../utils/haptics'

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
    const [exifNotice, setExifNotice] = useState<string | null>(null)
    const { modalState, showAlert, showConfirm, closeModal } = useAdminModal()
    const queryClient = useQueryClient()

    useEffect(() => {
        loadEvents()
    }, [])

    useEffect(() => {
        if (!exifNotice) return
        const timer = setTimeout(() => {
            setExifNotice(null)
        }, 3000)
        return () => clearTimeout(timer)
    }, [exifNotice])

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
        let currentDate = formData.date
        let currentLocation = formData.location

        for (const file of Array.from(files)) {
            try {
                const formDataUpload = new FormData()
                formDataUpload.append('file', file)
                formDataUpload.append('folder', 'timeline')

                const { data, error } = await apiService.uploadWithProgress<{
                    url: string
                    urls?: string[]
                    count?: number
                    exif?: {
                        date: string | null
                        dateTime: string | null
                        latitude: number | null
                        longitude: number | null
                        province: string | null
                        city: string | null
                        location: string | null
                    } | null
                }>(
                    '/upload',
                    formDataUpload,
                    (p) => setUploadProgress({ percent: p.percent, speed: p.speed })
                )
                if (error) throw new Error(error)
                if (data?.url) {
                    newImages.push(data.url)
                }
                if (data?.exif) {
                    const exif = data.exif
                    let autoFilled = false
                    if (!currentDate && exif.date) {
                        currentDate = exif.date
                        autoFilled = true
                    }
                    if (!currentLocation && exif.location) {
                        currentLocation = exif.location
                        autoFilled = true
                    }
                    if (autoFilled) {
                        setFormData(prev => ({
                            ...prev,
                            date: prev.date || (exif.date || ''),
                            location: prev.location || (exif.location || '')
                        }))
                        setExifNotice('✨ 已从照片自动读取拍摄日期与地点，你可以随时修改')
                    }
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
        } catch (err: any) {
            await showAlert('错误', err.message || '保存时间轴事件失败', 'error')
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
        setExifNotice(null)
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
        <div className="space-y-4 md:space-y-6">
            {/* 粘性玻璃头部 - 统一后台风格 */}
            <header className="premium-glass -mx-2 md:-mx-4 px-3 md:px-6 py-3 md:py-5 mb-2 md:mb-6 flex items-center justify-between backdrop-blur-xl rounded-2xl md:rounded-3xl">
                <div>
                    <h1 className="text-lg md:text-2xl font-black text-slate-800 tracking-tight">时间轴管理<span className="text-primary tracking-tighter ml-1">TIMELINE</span></h1>
                    <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">共记录了 {events.length} 个珍贵时刻</p>
                </div>
                <button
                    onClick={() => {
                        hapticFeedback('light')
                        resetForm()
                        setShowForm(true)
                    }}
                    className="px-3.5 py-2 md:px-6 md:py-3.5 bg-slate-900 text-white rounded-xl md:rounded-2xl text-xs md:text-sm font-bold shadow-md md:shadow-xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 md:gap-2 group flex-shrink-0"
                >
                    <Icon name="add" size={16} className="md:w-5 md:h-5 group-hover:rotate-90 transition-transform duration-500" />
                    <span>添加事件</span>
                </button>
            </header>

            {/* 统一的 Modal 弹窗表单 */}
            <Modal
                isOpen={showForm}
                onClose={resetForm}
                title={editingId ? '编辑美好回忆' : '记录新时刻'}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <AnimatePresence>
                        {exifNotice && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                onClick={() => setExifNotice(null)}
                                className="p-3 bg-amber-50 text-amber-800 text-xs font-medium rounded-xl flex items-center justify-between cursor-pointer border border-amber-200/60 shadow-sm transition-all"
                            >
                                <span>{exifNotice}</span>
                                <span className="text-amber-500 hover:text-amber-700 ml-2">✕</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
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
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="flex-1"
                        >
                            {editingId ? '保存更改' : '记录此刻'}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            size="lg"
                            onClick={resetForm}
                        >
                            取消
                        </Button>
                    </div>
                </form>
            </Modal>

            <div className="space-y-3 md:space-y-4 pb-8">
                {events.length === 0 ? (
                    <div className="text-center py-16 bg-white/60 rounded-3xl border border-stone-200/60">
                        <Icon name="auto_awesome" size={48} className="mx-auto mb-4 text-primary/30 animate-float" />
                        <p className="text-slate-400 font-bold text-sm">我们的故事，正等待被书写...</p>
                    </div>
                ) : (
                    events.map((event, index) => (
                        <div key={event.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                            <div className={`premium-card !p-3 sm:!p-4 md:!p-5 border-2 transition-all duration-300 hover:border-slate-200 ${editingId === event.id ? 'border-primary ring-4 ring-primary/10 shadow-lg' : 'border-transparent'}`}>
                                {/* 顶部状态栏：分类、日期、地点、操作按钮 */}
                                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-stone-100">
                                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] md:text-xs font-bold">
                                            {event.category}
                                        </span>
                                        <span className="text-[11px] md:text-xs font-bold text-slate-400">
                                            {event.date}
                                        </span>
                                        {event.location && (
                                            <span className="text-[11px] md:text-xs text-slate-400 font-medium flex items-center gap-0.5 truncate max-w-[140px] sm:max-w-[200px]">
                                                <Icon name="location_on" size={12} className="text-primary/60 flex-shrink-0" />
                                                <span className="truncate">{event.location}</span>
                                            </span>
                                        )}
                                    </div>
                                    {/* 快捷操作：编辑、删除（常驻轻量尺寸） */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                hapticFeedback('light')
                                                handleEdit(event)
                                            }}
                                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-stone-100 text-slate-600 hover:bg-primary hover:text-white transition-all flex items-center justify-center active:scale-90"
                                            title="编辑事件"
                                        >
                                            <Icon name="edit" size={14} className="sm:w-4 sm:h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                hapticFeedback('medium')
                                                handleDelete(event.id)
                                            }}
                                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-stone-100 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center active:scale-90"
                                            title="删除事件"
                                        >
                                            <Icon name="delete" size={14} className="sm:w-4 sm:h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* 主体内容：图文并茂，紧凑高密度 */}
                                <div className="flex items-start gap-3 sm:gap-4">
                                    {/* 配图缩略卡片 */}
                                    {event.images && event.images.length > 0 && event.images[0] && (
                                        <div className="relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-stone-200/60 shadow-xs bg-slate-100 group/img">
                                            <img
                                                src={getThumbnailUrl(event.images[0], 200)}
                                                alt=""
                                                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                                            />
                                            {event.images.length > 1 && (
                                                <span className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                                                    +{event.images.length - 1}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* 文本区域 */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-800 leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                                            {event.title}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 line-clamp-2 leading-relaxed">
                                            {event.description || '暂无详细描述'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <AdminModal isOpen={modalState.isOpen} onClose={closeModal} title={modalState.title} message={modalState.message} type={modalState.type} onConfirm={modalState.onConfirm || undefined} showCancel={modalState.showCancel} confirmText={modalState.confirmText} />
        </div>
    )
}

export default AdminTimeline

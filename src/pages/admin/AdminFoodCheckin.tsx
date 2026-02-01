```
import { useState, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiService } from '../../services/apiService'
import AdminModal from '../../components/AdminModal'
import Modal from '../../components/Modal'
import { useAdminModal } from '../../hooks/useAdminModal'
import Icon from '../../components/icons/Icons'
import { getThumbnailUrl } from '../../utils/imageUtils'

interface FoodCheckin {
    id: number
    restaurant_name: string
    description: string
    date: string
    address: string
    cuisine: string
    price_range: string
    overall_rating: number
    recommended_dishes: string[]
    images: string[]
}

interface FormData {
    restaurant_name: string
    description: string
    date: string
    address: string
    cuisine: string
    price_range: string
    overall_rating: number
    recommended_dishes: string
    images: string[]
}

const cuisines = ['中餐', '日料', '韩餐', '西餐', '泰餐', '火锅', '烧烤', '甜品', '其他']
const priceRanges = ['¥', '¥¥', '¥¥¥', '¥¥¥¥']

const AdminFoodCheckin = () => {
    const [checkins, setCheckins] = useState<FoodCheckin[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState<{ percent: number, speed: number } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [formData, setFormData] = useState<FormData>({
        restaurant_name: '', description: '', date: '', address: '',
        cuisine: '中餐', price_range: '¥¥', overall_rating: 5, recommended_dishes: '', images: []
    })
    const { modalState, showAlert, showConfirm, closeModal } = useAdminModal()
    const queryClient = useQueryClient()

    useEffect(() => { loadCheckins() }, [])

    const loadCheckins = async () => {
        try {
            const { data, error } = await apiService.get<{ data: FoodCheckin[] }>('/food?limit=100')
            if (error) throw new Error(error)
            setCheckins(data?.data || [])
        } catch (e) { console.error(e) } finally { setLoading(false) }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return
        setUploading(true)
        const newImages: string[] = []
        for (const file of Array.from(e.target.files)) {
            try {
                const fd = new FormData()
                fd.append('file', file)
                fd.append('folder', 'food')
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
        setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }))
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const removeImage = (index: number) => {
        setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const payload = { ...formData, recommended_dishes: formData.recommended_dishes.split('，').map(d => d.trim()).filter(Boolean) }
            if (editingId) {
                const { error } = await apiService.put(`/ food / ${ editingId } `, payload)
                if (error) throw new Error(error)
                await showAlert('成功', '美食打卡已更新！', 'success')
            } else {
                const { error } = await apiService.post('/food', payload)
                if (error) throw new Error(error)
                await showAlert('成功', '美食打卡已创建！', 'success')
            }
            resetForm(); loadCheckins()
            queryClient.invalidateQueries({ queryKey: ['food'] });
        } catch { await showAlert('错误', '保存失败', 'error') }
    }

    const handleEdit = (c: FoodCheckin) => {
        setEditingId(c.id)
        // recommended_dishes 可能是数组或字符串（从后端返回）
        const dishes = Array.isArray(c.recommended_dishes)
            ? c.recommended_dishes.join('，')
            : (c.recommended_dishes || '')
        // images 可能是数组或逗号分隔的字符串
        const imgs = Array.isArray(c.images)
            ? c.images
            : (c.images ? String(c.images).split(',').filter(Boolean) : [])
        setFormData({ restaurant_name: c.restaurant_name, description: c.description, date: c.date, address: c.address, cuisine: c.cuisine, price_range: c.price_range, overall_rating: c.overall_rating, recommended_dishes: dishes, images: imgs })
        setShowForm(true)
    }

    const handleDelete = async (id: number) => {
        if (!await showConfirm('删除打卡', '确定要删除这个美食打卡吗？')) return
        try {
            const { error } = await apiService.delete(`/ food / ${ id } `)
            if (error) throw new Error(error)
            await showAlert('成功', '已删除！', 'success'); loadCheckins()
            queryClient.invalidateQueries({ queryKey: ['food'] });
        } catch { await showAlert('错误', '删除失败', 'error') }
    }

    const resetForm = () => { setShowForm(false); setEditingId(null); setFormData({ restaurant_name: '', description: '', date: '', address: '', cuisine: '中餐', price_range: '¥¥', overall_rating: 5, recommended_dishes: '', images: [] }) }

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

    return (
        <div className="animate-fade-in text-slate-700">
            {/* 粘性玻璃头部 */}
            <header className="premium-glass -mx-4 px-4 py-6 mb-8 flex items-center justify-between backdrop-blur-xl">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">美食打卡<span className="text-primary tracking-tighter ml-1">FOODIE</span></h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taste the world, one bite at a time</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
                >
                    <Icon name="add" size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                    新增打卡
                </button>
            </header>
            <Modal
                isOpen={showForm}
                onClose={resetForm}
                title={editingId ? '编辑美食打卡' : '新增美食打卡'}
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">餐厅名称</label>
                            <input type="text" placeholder="输入餐厅名称..." value={formData.restaurant_name} onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-slate-800 font-medium transition-all" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">打卡日期</label>
                            <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-slate-800 font-medium transition-all" required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">餐厅地址</label>
                        <input type="text" placeholder="输入详细地址..." value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-slate-800 font-medium transition-all" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">菜系分类</label>
                            <select value={formData.cuisine} onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-slate-800 font-medium transition-all">{cuisines.map(c => <option key={c} value={c}>{c}</option>)}</select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">价格区间</label>
                            <select value={formData.price_range} onChange={(e) => setFormData({ ...formData, price_range: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-slate-800 font-medium transition-all">{priceRanges.map(p => <option key={p} value={p}>{p}</option>)}</select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">推荐指数</label>
                            <div className="flex items-center h-[56px] gap-2">{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" onClick={() => setFormData({ ...formData, overall_rating: n })} className={`text - 2xl transition - all hover: scale - 125 ${ n <= formData.overall_rating ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]' : 'text-slate-200' } `}>★</button>)}</div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">用餐心得</label>
                        <textarea placeholder="分享你的美食体验..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-slate-800 font-medium min-h-[120px] transition-all" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">推荐菜品</label>
                        <input type="text" placeholder="例如：招牌红烧肉，清蒸鲈鱼（用中文逗号分隔）" value={formData.recommended_dishes} onChange={(e) => setFormData({ ...formData, recommended_dishes: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-slate-800 font-medium transition-all" />
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">美食照片</label>
                        <div className="flex flex-wrap gap-4">
                            {formData.images.map((img, i) => (
                                 <div key={i} className="relative w-28 h-28 rounded-2xl overflow-hidden group shadow-md">
                                    <img src={getThumbnailUrl(img, 200)} alt="" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => removeImage(i)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Icon name="delete" size={24} className="text-white" /></button>
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
                                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 sticky bottom-0 bg-white py-4 border-t border-slate-50">
                        <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all">{editingId ? '保存修改' : '立即发布'}</button>
                        <button type="button" onClick={resetForm} className="px-10 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">取消</button>
                    </div>
                </form>
            </Modal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
                {checkins.length === 0 ? (
                    <div className="col-span-full text-center py-24 glass-card rounded-[3rem]">
                        <Icon name="restaurant" size={64} className="mx-auto mb-6 text-primary/20 animate-float" />
                        <p className="text-slate-400 font-bold tracking-tight">空空如也，快去探索美食吧！</p>
                    </div>
                ) : (
                    checkins.map((c, index) => (
                        <div key={c.id} className="animate-slide-up" style={{ animationDelay: `${ index * 0.1 } s` }}>
                            <div className="premium-card p-8 group h-full flex flex-col">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className="premium-badge">{c.cuisine}</span>
                                            <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-black text-slate-400 rounded-lg">{c.price_range}</span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 group-hover:text-primary transition-colors truncate">{c.restaurant_name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{c.date}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 opacity-70 group-hover:opacity-100 transition-all duration-500">
                                        <button onClick={() => handleEdit(c)} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-primary hover:text-white transition-all flex items-center justify-center shadow-sm"><Icon name="edit" size={18} /></button>
                                        <button onClick={() => handleDelete(c.id)} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"><Icon name="delete" size={18} /></button>
                                    </div>
                                </div>

                                <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6 line-clamp-2 italic">
                                    "{c.description}"
                                </p>

                                {c.images && c.images.length > 0 && (
                                    <div className="grid grid-cols-3 gap-3 mb-6">
                                         {c.images.slice(0, 3).map((img, i) => (
                                            <div key={i} className="aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-sm hover:scale-105 transition-transform duration-500">
                                                <img src={getThumbnailUrl(img, 200)} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <span key={star} className={`text - lg leading - none transition - all duration - 500 ${ star <= c.overall_rating ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)] scale-110' : 'text-slate-100' } `}>
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                    {c.address && (
                                        <span className="text-[10px] font-bold text-slate-300 max-w-[150px] truncate flex items-center gap-1 group-hover:text-slate-400 transition-colors">
                                            <Icon name="location_on" size={12} className="text-primary/40" />
                                            {c.address}
                                        </span>
                                    )}
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

export default AdminFoodCheckin

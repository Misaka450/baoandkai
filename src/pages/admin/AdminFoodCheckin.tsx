import { useState, useEffect, useRef } from 'react'
import { apiService } from '../../services/apiService'
import AdminModal from '../../components/AdminModal'
import { useAdminModal } from '../../hooks/useAdminModal'
import Icon from '../../components/icons/Icons'

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
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [formData, setFormData] = useState<FormData>({
        restaurant_name: '', description: '', date: '', address: '',
        cuisine: '中餐', price_range: '¥¥', overall_rating: 5, recommended_dishes: '', images: []
    })
    const { modalState, showAlert, showConfirm, closeModal } = useAdminModal()

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
                const { data, error } = await apiService.upload<{ url: string }>('/uploads', fd)
                if (error) throw new Error(error)
                if (data?.url) newImages.push(data.url)
            } catch (err) { console.error(err) }
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
                const { error } = await apiService.put(`/food/${editingId}`, payload)
                if (error) throw new Error(error)
                await showAlert('成功', '美食打卡已更新！', 'success')
            } else {
                const { error } = await apiService.post('/food', payload)
                if (error) throw new Error(error)
                await showAlert('成功', '美食打卡已创建！', 'success')
            }
            resetForm(); loadCheckins()
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
            const { error } = await apiService.delete(`/food/${id}`)
            if (error) throw new Error(error)
            await showAlert('成功', '已删除！', 'success'); loadCheckins()
        } catch { await showAlert('错误', '删除失败', 'error') }
    }

    const resetForm = () => { setShowForm(false); setEditingId(null); setFormData({ restaurant_name: '', description: '', date: '', address: '', cuisine: '中餐', price_range: '¥¥', overall_rating: 5, recommended_dishes: '', images: [] }) }

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

    return (
        <div className="animate-fade-in text-slate-700">
            <header className="flex items-center justify-between mb-8">
                <div><h1 className="text-2xl font-bold text-slate-800 mb-1">美食打卡</h1><p className="text-sm text-slate-400">记录我们的美食探店</p></div>
                <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"><Icon name="add" size={20} />新增打卡</button>
            </header>
            {showForm && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-8">
                    <h2 className="text-lg font-bold mb-6 text-slate-800">{editingId ? '编辑打卡' : '新增打卡'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="餐厅名称" value={formData.restaurant_name} onChange={(e) => setFormData({ ...formData, restaurant_name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm" required />
                            <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm" required />
                        </div>
                        <input type="text" placeholder="地址" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <select value={formData.cuisine} onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm">{cuisines.map(c => <option key={c} value={c}>{c}</option>)}</select>
                            <select value={formData.price_range} onChange={(e) => setFormData({ ...formData, price_range: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm">{priceRanges.map(p => <option key={p} value={p}>{p}</option>)}</select>
                            <div className="flex items-center gap-2"><span className="text-sm text-slate-500">评分：</span>{[1, 2, 3, 4, 5].map(n => <button key={n} type="button" onClick={() => setFormData({ ...formData, overall_rating: n })} className={`text-xl ${n <= formData.overall_rating ? 'text-yellow-400' : 'text-slate-200'}`}>★</button>)}</div>
                        </div>
                        <textarea placeholder="用餐体验" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm min-h-[80px]" />
                        <input type="text" placeholder="推荐菜品（用中文逗号分隔）" value={formData.recommended_dishes} onChange={(e) => setFormData({ ...formData, recommended_dishes: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm" />
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-600">美食照片</label>
                            <div className="flex flex-wrap gap-3">
                                {formData.images.map((img, i) => (
                                    <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden group">
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removeImage(i)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Icon name="delete" size={24} className="text-white" /></button>
                                    </div>
                                ))}
                                <label className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                                    {uploading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div> : <><Icon name="add_photo_alternate" size={24} className="text-slate-400" /><span className="text-xs text-slate-400 mt-1">上传</span></>}
                                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploading} />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {checkins.length === 0 ? <div className="col-span-full text-center py-12 text-slate-400"><Icon name="restaurant" size={48} className="mx-auto mb-4 opacity-50" /><p>还没有美食打卡，记录第一次探店吧！</p></div> : checkins.map((c) => (
                    <div key={c.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-start justify-between mb-3">
                            <div><h3 className="font-bold text-slate-800">{c.restaurant_name}</h3><p className="text-xs text-slate-400">{c.date} · {c.cuisine} · {c.price_range}</p></div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(c)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"><Icon name="edit" size={18} /></button>
                                <button onClick={() => handleDelete(c.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Icon name="delete" size={18} /></button>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 mb-3">{c.description}</p>
                        {c.images && c.images.length > 0 && (
                            <div className="flex gap-2 mb-3">{c.images.slice(0, 3).map((img, i) => <img key={i} src={img} alt="" className="w-16 h-16 rounded-lg object-cover" />)}{c.images.length > 3 && <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center text-sm text-slate-500">+{c.images.length - 3}</div>}</div>
                        )}
                        <div className="flex items-center gap-4">
                            <div className="text-yellow-400">{'★'.repeat(c.overall_rating)}{'☆'.repeat(5 - c.overall_rating)}</div>
                            {c.address && <span className="text-xs text-slate-400 flex items-center gap-1"><Icon name="location_on" size={14} />{c.address}</span>}
                        </div>
                    </div>
                ))}
            </div>
            <AdminModal isOpen={modalState.isOpen} onClose={closeModal} title={modalState.title} message={modalState.message} type={modalState.type} onConfirm={modalState.onConfirm || undefined} showCancel={modalState.showCancel} confirmText={modalState.confirmText} />
        </div>
    )
}

export default AdminFoodCheckin

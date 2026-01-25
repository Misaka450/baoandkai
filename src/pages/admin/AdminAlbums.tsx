import { useState, useEffect, useRef } from 'react'
import { apiService } from '../../services/apiService'
import AdminModal from '../../components/AdminModal'
import { useAdminModal } from '../../hooks/useAdminModal'
import Icon from '../../components/icons/Icons'

interface Album {
    id: number
    name: string
    description: string
    cover_url: string
    photo_count?: number
}

interface Photo {
    id: number
    url: string
    caption: string
}

const AdminAlbums = () => {
    const [albums, setAlbums] = useState<Album[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
    const [photos, setPhotos] = useState<Photo[]>([])
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [formData, setFormData] = useState({ name: '', description: '' })
    const { modalState, showAlert, showConfirm, closeModal } = useAdminModal()

    useEffect(() => { loadAlbums() }, [])

    const loadAlbums = async () => {
        try {
            const { data, error } = await apiService.get<{ data: Album[] }>('/albums?limit=100')
            if (error) throw new Error(error)
            setAlbums(data?.data || [])
        } catch (e) { console.error(e) } finally { setLoading(false) }
    }

    const loadPhotos = async (albumId: number) => {
        try {
            const { data, error } = await apiService.get<{ data: Photo[] }>(`/albums/${albumId}/photos`)
            if (error) throw new Error(error)
            setPhotos(data?.data || [])
        } catch (e) { console.error(e) }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingId) {
                const { error } = await apiService.put(`/albums/${editingId}`, formData)
                if (error) throw new Error(error)
                await showAlert('成功', '相册已更新！', 'success')
            } else {
                const { error } = await apiService.post('/albums', formData)
                if (error) throw new Error(error)
                await showAlert('成功', '相册已创建！', 'success')
            }
            resetForm(); loadAlbums()
        } catch { await showAlert('错误', '保存失败', 'error') }
    }

    const handleEdit = (album: Album) => {
        setEditingId(album.id)
        setFormData({ name: album.name, description: album.description })
        setShowForm(true)
    }

    const handleDelete = async (id: number) => {
        if (!await showConfirm('删除相册', '确定删除？相册中的所有照片也会被删除。')) return
        try {
            const { error } = await apiService.delete(`/albums/${id}`)
            if (error) throw new Error(error)
            await showAlert('成功', '已删除！', 'success'); loadAlbums()
        } catch { await showAlert('错误', '删除失败', 'error') }
    }

    const handleViewAlbum = (album: Album) => {
        setSelectedAlbum(album)
        loadPhotos(album.id)
    }

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedAlbum || !e.target.files?.length) return
        setUploading(true)
        for (const file of Array.from(e.target.files)) {
            try {
                const formDataUpload = new FormData()
                formDataUpload.append('file', file)
                formDataUpload.append('album_id', String(selectedAlbum.id))
                const { error } = await apiService.upload(`/albums/${selectedAlbum.id}/photos`, formDataUpload)
                if (error) throw new Error(error)
            } catch (err) { console.error(err) }
        }
        setUploading(false)
        loadPhotos(selectedAlbum.id)
        loadAlbums()
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleDeletePhoto = async (photoId: number) => {
        if (!selectedAlbum || !await showConfirm('删除照片', '确定删除这张照片？')) return
        try {
            const { error } = await apiService.delete(`/albums/${selectedAlbum.id}/photos/${photoId}`)
            if (error) throw new Error(error)
            loadPhotos(selectedAlbum.id); loadAlbums()
        } catch { await showAlert('错误', '删除失败', 'error') }
    }

    const handleSetCover = async (photoUrl: string) => {
        if (!selectedAlbum) return
        try {
            const { error } = await apiService.put(`/albums/${selectedAlbum.id}`, {
                name: selectedAlbum.name,
                description: selectedAlbum.description,
                cover_url: photoUrl
            })
            if (error) throw new Error(error)
            await showAlert('成功', '封面已设置！', 'success')
            loadAlbums()
            setSelectedAlbum({ ...selectedAlbum, cover_url: photoUrl })
        } catch { await showAlert('错误', '设置封面失败', 'error') }
    }

    const resetForm = () => { setShowForm(false); setEditingId(null); setFormData({ name: '', description: '' }) }

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

    if (selectedAlbum) {
        return (
            <div className="animate-fade-in text-slate-700">
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedAlbum(null)} className="p-2 hover:bg-slate-100 rounded-xl"><Icon name="west" size={20} /></button>
                        <div><h1 className="text-2xl font-bold text-slate-800">{selectedAlbum.name}</h1><p className="text-sm text-slate-400">{photos.length} 张照片</p></div>
                    </div>
                    <label className="px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer">
                        {uploading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <><Icon name="add_photo_alternate" size={20} />上传照片</>}
                        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
                    </label>
                </header>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.map(photo => (
                        <div key={photo.id} className="relative group aspect-square rounded-2xl overflow-hidden bg-slate-100">
                            {selectedAlbum.cover_url === photo.url && (
                                <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-primary text-white text-xs rounded-full">封面</div>
                            )}
                            <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button onClick={() => handleSetCover(photo.url)} className="p-3 bg-primary text-white rounded-full hover:bg-primary/80" title="设为封面"><Icon name="photo_album" size={20} /></button>
                                <button onClick={() => handleDeletePhoto(photo.id)} className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600" title="删除"><Icon name="delete" size={20} /></button>
                            </div>
                        </div>
                    ))}
                    {photos.length === 0 && <div className="col-span-full text-center py-12 text-slate-400"><Icon name="photo_library" size={48} className="mx-auto mb-4 opacity-50" /><p>还没有照片，上传第一张吧！</p></div>}
                </div>
                <AdminModal isOpen={modalState.isOpen} onClose={closeModal} title={modalState.title} message={modalState.message} type={modalState.type} onConfirm={modalState.onConfirm || undefined} showCancel={modalState.showCancel} confirmText={modalState.confirmText} />
            </div>
        )
    }

    return (
        <div className="animate-fade-in text-slate-700">
            <header className="flex items-center justify-between mb-8">
                <div><h1 className="text-2xl font-bold text-slate-800 mb-1">相册管理</h1><p className="text-sm text-slate-400">管理我们的照片相册</p></div>
                <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"><Icon name="add" size={20} />新建相册</button>
            </header>
            {showForm && (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-8">
                    <h2 className="text-lg font-bold mb-6 text-slate-800">{editingId ? '编辑相册' : '新建相册'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input type="text" placeholder="相册名称" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm" required />
                        <textarea placeholder="相册描述" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-sm min-h-[100px]" />
                        <div className="flex gap-3">
                            <button type="submit" className="px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all">{editingId ? '更新' : '创建'}</button>
                            <button type="button" onClick={resetForm} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all">取消</button>
                        </div>
                    </form>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {albums.length === 0 ? <div className="col-span-full text-center py-12 text-slate-400"><Icon name="photo_library" size={48} className="mx-auto mb-4 opacity-50" /><p>还没有相册，创建第一个相册吧！</p></div> : albums.map((album) => (
                    <div key={album.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group cursor-pointer" onClick={() => handleViewAlbum(album)}>
                        <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            {album.cover_url ? <img src={album.cover_url} alt={album.name} className="w-full h-full object-cover" /> : <Icon name="photo_library" size={48} className="text-primary/50" />}
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-slate-800 mb-1">{album.name}</h3>
                            <p className="text-sm text-slate-500 mb-3 line-clamp-2">{album.description}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">{album.photo_count || 0} 张照片</span>
                                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => handleEdit(album)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"><Icon name="edit" size={18} /></button>
                                    <button onClick={() => handleDelete(album.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Icon name="delete" size={18} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <AdminModal isOpen={modalState.isOpen} onClose={closeModal} title={modalState.title} message={modalState.message} type={modalState.type} onConfirm={modalState.onConfirm || undefined} showCancel={modalState.showCancel} confirmText={modalState.confirmText} />
        </div>
    )
}

export default AdminAlbums

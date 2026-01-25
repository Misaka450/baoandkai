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
    const [uploadingFiles, setUploadingFiles] = useState<{
        id: string;
        file: File;
        preview: string;
        progress: number;
        speed: number;
    }[]>([])
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

        const files = Array.from(e.target.files);
        const newUploads = files.map(file => ({
            id: Math.random().toString(36).substring(7),
            file,
            preview: URL.createObjectURL(file),
            progress: 0,
            speed: 0
        }));

        setUploadingFiles(prev => [...prev, ...newUploads]);

        // 串行上传以保证稳定性，或者并行上传（用户要求“完成一张显示一张”）
        for (const uploadItem of newUploads) {
            try {
                const formDataUpload = new FormData()
                formDataUpload.append('file', uploadItem.file)
                formDataUpload.append('album_id', String(selectedAlbum.id))

                const { data, error } = await apiService.uploadWithProgress<Photo>(
                    `/albums/${selectedAlbum.id}/photos`,
                    formDataUpload,
                    (p) => {
                        setUploadingFiles(prev => prev.map(item =>
                            item.id === uploadItem.id
                                ? { ...item, progress: p.percent, speed: p.speed }
                                : item
                        ))
                    }
                );

                if (error) throw new Error(error);

                // 上传成功后，将照片添加到列表并移除正在上传的状态
                if (data) {
                    setPhotos(prev => [data, ...prev]);
                    // 同时更新相册列表中的计数（可选）
                    setAlbums(prev => prev.map(a => a.id === selectedAlbum.id ? { ...a, photo_count: (a.photo_count || 0) + 1 } : a));
                }
            } catch (err) {
                console.error('上传失败:', err);
            } finally {
                setUploadingFiles(prev => prev.filter(item => item.id !== uploadItem.id));
                URL.revokeObjectURL(uploadItem.preview);
            }
        }

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

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-80 gap-4">
            <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-slate-400 text-sm animate-pulse">正在整理照片集...</p>
        </div>
    )

    if (selectedAlbum) {
        return (
            <div className="animate-fade-in text-slate-700 pb-20">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-white/50 sticky top-0 z-40 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSelectedAlbum(null)}
                            className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-50 text-slate-600 rounded-full shadow-sm border border-slate-100 transition-all hover:scale-110 active:scale-95"
                        >
                            <Icon name="west" size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">{selectedAlbum.name}</h1>
                            <p className="text-sm text-slate-400 flex items-center gap-2">
                                <Icon name="photo_library" size={14} />
                                {photos.length} 张珍贵回忆
                            </p>
                        </div>
                    </div>

                    <label className="px-8 py-3.5 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer min-w-[160px] justify-center">
                        <Icon name="add_photo_alternate" size={20} />
                        添加照片
                        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                    </label>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {/* 正在上传的文件卡片 */}
                    {uploadingFiles.map(upload => (
                        <div key={upload.id} className="relative aspect-square rounded-3xl overflow-hidden bg-slate-900 shadow-sm border-4 border-white transition-all">
                            <img src={upload.preview} alt="uploading" className="w-full h-full object-cover opacity-40 blur-[2px]" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                                <div className="relative w-16 h-16 mb-3">
                                    <svg className="w-full h-full" viewBox="0 0 36 36">
                                        <path
                                            className="text-white/20"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path
                                            className="text-white transition-all duration-300"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeDasharray={`${upload.progress}, 100`}
                                            strokeLinecap="round"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black">
                                        {upload.progress}%
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{upload.speed} KB/S</p>
                            </div>
                        </div>
                    ))}

                    {photos.map(photo => (
                        <div key={photo.id} className="relative group aspect-square rounded-3xl overflow-hidden bg-slate-100 shadow-sm border-4 border-white transition-all hover:shadow-xl hover:-translate-y-1">
                            {selectedAlbum.cover_url === photo.url && (
                                <div className="absolute top-3 left-3 z-10 px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full shadow-lg ring-2 ring-white/50">
                                    当前封面
                                </div>
                            )}
                            <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-6 gap-3">
                                <button
                                    onClick={() => handleSetCover(photo.url)}
                                    className="w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-primary transition-all flex items-center justify-center"
                                    title="设为封面"
                                >
                                    <Icon name="photo_album" size={18} />
                                </button>
                                <button
                                    onClick={() => handleDeletePhoto(photo.id)}
                                    className="w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-red-500 transition-all flex items-center justify-center"
                                    title="删除"
                                >
                                    <Icon name="delete" size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {photos.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white/30 border-2 border-dashed border-slate-200 rounded-3xl">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4 scale-110">
                                <Icon name="photo_library" size={40} />
                            </div>
                            <h3 className="text-slate-400 font-bold mb-1">这里还没有照片</h3>
                            <p className="text-slate-300 text-sm">点右上角按钮上传我们的瞬间吧</p>
                        </div>
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

    return (
        <div className="animate-fade-in text-slate-700 pb-20">
            <header className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 mb-1 tracking-tight italic">时光集锦</h1>
                    <p className="text-sm text-slate-400">管理每一份值得铭记的回忆</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
                >
                    <Icon name="add" size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    新建相册
                </button>
            </header>

            {showForm && (
                <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 mb-10 animate-slide-up relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-primary"></div>
                    <h2 className="text-xl font-bold mb-8 text-slate-800 flex items-center gap-2">
                        <Icon name={editingId ? 'edit' : 'folder_special'} className="text-primary" />
                        {editingId ? '优化回忆集' : '开启新的记录'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">相册名称</label>
                            <input
                                type="text"
                                placeholder="例如：西藏行、宝贝的二十岁"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-[1.25rem] transition-all outline-none font-medium"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">相册描述</label>
                            <textarea
                                placeholder="写下这段回忆的主题..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-[1.25rem] transition-all outline-none min-h-[120px] resize-none"
                            />
                        </div>
                        <div className="flex gap-4 pt-2">
                            <button type="submit" className="flex-1 px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                                {editingId ? '保存修更' : '立即创建'}
                            </button>
                            <button type="button" onClick={resetForm} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold hover:bg-slate-200 transition-all">
                                算了
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {albums.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-32 opacity-30">
                        <Icon name="photo_library" size={80} className="mb-6" />
                        <p className="font-bold text-xl tracking-widest uppercase">等待被填满的空白</p>
                    </div>
                ) : (
                    albums.map((album) => (
                        <div
                            key={album.id}
                            className="bg-white rounded-[2rem] shadow-sm hover:shadow-2xl hover:-translate-y-2 border border-slate-100 overflow-hidden group transition-all duration-500 cursor-pointer"
                            onClick={() => handleViewAlbum(album)}
                        >
                            <div className="relative aspect-video overflow-hidden">
                                {album.cover_url ? (
                                    <img src={album.cover_url} alt={album.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 flex items-center justify-center text-primary/30">
                                        <Icon name="photo_library" size={48} />
                                    </div>
                                )}
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full text-[10px] font-black text-slate-800 shadow-sm border border-white/50 z-10">
                                    {album.photo_count || 0} ITEMS
                                </div>
                            </div>
                            <div className="p-6 relative">
                                <div className="absolute top-0 right-6 translate-y-[-50%] flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <button
                                        onClick={e => { e.stopPropagation(); handleEdit(album); }}
                                        className="w-10 h-10 bg-white shadow-lg text-slate-400 hover:text-primary rounded-xl flex items-center justify-center transition-all hover:scale-110"
                                    >
                                        <Icon name="edit" size={18} />
                                    </button>
                                    <button
                                        onClick={e => { e.stopPropagation(); handleDelete(album.id); }}
                                        className="w-10 h-10 bg-white shadow-lg text-slate-400 hover:text-red-500 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                                    >
                                        <Icon name="delete" size={18} />
                                    </button>
                                </div>
                                <h3 className="font-black text-xl text-slate-800 mb-2 truncate group-hover:text-primary transition-colors tracking-tight">{album.name}</h3>
                                <p className="text-sm text-slate-400 mb-0 line-clamp-2 leading-relaxed">{album.description || '这一刻，值得被记录...'}</p>
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

export default AdminAlbums

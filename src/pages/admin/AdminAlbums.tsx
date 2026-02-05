import { useState, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiService } from '../../services/apiService'
import AdminModal from '../../components/AdminModal'
import Modal from '../../components/Modal'
import { useAdminModal } from '../../hooks/useAdminModal'
import { Icon } from '../../components/icons/Icons'
import { compressImage, getThumbnailUrl } from '../../utils/imageUtils'
import { motion, AnimatePresence } from 'framer-motion'

interface Album {
    id: number
    name: string
    description: string
    cover_url: string
    photo_count: number
}

interface Photo {
    id: number
    url: string
    caption: string
    album_id: number
    sort_order?: number
}

const AdminAlbums = () => {
    const [albums, setAlbums] = useState<Album[]>([])
    const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)
    const [photos, setPhotos] = useState<Photo[]>([])
    const [loading, setLoading] = useState(true)
    const [showAlbumForm, setShowAlbumForm] = useState(false)
    const [albumName, setAlbumName] = useState('')
    const [albumDesc, setAlbumDesc] = useState('')
    const [uploadingFiles, setUploadingFiles] = useState<{ id: string, progress: number, speed: number, preview: string }[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [editingAlbum, setEditingAlbum] = useState<Album | null>(null)

    // New Feature State
    const [draggedPhoto, setDraggedPhoto] = useState<Photo | null>(null)
    const [editingCaption, setEditingCaption] = useState<{ id: number, text: string } | null>(null)
    const { modalState, showAlert, showConfirm, closeModal } = useAdminModal()
    const queryClient = useQueryClient()

    useEffect(() => {
        loadAlbums()
    }, [])

    const loadAlbums = async () => {
        try {
            const { data, error } = await apiService.get<{ data: Album[] }>('/albums')
            if (error) throw new Error(error)
            const albumList = data?.data || []
            setAlbums(albumList)

            if (albumList.length > 0 && !selectedAlbum) {
                const first = albumList[0]
                if (first) {
                    setSelectedAlbum(first)
                    loadPhotos(first.id)
                }
            }
        } catch (error) {
            console.error('加载相册失败:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadPhotos = async (albumId: number) => {
        try {
            const { data, error } = await apiService.get<{ data: Photo[] }>(`/albums/${albumId}/photos`)
            if (error) throw new Error(error)
            setPhotos(data?.data || [])
        } catch (error) {
            console.error('加载照片失败:', error)
        }
    }

    const handleAlbumClick = (album: Album) => {
        setSelectedAlbum(album)
        loadPhotos(album.id)
    }

    // --- Drag & Drop Logic ---
    const handleDragStart = (e: React.DragEvent, photo: Photo) => {
        setDraggedPhoto(photo)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDragEnter = (targetPhoto: Photo) => {
        if (!draggedPhoto || draggedPhoto.id === targetPhoto.id) return

        const newPhotos = [...photos]
        const draggedIndex = newPhotos.findIndex(p => p.id === draggedPhoto.id)
        const targetIndex = newPhotos.findIndex(p => p.id === targetPhoto.id)

        if (draggedIndex !== -1 && targetIndex !== -1) {
            newPhotos.splice(draggedIndex, 1)
            newPhotos.splice(targetIndex, 0, draggedPhoto)
            setPhotos(newPhotos)
        }
    }

    const handleDragEnd = async (e: React.DragEvent | any) => {
        if (!selectedAlbum || !draggedPhoto) return
        setDraggedPhoto(null)

        try {
            const reorderData = photos.map((p, index) => ({
                id: p.id,
                sort_order: index
            }))

            await apiService.post(`/albums/${selectedAlbum.id}/photos/reorder`, reorderData)
        } catch (error) {
            console.error('排序更新失败:', error)
            await showAlert('错误', '排序未保存成功', 'error')
            loadPhotos(selectedAlbum.id)
        }
    }

    // --- Caption Editing Logic ---
    const startEditingCaption = (photo: Photo) => {
        setEditingCaption({ id: photo.id, text: photo.caption || '' })
    }

    const saveCaption = async () => {
        if (!editingCaption || !selectedAlbum) return

        try {
            const { error } = await apiService.put(`/albums/${selectedAlbum.id}/photos/${editingCaption.id}`, {
                caption: editingCaption.text
            })
            if (error) throw new Error(error)

            setPhotos(prev => prev.map(p =>
                p.id === editingCaption.id ? { ...p, caption: editingCaption.text } : p
            ))
            setEditingCaption(null)
        } catch (error) {
            console.error('更新名称失败:', error)
            await showAlert('错误', '名称更新失败', 'error')
        }
    }

    const handleCaptionKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            saveCaption()
        } else if (e.key === 'Escape') {
            setEditingCaption(null)
        }
    }

    const handleCreateAlbum = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingAlbum) {
                const { error } = await apiService.put(`/albums/${editingAlbum.id}`, { name: albumName, description: albumDesc })
                if (error) throw new Error(error)
                await showAlert('成功', '相册已更新！', 'success')
            } else {
                const { error } = await apiService.post('/albums', { name: albumName, description: albumDesc })
                if (error) throw new Error(error)
                await showAlert('成功', '相册已创建！', 'success')
            }
            setAlbumName('')
            setAlbumDesc('')
            setShowAlbumForm(false)
            setEditingAlbum(null)
            loadAlbums()
        } catch (error) {
            await showAlert('错误', '操作失败', 'error')
        }
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

        for (const uploadItem of newUploads) {
            try {
                const thumbnailFile = await compressImage(uploadItem.file, 800, 0.7);
                const formDataUpload = new FormData()
                formDataUpload.append('file', uploadItem.file)
                formDataUpload.append('thumbnail', thumbnailFile)
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

                if (data) {
                    setPhotos(prev => [data, ...prev]);
                    setAlbums(prev => prev.map(a => a.id === selectedAlbum.id ? { ...a, photo_count: (a.photo_count || 0) + 1 } : a));
                    queryClient.invalidateQueries({ queryKey: ['album-detail', String(selectedAlbum.id)] });
                    queryClient.invalidateQueries({ queryKey: ['albums'] });
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
        const confirmed = await showConfirm('删除照片', '确定要删除这张照片吗？')
        if (!confirmed) return

        try {
            const { error } = await apiService.delete(`/albums/${selectedAlbum?.id}/photos/${photoId}`)
            if (error) throw new Error(error)
            setPhotos(prev => prev.filter(p => p.id !== photoId))
            setAlbums(prev => prev.map(a => a.id === selectedAlbum?.id ? { ...a, photo_count: (a.photo_count || 0) - 1 } : a))

            if (selectedAlbum) {
                queryClient.invalidateQueries({ queryKey: ['album-detail', String(selectedAlbum.id)] });
                queryClient.invalidateQueries({ queryKey: ['albums'] });
            }
            await showAlert('成功', '照片已删除！', 'success')
        } catch (error) {
            await showAlert('错误', '删除失败', 'error')
        }
    }

    const setAsCover = async (photoUrl: string) => {
        if (!selectedAlbum) return
        try {
            const { error } = await apiService.put(`/albums/${selectedAlbum.id}`, { cover_url: photoUrl })
            if (error) throw new Error(error)
            setAlbums(prev => prev.map(a => a.id === selectedAlbum.id ? { ...a, cover_url: photoUrl } : a))
            setSelectedAlbum(prev => prev ? { ...prev, cover_url: photoUrl } : null)
            await showAlert('成功', '封面图已更新！', 'success')
        } catch (error) {
            await showAlert('错误', '设置封面失败', 'error')
        }
    }

    const handleDeleteAlbum = async (album: Album) => {
        const confirmed = await showConfirm('删除相册', `确定要删除 "${album.name}" 及其所有照片吗？此操作不可撤销。`)
        if (!confirmed) return

        try {
            const { error } = await apiService.delete(`/albums/${album.id}`)
            if (error) throw new Error(error)
            await showAlert('成功', '相册已从地球上消失', 'success')
            if (selectedAlbum?.id === album.id) {
                setSelectedAlbum(null)
                setPhotos([])
            }
            loadAlbums()
        } catch (error) {
            await showAlert('错误', '删除失败', 'error')
        }
    }

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>

    return (
        <div className="animate-fade-in text-slate-700">
            {/* 粘性玻璃头部 */}
            <header className="premium-glass -mx-4 px-4 py-6 mb-8 flex items-center justify-between backdrop-blur-xl">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">相册管理<span className="text-primary tracking-tighter ml-1">GALLERY</span></h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organize your precious moments</p>
                </div>
                <button
                    onClick={() => { setEditingAlbum(null); setAlbumName(''); setAlbumDesc(''); setShowAlbumForm(true); }}
                    className="px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-bold shadow-xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
                >
                    <Icon name="add" size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                    新建相册
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 左侧：相册列表 */}
                <div className="lg:col-span-4 space-y-4">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">我们的相册 ({albums.length})</h2>
                    {albums.map((album) => (
                        <div
                            key={album.id}
                            onClick={() => handleAlbumClick(album)}
                            className={`premium-card !p-4 group cursor-pointer border-2 transition-all duration-500 ${selectedAlbum?.id === album.id ? 'border-primary ring-4 ring-primary/10 shadow-xl' : 'border-transparent hover:border-slate-100'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                    {album.cover_url ? (
                                        <img src={getThumbnailUrl(album.cover_url, 200)} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <Icon name="photo_library" size={24} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-slate-800 truncate tracking-tight">{album.name}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{album.photo_count || 0} 张照片</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditingAlbum(album); setAlbumName(album.name); setAlbumDesc(album.description); setShowAlbumForm(true); }}
                                        className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-primary hover:text-white transition-all flex items-center justify-center"
                                    >
                                        <Icon name="edit" size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteAlbum(album); }}
                                        className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                    >
                                        <Icon name="delete" size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 右侧：照片预览和上传 */}
                <div className="lg:col-span-8">
                    {selectedAlbum ? (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">{selectedAlbum.name}</h2>
                                    <p className="text-slate-400 font-medium text-sm mt-1">{selectedAlbum.description || '暂无描述'}</p>
                                </div>
                                <label className="px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 cursor-pointer transition-all flex items-center gap-2">
                                    <Icon name="upload" size={20} />
                                    批量上传
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={handlePhotoUpload}
                                    />
                                </label>
                            </div>

                            {/* 上传队列预览 */}
                            {uploadingFiles.length > 0 && (
                                <div className="premium-card !p-6 border-2 border-primary/20 bg-primary/[0.02]">
                                    <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                        正在飞速上传中 ({uploadingFiles.length})
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {uploadingFiles.map(upload => (
                                            <div key={upload.id} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm">
                                                <img src={upload.preview} alt="" className="w-full h-full object-cover blur-[2px] opacity-60" />
                                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                                                    <div className="w-12 h-12 relative flex items-center justify-center mb-2">
                                                        <svg className="w-full h-full -rotate-90">
                                                            <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="4" />
                                                            <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-primary transition-all duration-300" strokeDasharray={`${upload.progress * 1.25} 125`} />
                                                        </svg>
                                                        <span className="absolute text-[10px] font-black text-slate-900">{upload.progress}%</span>
                                                    </div>
                                                    <span className="text-[8px] font-black text-slate-900 bg-white/80 px-2 py-0.5 rounded-full">{upload.speed} KB/s</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 照片网格 */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                {photos.length === 0 && uploadingFiles.length === 0 ? (
                                    <div className="col-span-full py-24 text-center glass-card border-dashed border-2 rounded-[3rem]">
                                        <Icon name="add_a_photo" size={48} className="mx-auto mb-4 text-slate-200" />
                                        <p className="text-slate-400 font-bold">还没有照片，开始记录吧</p>
                                    </div>
                                ) : (
                                    <AnimatePresence mode="popLayout">
                                        {photos.map((photo) => (
                                            <motion.div
                                                key={photo.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                transition={{
                                                    layout: { type: "spring", stiffness: 300, damping: 30 },
                                                    opacity: { duration: 0.2 }
                                                }}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, photo)}
                                                onDragOver={handleDragOver}
                                                onDragEnter={() => handleDragEnter(photo)}
                                                onDragEnd={handleDragEnd}
                                                className={`premium-card !p-0 aspect-square group overflow-hidden border-4 border-white shadow-sm hover:shadow-2xl transition-all duration-300 cursor-move relative ${draggedPhoto?.id === photo.id ? 'opacity-20 z-0 scale-95' : 'z-10'}`}
                                            >
                                                <div className="absolute top-2 left-2 z-30 opacity-0 group-hover:opacity-60 transition-opacity bg-black/20 p-1 rounded-full backdrop-blur-sm pointer-events-none">
                                                    <Icon name="drag_indicator" size={16} className="text-white" />
                                                </div>
                                                <img
                                                    src={getThumbnailUrl(photo.url, 400)}
                                                    loading="lazy"
                                                    alt=""
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                                />

                                                {/* 图片说明/标题编辑区 - 始终显示 */}
                                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 z-10">
                                                    {editingCaption?.id === photo.id ? (
                                                        <input
                                                            type="text"
                                                            value={editingCaption.text}
                                                            onChange={(e) => setEditingCaption({ ...editingCaption, text: e.target.value })}
                                                            onBlur={saveCaption}
                                                            onKeyDown={handleCaptionKeyDown}
                                                            autoFocus
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="w-full bg-white/20 text-white text-xs px-2 py-1 rounded backdrop-blur-md border border-white/30 focus:outline-none focus:bg-white/30"
                                                        />
                                                    ) : (
                                                        <p
                                                            onClick={(e) => { e.stopPropagation(); startEditingCaption(photo); }}
                                                            className="text-white text-xs font-medium truncate cursor-text hover:underline text-center"
                                                            title="点击编辑标题"
                                                        >
                                                            {photo.caption || '描述这一刻...'}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* 操作按钮 - 仅在悬浮显示 */}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 z-20">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setAsCover(photo.url); }}
                                                        className="w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-white/30"
                                                        title="设为封面"
                                                    >
                                                        <Icon name="photo_camera" size={20} className="text-white" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
                                                        className="w-10 h-10 bg-rose-500/20 hover:bg-rose-500/40 rounded-full flex items-center justify-center backdrop-blur-md transition-all border border-rose-500/30"
                                                        title="删除"
                                                    >
                                                        <Icon name="delete" size={20} className="text-rose-100" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center glass-card rounded-[2rem] text-center p-12 min-h-[300px]">
                            <div className="w-24 h-24 rounded-[2rem] bg-slate-50 flex items-center justify-center mb-8 text-slate-200 animate-float">
                                <Icon name="photo_library" size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">选择一个相册开始管理</h3>
                            <p className="text-slate-400 font-medium max-w-xs leading-relaxed">每一个相册都是一段珍贵的回忆，选择左侧的列表来查看或上传新的照片。</p>
                        </div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={showAlbumForm}
                onClose={() => setShowAlbumForm(false)}
                title={editingAlbum ? '编辑相册信息' : '创建新相册'}
            >
                <form onSubmit={handleCreateAlbum} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">相册名称</label>
                        <input
                            type="text"
                            placeholder="给回忆起个名字..."
                            value={albumName}
                            onChange={(e) => setAlbumName(e.target.value)}
                            className="premium-input w-full"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">相册描述</label>
                        <textarea
                            placeholder="写下关于这个相册的故事..."
                            value={albumDesc}
                            onChange={(e) => setAlbumDesc(e.target.value)}
                            className="premium-input min-h-[120px] resize-none w-full"
                        />
                    </div>
                    <div className="flex gap-4 pt-4 sticky bottom-0 bg-white py-4 border-t border-slate-50">
                        <button
                            type="submit"
                            className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            {editingAlbum ? '保存修改' : '立即创建'}
                        </button>
                    </div>
                </form>
            </Modal>

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

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getThumbnailUrl } from '../utils/imageUtils'
import { apiService } from '../services/apiService'
import type { Photo } from '../types'
import Icon from '../components/icons/Icons'
import ImageModal from '../components/ImageModal'
import LazyImage from '../components/LazyImage'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { Skeleton } from '../components/Skeleton'

interface AlbumDetailResponse {
    id: number
    name: string
    description?: string
    cover_url?: string
    photos: Photo[]
}

export default function AlbumDetail() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    // 看图模式状态
    const [imageModalOpen, setImageModalOpen] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    // 锁定 body 滚动
    useBodyScrollLock(imageModalOpen)

    // 加载相册详情
    const { data: albumDetail, isLoading } = useQuery({
        queryKey: ['album-detail', id],
        queryFn: async () => {
            if (!id) return null
            const { data, error } = await apiService.get<AlbumDetailResponse>(`/albums/${id}`)
            if (error) throw new Error(error)
            return data
        },
        enabled: !!id,
        staleTime: Infinity,
    })

    const albumPhotos = albumDetail?.photos || []

    // 点击单张照片 - 进入看图模式
    const handlePhotoClick = (index: number) => {
        setCurrentImageIndex(index)
        setImageModalOpen(true)
    }

    // 返回相册列表
    const handleBack = () => {
        navigate('/albums')
    }

    if (isLoading) {
        return (
            <div className="min-h-screen pt-40 max-w-6xl mx-auto px-6">
                <div className="text-center mb-16">
                    <Skeleton className="h-12 w-64 mx-auto mb-4" />
                    <Skeleton className="h-4 w-48 mx-auto" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <Skeleton key={i} className="aspect-square rounded-[2rem]" />
                    ))}
                </div>
            </div>
        )
    }

    if (!albumDetail) {
        return (
            <div className="min-h-screen pt-40 flex items-center justify-center">
                <div className="text-center text-slate-400">
                    <Icon name="photo_library" size={80} className="mx-auto mb-6 opacity-20" />
                    <p className="text-xl font-black text-slate-800 mb-2">相册不存在</p>
                    <button
                        onClick={handleBack}
                        className="mt-6 px-6 py-3 bg-primary text-white rounded-2xl font-medium hover:bg-primary/90 transition-all"
                    >
                        返回相册列表
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen text-slate-700 transition-colors duration-300">
            <main className="max-w-6xl mx-auto px-6 pb-32 pt-40 relative">
                {/* 页面头部 */}
                <header className="text-center mb-16 animate-fade-in">
                    {/* 返回按钮 */}
                    <button
                        onClick={handleBack}
                        className="absolute left-6 top-32 w-12 h-12 rounded-2xl glass-card flex items-center justify-center text-slate-600 hover:text-primary hover:scale-110 active:scale-95 transition-all shadow-lg"
                    >
                        <Icon name="west" size={24} />
                    </button>

                    {/* 相册封面 */}
                    {albumDetail.cover_url && (
                        <div className="w-32 h-32 mx-auto mb-8 rounded-[2rem] overflow-hidden shadow-2xl ring-4 ring-white animate-scale-in">
                            <img
                                src={getThumbnailUrl(albumDetail.cover_url, 400)}
                                alt={albumDetail.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <h1 className="text-4xl md:text-5xl font-black text-gradient tracking-tight mb-4">{albumDetail.name}</h1>

                    {albumDetail.description && (
                        <p className="text-slate-400 font-medium text-sm italic max-w-lg mx-auto leading-relaxed">
                            "{albumDetail.description}"
                        </p>
                    )}

                    <div className="flex items-center justify-center gap-2 mt-6">
                        <span className="premium-badge text-xs">
                            <Icon name="photo_library" size={14} className="mr-1" />
                            {albumPhotos.length} Photos
                        </span>
                    </div>
                </header>

                {/* 照片网格 */}
                {albumPhotos.length === 0 ? (
                    <div className="text-center py-24 text-slate-400">
                        <Icon name="photo_library" size={80} className="mx-auto mb-6 opacity-20 animate-float" />
                        <p className="text-xl font-black text-slate-800 mb-2">相册空空如也</p>
                        <p className="text-sm font-medium">去后台写下我们的故事吧~</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {albumPhotos.map((photo, idx) => (
                            <div
                                key={photo.id || idx}
                                className="aspect-square premium-card !p-0 overflow-hidden cursor-pointer group relative animate-slide-up"
                                style={{ animationDelay: `${idx * 0.05}s` }}
                                onClick={() => handlePhotoClick(idx)}
                            >
                                <LazyImage
                                    src={getThumbnailUrl(photo.url, 600)}
                                    alt={photo.caption || `照片${idx + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                                />

                                {/* 悬浮遮罩 */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-500 flex items-center justify-center">
                                        <Icon name="search" size={24} className="text-white" />
                                    </div>
                                </div>

                                {/* 照片标题 */}
                                {photo.caption && (
                                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                                        <p className="text-white text-[10px] font-black uppercase tracking-widest line-clamp-1">{photo.caption}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* 图片查看器 */}
            <ImageModal
                isOpen={imageModalOpen}
                onClose={() => setImageModalOpen(false)}
                images={albumPhotos.map(p => p.url)}
                currentIndex={currentImageIndex}
                onPrevious={() => setCurrentImageIndex(prev => (prev - 1 + albumPhotos.length) % albumPhotos.length)}
                onNext={() => setCurrentImageIndex(prev => (prev + 1) % albumPhotos.length)}
                onJumpTo={setCurrentImageIndex}
            />
        </div>
    )
}

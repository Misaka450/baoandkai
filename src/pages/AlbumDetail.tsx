import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getThumbnailUrl } from '../utils/imageUtils'
import { apiService } from '../services/apiService'
import type { Photo } from '../types'
import Icon from '../components/icons/Icons'
import ImageModal from '../components/ImageModal'
import LazyImage from '../components/LazyImage'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

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
            <div className="min-h-screen bg-slate-900 flex flex-col">
                {/* 加载状态骨架屏 */}
                <header className="px-6 py-6 flex items-center justify-between">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl animate-pulse"></div>
                    <div className="flex-1 text-center px-4">
                        <div className="h-6 w-32 bg-white/10 rounded-lg mx-auto animate-pulse"></div>
                    </div>
                    <div className="w-12"></div>
                </header>
                <div className="flex-1 p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="aspect-square bg-white/5 rounded-[1.5rem] animate-pulse"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (!albumDetail) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-center text-white/60">
                    <Icon name="photo_library" size={80} className="mx-auto mb-6 opacity-20" />
                    <p className="text-xl font-black mb-2">相册不存在</p>
                    <button
                        onClick={handleBack}
                        className="mt-6 px-6 py-3 bg-white/10 rounded-2xl text-white font-medium hover:bg-white/20 transition-all"
                    >
                        返回相册列表
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col">
            {/* 沉浸式背景 - 毛玻璃模糊效果 */}
            <div className="fixed inset-0 z-0">
                {albumDetail.cover_url && (
                    <img
                        src={getThumbnailUrl(albumDetail.cover_url, 800)}
                        alt="background"
                        className="w-full h-full object-cover blur-3xl opacity-20 scale-110"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/80 to-slate-950"></div>
            </div>

            {/* 顶部导航栏 */}
            <header className="relative z-20 px-6 py-6 flex items-center justify-between">
                <button
                    onClick={handleBack}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all border border-white/10 active:scale-90"
                >
                    <Icon name="west" size={24} />
                </button>
                <div className="flex-1 text-center px-4">
                    <h2 className="text-xl font-black text-white truncate tracking-tight">{albumDetail.name}</h2>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-0.5">
                        {albumPhotos.length} Memories
                    </p>
                </div>
                <div className="w-12"></div> {/* 占位平衡 */}
            </header>

            {/* 内容滚动区 */}
            <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar pb-32">
                {/* 相册头信息 */}
                <div className="px-8 pt-4 pb-12 text-center max-w-2xl mx-auto">
                    {albumDetail.description && (
                        <div className="animate-slide-up">
                            <p className="text-white/60 font-medium italic leading-relaxed text-sm">
                                "{albumDetail.description}"
                            </p>
                        </div>
                    )}
                </div>

                {/* 照片网格 */}
                <div className="px-4 md:px-8 max-w-6xl mx-auto">
                    {albumPhotos.length === 0 ? (
                        <div className="text-center py-24 text-white/20">
                            <Icon name="photo_library" size={80} className="mx-auto mb-6 opacity-20" />
                            <p className="text-xl font-black mb-2">相册空空如也</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {albumPhotos.map((photo, idx) => (
                                <div
                                    key={photo.id || idx}
                                    className="aspect-square rounded-[2rem] overflow-hidden cursor-pointer group/photo relative shadow-2xl animate-scale-in"
                                    style={{ animationDelay: `${idx * 0.05}s` }}
                                    onClick={() => handlePhotoClick(idx)}
                                >
                                    <LazyImage
                                        src={getThumbnailUrl(photo.url, 600)}
                                        alt={photo.caption || `照片${idx + 1}`}
                                        className="w-full h-full object-cover group-hover/photo:scale-110 transition-transform duration-1000"
                                    />
                                    {photo.caption && (
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/photo:opacity-100 transition-opacity flex flex-col justify-end p-6">
                                            <p className="text-white text-[10px] font-black uppercase tracking-widest translate-y-2 group-hover/photo:translate-y-0 transition-transform">
                                                {photo.caption}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

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

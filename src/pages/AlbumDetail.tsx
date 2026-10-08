import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getThumbnailUrl } from '../utils/imageUtils'
import { apiService } from '../services/apiService'
import type { Photo } from '../types'
import Icon from '../components/icons/Icons'
import LazyImage from '../components/common/LazyImage'
import { Skeleton } from '../components/common/Skeleton'
import { hapticFeedback } from '../utils/haptics'

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
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
    })

    const albumPhotos = albumDetail?.photos || []

    const [showBackToTop, setShowBackToTop] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 400)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // 点击单张照片 - 导航到独立的图片查看页面
    const handlePhotoClick = (index: number) => {
        hapticFeedback('light')
        navigate(`/albums/${id}/photo?index=${index}`)
    }

    // 返回相册列表
    const handleBack = () => {
        hapticFeedback('light')
        navigate('/albums')
    }

    if (isLoading) {
        return (
            <div className="min-h-screen pt-20 md:pt-40 max-w-6xl mx-auto px-3 md:px-6">
                <div className="text-center mb-8 md:mb-16">
                    <Skeleton className="h-8 md:h-12 w-48 md:w-64 mx-auto mb-2 md:mb-4" />
                    <Skeleton className="h-3 md:h-4 w-32 md:w-48 mx-auto" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-6">
                    {[...Array(8)].map((_, i) => (
                        <Skeleton key={i} className="aspect-square rounded-xl md:rounded-[2rem]" />
                    ))}
                </div>
            </div>
        )
    }

    if (!albumDetail) {
        return (
            <div className="min-h-screen pt-20 md:pt-40 flex items-center justify-center px-4">
                <div className="text-center text-slate-400">
                    <Icon name="photo_library" size={60} className="mx-auto mb-4 opacity-20 md:w-20 md:h-20" />
                    <p className="text-lg md:text-xl font-black text-slate-800 mb-2">相册不存在</p>
                    <button
                        onClick={handleBack}
                        className="mt-4 px-5 py-2.5 bg-primary text-white rounded-xl md:rounded-2xl text-sm font-medium hover:bg-primary/90 transition-all active:scale-95"
                    >
                        返回相册列表
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen text-slate-700 transition-colors duration-300">
            <main className="max-w-6xl mx-auto px-3 md:px-6 pb-20 md:pb-32 pt-20 md:pt-40 relative">
                {/* 页面头部 */}
                <header className="text-center mb-8 md:mb-16 animate-fade-in relative">
                    {/* 返回按钮 */}
                    <button
                        onClick={handleBack}
                        aria-label="返回相册列表"
                        className="absolute left-0 sm:left-1 top-0 w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl glass-card flex items-center justify-center text-slate-600 hover:text-primary hover:scale-110 active:scale-95 transition-all shadow-md focus-visible:outline-2 focus-visible:outline-primary z-10"
                    >
                        <Icon name="west" size={18} className="md:w-6 md:h-6" />
                    </button>

                    {/* 相册封面 */}
                    {albumDetail.cover_url && (
                        <div className="w-20 h-20 md:w-32 md:h-32 mx-auto mb-4 md:mb-8 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-lg md:shadow-2xl ring-2 md:ring-4 ring-white animate-scale-in">
                            <img
                                src={getThumbnailUrl(albumDetail.cover_url, 400)}
                                alt={albumDetail.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-gradient tracking-tight mb-2 md:mb-4 px-10 md:px-0">{albumDetail.name}</h1>

                    {albumDetail.description && (
                        <p className="text-slate-400 font-medium text-xs md:text-sm italic max-w-lg mx-auto leading-relaxed px-4">
                            "{albumDetail.description}"
                        </p>
                    )}

                    <div className="flex items-center justify-center gap-2 mt-4 md:mt-6">
                        <span className="premium-badge text-[11px] md:text-xs py-1 px-3">
                            <Icon name="photo_library" size={12} className="mr-1 md:w-3.5 md:h-3.5" />
                            {albumPhotos.length} Photos
                        </span>
                    </div>
                </header>

                {/* 照片网格 */}
                {albumPhotos.length === 0 ? (
                    <div className="text-center py-16 md:py-24 text-slate-400">
                        <Icon name="photo_library" size={60} className="mx-auto mb-4 opacity-20 animate-float md:w-20 md:h-20" />
                        <p className="text-lg md:text-xl font-black text-slate-800 mb-1 md:mb-2">相册空空如也</p>
                        <p className="text-xs md:text-sm font-medium">去后台写下我们的故事吧~</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-6">
                        {albumPhotos.map((photo, idx) => (
                            <div
                                key={photo.id || idx}
                                className="aspect-square premium-card !p-0 overflow-hidden cursor-pointer group relative content-auto animate-slide-up rounded-xl md:rounded-2xl active:scale-[0.96] transition-transform duration-150"
                                style={{ animationDelay: `${Math.min(idx * 0.03, 0.3)}s` }}
                                onClick={() => handlePhotoClick(idx)}
                            >
                                <LazyImage
                                    src={getThumbnailUrl(photo.url, 600)}
                                    alt={photo.caption || `照片${idx + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105 md:group-hover:scale-110 transition-transform duration-700"
                                />

                                {/* 悬浮遮罩 */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-md opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300 flex items-center justify-center">
                                        <Icon name="search" size={16} className="text-white md:w-6 md:h-6" />
                                    </div>
                                </div>

                                {/* 照片标题 */}
                                {photo.caption && (
                                    <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 bg-gradient-to-t from-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                        <p className="text-white text-[9px] md:text-[10px] font-black uppercase tracking-wider md:tracking-widest line-clamp-1">{photo.caption}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* 返回顶部浮动按钮 */}
            {showBackToTop && (
                <button
                    type="button"
                    onClick={() => {
                        hapticFeedback('light')
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    aria-label="返回顶部"
                    className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-4 md:left-8 z-40 w-11 h-11 rounded-full bg-white/90 backdrop-blur-md border border-stone-200/80 shadow-lg flex items-center justify-center text-stone-600 hover:text-primary hover:scale-110 active:scale-95 transition-all"
                >
                    <Icon name="chevron_up" size={20} />
                </button>
            )}
        </div>
    )
}

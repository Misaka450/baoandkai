import React from 'react'

interface SkeletonProps {
    className?: string
    style?: React.CSSProperties
}

/**
 * 基础骨架屏组件 - 渐变流光动画
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', style }) => (
    <div
        className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] rounded-lg ${className}`}
        style={{ animation: 'shimmer 1.5s ease-in-out infinite', ...style }}
    />
)

/**
 * 卡片骨架屏
 */
export const CardSkeleton: React.FC = () => (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
        <div className="flex items-start gap-4">
            <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-3/4 rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-2/3 rounded" />
            </div>
        </div>
    </div>
)

/**
 * 列表骨架屏
 */
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
    <div className="space-y-4">
        {Array.from({ length: count }).map((_, index) => (
            <CardSkeleton key={index} />
        ))}
    </div>
)

/**
 * 图片网格骨架屏
 */
export const ImageGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, index) => (
            <Skeleton key={index} className="aspect-square rounded-xl" />
        ))}
    </div>
)

/**
 * 时间轴骨架屏
 */
export const TimelineSkeleton: React.FC = () => (
    <div className="space-y-8">
        {[1, 2, 3].map((_, index) => (
            <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                    <Skeleton className="w-4 h-4 rounded-full" />
                    <Skeleton className="w-0.5 h-20" />
                </div>
                <div className="flex-1">
                    <Skeleton className="h-6 w-24 mb-2 rounded" />
                    <Skeleton className="h-4 w-full mb-2 rounded" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                </div>
            </div>
        ))}
    </div>
)

/**
 * 页面加载骨架屏
 */
export const PageSkeleton: React.FC<{ title?: string }> = ({ title }) => (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <Skeleton className="w-16 h-16 rounded-2xl mx-auto mb-4" />
                {title ? (
                    <h1 className="text-4xl font-light text-stone-800 mb-4">{title}</h1>
                ) : (
                    <Skeleton className="h-10 w-48 mx-auto mb-4 rounded" />
                )}
                <Skeleton className="h-4 w-64 mx-auto rounded" />
            </div>
            <ListSkeleton count={3} />
        </div>
    </div>
)

/**
 * 统计卡片骨架屏
 */
export const StatCardSkeleton: React.FC = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white shadow-xl">
        <div className="flex items-center justify-between mb-6">
            <Skeleton className="w-12 h-12 rounded-2xl" />
            <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-20 mb-3 rounded" />
        <Skeleton className="h-10 w-32 mb-2 rounded" />
        <Skeleton className="h-3 w-16 rounded" />
    </div>
)

/**
 * 美食卡片骨架屏
 */
export const FoodCardSkeleton: React.FC = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white shadow-xl">
        <div className="flex gap-4 mb-4">
            <Skeleton className="w-24 h-24 rounded-2xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-3/4 rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
            </div>
        </div>
        <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="w-5 h-5 rounded-full" />
            ))}
        </div>
    </div>
)

/**
 * 相册卡片骨架屏
 */
export const AlbumCardSkeleton: React.FC = () => (
    <div className="group">
        <div className="relative aspect-[4/3] mb-4">
            <Skeleton className="absolute inset-0 rounded-[2.5rem]" />
            <Skeleton className="absolute inset-0 rounded-[2.5rem] rotate-2 translate-x-2 opacity-40" />
            <Skeleton className="absolute inset-0 rounded-[2.5rem] -rotate-2 -translate-x-2 opacity-60" />
        </div>
        <Skeleton className="h-8 w-3/4 mb-2 rounded" />
        <Skeleton className="h-4 w-full rounded" />
    </div>
)

/**
 * 时光胶囊骨架屏
 */
export const TimeCapsuleSkeleton: React.FC = () => (
    <div className="relative">
        <Skeleton className="w-48 h-48 rounded-full mx-auto" />
        <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="w-16 h-16 rounded-full" />
        </div>
        <Skeleton className="h-6 w-32 mx-auto mt-6 rounded" />
        <Skeleton className="h-4 w-48 mx-auto mt-2 rounded" />
    </div>
)

/**
 * 地图标记骨架屏
 */
export const MapMarkerSkeleton: React.FC = () => (
    <div className="relative">
        <Skeleton className="w-10 h-10 rounded-full shadow-lg" />
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-slate-300" />
    </div>
)

/**
 * 便签卡片骨架屏
 */
export const TodoCardSkeleton: React.FC = () => (
    <div className="bg-[#FFF9F0] border border-[#F0E6D2] rounded-2xl p-6 shadow-lg">
        <Skeleton className="w-6 h-6 rounded-full mb-4" />
        <Skeleton className="h-5 w-full mb-2 rounded" />
        <Skeleton className="h-4 w-2/3 rounded" />
        <div className="mt-4 pt-4 border-t border-[#F0E6D2]">
            <Skeleton className="h-3 w-24 rounded" />
        </div>
    </div>
)

/**
 * 照片墙骨架屏
 */
export const PhotoWallSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, index) => (
            <Skeleton
                key={index}
                className="aspect-square rounded-2xl"
                style={{
                    height: `${Math.random() * 100 + 150}px`,
                    animationDelay: `${index * 0.1}s`
                }}
            />
        ))}
    </div>
)

/**
 * 省份打卡骨架屏
 */
export const ProvinceCardSkeleton: React.FC = () => (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-white shadow-xl">
        <div className="flex items-center gap-4 mb-4">
            <Skeleton className="w-16 h-16 rounded-2xl" />
            <div className="flex-1">
                <Skeleton className="h-6 w-24 mb-2 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
            </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
        </div>
    </div>
)

/**
 * 引导页骨架屏
 */
export const EmptyStateSkeleton: React.FC = () => (
    <div className="flex flex-col items-center justify-center py-20">
        <Skeleton className="w-24 h-24 rounded-full mb-6" />
        <Skeleton className="h-8 w-48 mb-3 rounded" />
        <Skeleton className="h-4 w-64 mb-2 rounded" />
        <Skeleton className="h-4 w-48 rounded" />
    </div>
)

export default Skeleton

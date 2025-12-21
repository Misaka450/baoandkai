import React from 'react'

interface SkeletonProps {
    className?: string
}

/**
 * 基础骨架屏组件
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
    <div
        className={`animate-pulse bg-gradient-to-r from-stone-200 via-stone-100 to-stone-200 bg-[length:200%_100%] rounded ${className}`}
        style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}
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

export default Skeleton

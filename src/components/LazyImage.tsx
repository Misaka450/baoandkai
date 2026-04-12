import { useState, useEffect, useRef, useMemo } from 'react'
import { loadedImagesCache, getOptimizedImageUrl } from '../utils/imageUtils'

interface LazyImageProps {
    src: string
    alt: string
    className?: string
    onClick?: (e: React.MouseEvent) => void
    /** 图片宽高比，如 "16/9", "4/3", "1/1"，用于预留空间避免 CLS */
    aspectRatio?: string
    /** 是否为首屏关键图片 (LCP)，设为 true 会提高加载优先级 */
    priority?: boolean
    /** 图片宽度，用于 Cloudflare Image Resizing 优化 */
    width?: number
    /** 是否跳过优化（用于下载等场景） */
    noOptimize?: boolean
}

/**
 * 懒加载图片组件
 * 专门针对大图优化，提供加载占位符和淡入效果
 * 性能优化：
 * - aspectRatio 预留空间避免 CLS
 * - priority 标记 LCP 图片提高加载优先级
 * - decoding="async" 异步解码不阻塞渲染
 * - Cloudflare Image Resizing 自动转 WebP/AVIF
 */
export default function LazyImage({
    src,
    alt,
    className = '',
    onClick,
    aspectRatio,
    priority = false,
    width,
    noOptimize = false
}: LazyImageProps) {
    // 对 R2 图片使用 Cloudflare 转换
    const optimizedSrc = useMemo(() => {
        if (noOptimize || !src) return src;
        return getOptimizedImageUrl(src, { width, quality: 80, format: 'auto' });
    }, [src, width, noOptimize]);

    const [isLoaded, setIsLoaded] = useState(() => loadedImagesCache.has(optimizedSrc))
    const [error, setError] = useState(false)
    const lastSrc = useRef(optimizedSrc)

    // 如果 src 改变，且不在缓存中，才重置状态
    useEffect(() => {
        if (lastSrc.current !== optimizedSrc) {
            lastSrc.current = optimizedSrc
            if (!loadedImagesCache.has(optimizedSrc)) {
                setIsLoaded(false)
                setError(false)
            } else {
                setIsLoaded(true)
            }
        }
    }, [optimizedSrc])

    const handleLoad = () => {
        loadedImagesCache.add(optimizedSrc)
        setIsLoaded(true)
    }

    return (
        <div
            className={`relative overflow-hidden ${className}`}
            style={aspectRatio ? { aspectRatio } : undefined}
        >
            {/* 加载占位符：磨砂玻璃效果 */}
            {!isLoaded && !error && (
                <div className="absolute inset-0 bg-slate-100 flex items-center justify-center animate-pulse">
                    <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin"></div>
                </div>
            )}

            {/* 错误占位符 */}
            {error && (
                <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center text-slate-300">
                    <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-[10px] uppercase font-black">Load Failed</span>
                </div>
            )}

            <img
                src={optimizedSrc}
                alt={alt}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={priority ? 'high' : 'auto'}
                onLoad={handleLoad}
                onError={() => setError(true)}
                onClick={onClick}
                className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
        </div>
    )
}

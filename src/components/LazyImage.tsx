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
    /** 图片宽度，用于后端 Sharp 缩略图优化 */
    width?: number
    /** 是否跳过优化（用于下载等场景） */
    noOptimize?: boolean
    /** 图片尺寸提示，用于srcset响应式加载 */
    sizes?: string
}

/**
 * 生成响应式图片 srcset (利用服务端 Sharp 动态裁剪接口)
 */
function generateSrcSet(src: string): string | undefined {
    if (!src || !src.includes('/api/images/')) return undefined

    try {
        const [base] = src.split('?')
        return [
            `${base}?w=400&q=75&f=webp 400w`,
            `${base}?w=800&q=80&f=webp 800w`,
            `${base}?w=1200&q=85&f=webp 1200w`,
        ].join(', ')
    } catch {
        return undefined
    }
}

/**
 * 懒加载图片组件
 * 性能优化：
 * - aspectRatio 预留空间避免 CLS
 * - priority 标记 LCP 图片提高加载优先级
 * - decoding="async" 异步解码不阻塞渲染
 * - 服务端 Sharp 自动生成 WebP 缩略图
 * - srcset 响应式图片，按设备宽度加载合适尺寸
 */
export default function LazyImage({
    src,
    alt,
    className = '',
    onClick,
    aspectRatio,
    priority = false,
    width,
    noOptimize = false,
    sizes
}: LazyImageProps) {
    const optimizedSrc = useMemo(() => {
        if (noOptimize || !src) return src;
        return getOptimizedImageUrl(src, { width, quality: 80, format: 'webp' });
    }, [src, width, noOptimize]);

    // 超轻量极小占位图 url (width=50, quality=30, format='webp')
    const lqipSrc = useMemo(() => {
        if (noOptimize || !src) return '';
        return getOptimizedImageUrl(src, { width: 50, quality: 30, format: 'webp' });
    }, [src, noOptimize]);

    const srcSet = useMemo(() => {
        if (noOptimize || !optimizedSrc) return undefined
        return generateSrcSet(optimizedSrc)
    }, [optimizedSrc, noOptimize])

    const [isLoaded, setIsLoaded] = useState(() => loadedImagesCache.has(optimizedSrc))
    const [error, setError] = useState(false)
    const lastSrc = useRef(optimizedSrc)

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
            className={`relative overflow-hidden bg-slate-100 ${className}`}
            style={aspectRatio ? { aspectRatio } : undefined}
        >
            {/* 渐进式毛玻璃底层：放大的超微缩略图 LQIP */}
            {!error && lqipSrc && (
                <img
                    src={lqipSrc}
                    alt=""
                    aria-hidden="true"
                    className={`absolute inset-0 w-full h-full object-cover filter blur-[16px] scale-[1.08] transition-opacity duration-500 pointer-events-none ${
                        isLoaded ? 'opacity-0' : 'opacity-100'
                    }`}
                />
            )}

            {/* 错误占位符 */}
            {error && (
                <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center text-slate-300 z-10">
                    <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-[10px] uppercase font-black">Load Failed</span>
                </div>
            )}

            {/* 高清原图层：加载就绪后 400ms 平滑淡入 */}
            <img
                src={optimizedSrc}
                alt={alt}
                srcSet={srcSet}
                sizes={sizes || (srcSet ? '(max-width: 768px) 100vw, 50vw' : undefined)}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={priority ? 'high' : 'auto'}
                onLoad={handleLoad}
                onError={() => setError(true)}
                onClick={onClick}
                className={`relative z-[1] w-full h-full object-cover transition-opacity duration-400 ease-out ${
                    isLoaded ? 'opacity-100' : 'opacity-0'
                }`}
            />
        </div>
    )
}

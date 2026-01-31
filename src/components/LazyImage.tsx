import { useState, useEffect, useRef } from 'react'
import { loadedImagesCache } from '../utils/imageUtils'

interface LazyImageProps {
    src: string
    alt: string
    className?: string
    onClick?: (e: React.MouseEvent) => void
}

/**
 * 懒加载图片组件
 * 专门针对大图优化，提供加载占位符和淡入效果
 */
export default function LazyImage({ src, alt, className = '', onClick }: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(() => loadedImagesCache.has(src))
    const [error, setError] = useState(false)
    const lastSrc = useRef(src)

    // 如果 src 改变，且不在缓存中，才重置状态
    useEffect(() => {
        if (lastSrc.current !== src) {
            lastSrc.current = src
            if (!loadedImagesCache.has(src)) {
                setIsLoaded(false)
                setError(false)
            } else {
                setIsLoaded(true)
            }
        }
    }, [src])

    const handleLoad = () => {
        loadedImagesCache.add(src)
        setIsLoaded(true)
    }

    return (
        <div className={`relative overflow-hidden ${className}`}>
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
                src={src}
                alt={alt}
                loading="lazy"
                onLoad={handleLoad}
                onError={() => setError(true)}
                onClick={onClick}
                className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
        </div>
    )
}

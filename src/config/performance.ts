/**
 * 性能优化配置
 */

export interface ImageConfig {
    MAX_SIZE: number
    SUPPORTED_FORMATS: string[]
    COMPRESSION_QUALITY: number
    THUMBNAIL_SIZE: number
}

export interface CacheConfig {
    API_CACHE_DURATION: number
    STATIC_CACHE_DURATION: number
    MAX_CACHE_SIZE: number
}

export interface RetryConfig {
    MAX_RETRIES: number
    RETRY_DELAY: number
    BACKOFF_MULTIPLIER: number
}

export interface PerformanceConfig {
    DEBOUNCE_DELAY: number
    DEFAULT_PAGE_SIZE: number
    MAX_PAGE_SIZE: number
    IMAGE: ImageConfig
    CACHE: CacheConfig
    RETRY: RetryConfig
}

export const PERFORMANCE_CONFIG: PerformanceConfig = {
    // 防抖延迟时间（毫秒）
    DEBOUNCE_DELAY: 300,

    // 分页大小
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 50,

    // 图片配置
    IMAGE: {
        MAX_SIZE: 5 * 1024 * 1024, // 5MB
        SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        COMPRESSION_QUALITY: 0.8,
        THUMBNAIL_SIZE: 200
    },

    // 缓存配置
    CACHE: {
        API_CACHE_DURATION: 5 * 60 * 1000, // 5分钟
        STATIC_CACHE_DURATION: 24 * 60 * 60 * 1000, // 24小时
        MAX_CACHE_SIZE: 50 * 1024 * 1024 // 50MB
    },

    // 重试配置
    RETRY: {
        MAX_RETRIES: 3,
        RETRY_DELAY: 1000, // 1秒
        BACKOFF_MULTIPLIER: 2
    }
}

export interface LazyLoadConfig {
    rootMargin: string
    threshold: number
    loadingClass: string
    errorClass: string
}

// 懒加载配置
export const LAZY_LOAD_CONFIG: LazyLoadConfig = {
    rootMargin: '50px',
    threshold: 0.1,
    loadingClass: 'loading',
    errorClass: 'error'
}

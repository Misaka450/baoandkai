// 性能优化配置

export const PERFORMANCE_CONFIG = {
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
};

// 懒加载配置
export const LAZY_LOAD_CONFIG = {
  rootMargin: '50px',
  threshold: 0.1,
  loadingClass: 'loading',
  errorClass: 'error'
};
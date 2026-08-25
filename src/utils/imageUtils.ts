/**
 * 图片优化工具函数
 */

/**
 * LRU (Least Recently Used) 内存图片缓存池
 * 
 * 💡 原理解释：
 * 就像一个小抽屉，最多只能放 300 张照片的记忆。
 * 1. 每次存入新照片时，如果抽屉满了，自动把最久没看过的第 1 张照片忘掉（淘汰）；
 * 2. 每次再次查看已有的照片时，把它拿到抽屉最上面（刷新活跃度）；
 * 这样无论刷多久小窝，手机浏览器都不会越用越占内存。
 */
export class BoundedImageCache {
    // 使用 Map 记录缓存，Map 默认按插入顺序保存键值
    private cache = new Map<string, number>();
    private maxCapacity: number;

    constructor(maxCapacity = 300) {
        this.maxCapacity = maxCapacity;
    }

    /**
     * 写入图片 URL 到缓存池中
     * 如果已存在，先删除再添加，提到最新位置；
     * 如果超出容量，移除最久未访问的图片。
     */
    add(url: string): this {
        if (!url) return this;
        // 如果已存在先删除再添加，刷新访问新鲜度
        if (this.cache.has(url)) {
            this.cache.delete(url);
        } else if (this.cache.size >= this.maxCapacity) {
            // 超出容量上限时，移除最久未被访问的一条（Map 的第一个 entry）
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey);
            }
        }
        this.cache.set(url, Date.now());
        return this;
    }

    /**
     * 检查图片是否在缓存池中
     * 命中时自动刷新该条目的活跃度（LRU 机制）
     */
    has(url: string): boolean {
        if (!url || !this.cache.has(url)) return false;
        // 命中时将其移到队列末尾，刷新为最近访问
        this.cache.delete(url);
        this.cache.set(url, Date.now());
        return true;
    }

    /**
     * 删除指定图片的缓存
     */
    delete(url: string): boolean {
        if (!url) return false;
        return this.cache.delete(url);
    }

    /**
     * 清空缓存池
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * 获取当前缓存图片数量
     */
    get size(): number {
        return this.cache.size;
    }

    /**
     * 获取最大容量限制
     */
    get capacity(): number {
        return this.maxCapacity;
    }
}

// 全局已加载图片缓存记录 (内存中，容量保护 300 条)
export const loadedImagesCache = new BoundedImageCache(300);

// Cloudflare Image Resizing 配置
const CF_IMAGE_CONFIG = {
    // 你的 R2 自定义域名
    domain: 'img.980823.xyz',
    // 默认质量
    quality: 80,
    // 是否启用 WebP 转换
    format: 'auto' as 'auto' | 'webp' | 'avif',
}

// 判断是否为 R2 图片 URL
function isR2ImageUrl(url: string): boolean {
    if (!url) return false;
    return url.includes(CF_IMAGE_CONFIG.domain) || url.includes('.r2.dev');
}

/**
 * 生成 Cloudflare Image Resizing 转换后的 URL
 * 用于网站展示（自动转 WebP/AVIF）
 * @param url 原始图片 URL
 * @param options 转换选项
 */
export function getOptimizedImageUrl(
    url: string,
    options: {
        width?: number;
        height?: number;
        quality?: number;
        format?: 'auto' | 'webp' | 'avif';
        fit?: 'contain' | 'cover' | 'crop' | 'pad';
    } = {}
): string {
    if (!url) return '';

    // 如果不是 R2 图片，直接返回原 URL
    if (!isR2ImageUrl(url)) return url;

    // 如果 URL 已经包含 cdn-cgi/image，说明已经是优化过的 URL，直接返回
    if (url.includes('/cdn-cgi/image/')) {
        return url;
    }

    // 构建转换参数
    const { width, height, quality = CF_IMAGE_CONFIG.quality, format = CF_IMAGE_CONFIG.format, fit = 'cover' } = options;
    const transforms: string[] = [];
    if (width) transforms.push(`width=${width}`);
    if (height) transforms.push(`height=${height}`);
    transforms.push(`quality=${quality}`);
    transforms.push(`format=${format}`);
    transforms.push(`fit=${fit}`);
    const params = transforms.join(',');

    // 解析 URL 并构建新 URL
    try {
        const urlObj = new URL(url);
        // 构建新 URL: https://img.980823.xyz/cdn-cgi/image/width=400,quality=80,format=auto/albums/xxx.jpg
        return `https://${urlObj.host}/cdn-cgi/image/${params}${urlObj.pathname}`;
    } catch {
        return url;
    }
}

/**
 * 压缩图片
 * @param file 原始文件
 * @param maxWidth 最大宽度
 * @param quality 压缩质量 (0-1)
 */
export async function compressImage(file: File, maxWidth = 2000, quality = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // 只有当宽度超过 maxWidth 时才缩小
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                // 转换为 WebP 格式（如果支持）或 JPEG
                // WebP 通常比 JPEG 体积更小且质量更好
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                                type: 'image/webp',
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            reject(new Error('Canvas to Blob failed'));
                        }
                    },
                    'image/webp',
                    quality
                );
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

/**
 * 生成缩略图 URL
 * 使用 Cloudflare Image Resizing 转换
 */
export function getThumbnailUrl(url: string, size: number = 400): string {
    if (!url) return '';
    return getOptimizedImageUrl(url, { width: size, quality: 80, format: 'auto' });
}

/**
 * 生成大图/全屏展示用优化 URL
 * 用于相册大图查看器，自动转换为 WebP/AVIF
 * 根据屏幕 dpi 和尺寸提供合适的图片
 * @param url 原始图片 URL
 * @param maxSize 最大尺寸（宽度），默认 2000
 */
export function getFullImageUrl(url: string, maxSize: number = 2000): string {
    if (!url) return '';
    return getOptimizedImageUrl(url, {
        width: maxSize,
        quality: 90,
        format: 'auto',
        fit: 'contain'
    });
}

/**
 * 获取原图 URL（用于下载，不经过任何转换）
 */
export function getOriginalImageUrl(url: string): string {
    if (!url) return '';
    // 移除 cdn-cgi/image 参数
    if (url.includes('cdn-cgi/image')) {
        try {
            const parts = url.split('/');
            const domain = parts[2] || CF_IMAGE_CONFIG.domain;
            const imageIndex = parts.findIndex(p => p === 'image');
            const pathStart = imageIndex + 2;
            const originalPath = parts.slice(pathStart).join('/');
            return (`https://${domain}/${originalPath}`).split('?')[0] || '';
        } catch {
            return url.split('?')[0] || '';
        }
    }
    // 如果 URL 带有其他动态参数，则移除它们
    if (url.includes('?')) {
        return url.split('?')[0] || '';
    }
    return url;
}

/**
 * 下载原图（绕过 Cloudflare 转换）
 */
export function downloadOriginalImage(url: string, filename?: string): void {
    const originalUrl = getOriginalImageUrl(url);
    const name = filename || originalUrl.split('/').pop() || 'image.jpg';

    const link = document.createElement('a');
    link.href = originalUrl;
    link.download = name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * 预加载图片
 */
export function preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
            loadedImagesCache.add(url);
            resolve();
        };
        img.onerror = reject;
    });
}

/**
 * 获取优化后的头像 URL
 * @param url 原始头像 URL
 * @param size 目标尺寸 (会自动 *2 用于高清屏)
 */
export function getOptimizedAvatarUrl(url: string, size: number = 160): string {
    if (!url) return ''
    // 对于 SVG data URL 或 dicebear 头像保持原样（已是矢量图）
    if (url.includes('dicebear.com') || url.startsWith('data:image/svg')) return url
    // 对于自定义上传的头像，使用动态缩放
    return getThumbnailUrl(url, size * 2)
}

/**
 * 生成头像 srcset 用于响应式
 */
export function getAvatarSrcSet(url: string): string {
    if (!url || url.includes('dicebear.com') || url.startsWith('data:image/svg')) return ''
    return `${getThumbnailUrl(url, 200)} 1x, ${getThumbnailUrl(url, 400)} 2x`
}

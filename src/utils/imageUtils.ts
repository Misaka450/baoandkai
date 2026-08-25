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
        if (this.cache.has(url)) {
            this.cache.delete(url);
        } else if (this.cache.size >= this.maxCapacity) {
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

/**
 * 生成服务端动态优化后的图片 URL（基于 Sharp 缩略图与 WebP 压缩）
 * 
 * 1. 本地 `/uploads/...` 路径 -> 转换为 `/api/images/...` 并追加裁剪压缩参数
 * 2. 如果已是 `/api/images/...` 路径 -> 增补/更新查询参数
 * 3. 外链/Data URL -> 保持原样
 * 
 * @param url 原始图片 URL
 * @param options 转换选项
 */
export function getOptimizedImageUrl(
    url: string,
    options: {
        width?: number;
        height?: number;
        quality?: number;
        format?: 'auto' | 'webp' | 'jpeg' | 'png';
    } = {}
): string {
    if (!url) return '';

    // Data URL / SVG / 外部第三方图床直接返回
    if (url.startsWith('data:') || url.startsWith('blob:') || url.includes('dicebear.com')) {
        return url;
    }

    let targetPath = url;

    // 如果是以 /uploads/ 开头的本地相对路径或完整 URL
    if (targetPath.includes('/uploads/')) {
        const parts = targetPath.split('/uploads/');
        const relativeKey = parts.slice(1).join('/uploads/');
        targetPath = `/api/images/${relativeKey}`;
    }

    // 如果目标是 /api/images/ 路由
    if (targetPath.includes('/api/images/')) {
        const { width, height, quality = 80, format = 'webp' } = options;
        const [base, existingQuery] = targetPath.split('?');
        const searchParams = new URLSearchParams(existingQuery || '');

        if (width) searchParams.set('w', width.toString());
        if (height) searchParams.set('h', height.toString());
        if (quality) searchParams.set('q', quality.toString());
        if (format && format !== 'auto') searchParams.set('f', format);

        const queryString = searchParams.toString();
        return queryString ? `${base || ''}?${queryString}` : (base || '');
    }

    return url;
}

/**
 * 压缩图片（上传前前端 Canvas 预压缩）
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
 * 默认宽 400px，自动由服务端 Sharp 转换为 WebP 格式
 */
export function getThumbnailUrl(url: string, size: number = 400): string {
    if (!url) return '';
    return getOptimizedImageUrl(url, { width: size, quality: 80, format: 'webp' });
}

/**
 * 生成大图/全屏展示用优化 URL
 * 用于相册大图查看器，最大宽度 1600px，WebP 格式
 * @param url 原始图片 URL
 * @param maxSize 最大尺寸（宽度），默认 1600
 */
export function getFullImageUrl(url: string, maxSize: number = 1600): string {
    if (!url) return '';
    return getOptimizedImageUrl(url, {
        width: maxSize,
        quality: 85,
        format: 'webp',
    });
}

/**
 * 获取原图 URL（用于下载，不经过任何动态尺寸压缩）
 */
export function getOriginalImageUrl(url: string): string {
    if (!url) return '';

    // 如果是 /api/images/ 路径，转换回原图路径 /uploads/...
    if (url.includes('/api/images/')) {
        const parts = url.split('/api/images/');
        const relativeKey = (parts[1] || '').split('?')[0];
        return `/uploads/${relativeKey}`;
    }

    return url.split('?')[0] || '';
}

/**
 * 下载原图
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
        img.onerror = () => {
            reject(new Error(`Failed to load image: ${url}`));
        };
    });
}

/**
 * 批量预加载图片
 */
export async function preloadImages(urls: string[]): Promise<void> {
    const validUrls = urls.filter(url => url && !loadedImagesCache.has(url));
    await Promise.allSettled(validUrls.map(url => preloadImage(url)));
}

/**
 * 格式化头像 URL
 */
export function formatAvatarUrl(url?: string): string {
    if (!url) return ''
    if (url.includes('dicebear.com') || url.startsWith('data:image/svg')) return url
    return getOptimizedImageUrl(url, { width: 200, quality: 80, format: 'webp' })
}

/**
 * 获取优化后的头像 URL
 */
export function getOptimizedAvatarUrl(url?: string, size: number = 160): string {
    if (!url) return ''
    if (url.includes('dicebear.com') || url.startsWith('data:image/svg')) return url
    return getOptimizedImageUrl(url, { width: size, quality: 80, format: 'webp' })
}

/**
 * 获取头像响应式 srcset
 */
export function getAvatarSrcSet(url?: string): string | undefined {
    if (!url || !url.includes('/uploads/')) return undefined
    const base = getOptimizedAvatarUrl(url, 80)
    const mid = getOptimizedAvatarUrl(url, 160)
    const large = getOptimizedAvatarUrl(url, 320)
    return `${base} 1x, ${mid} 2x, ${large} 3x`
}

/**
 * 清除无效头像 URL
 */
export function sanitizeAvatarUrl(url?: string): string {
    if (!url || url.includes('dicebear.com') || url.startsWith('data:image/svg')) return ''
    return url
}

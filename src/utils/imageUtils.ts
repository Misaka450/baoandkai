/**
 * 图片优化工具函数
 */

// 检查是否支持 Cloudflare Image Resizing
// 在实际生产环境中,这通常由环境变量控制
const ENABLE_IMAGE_RESIZING = true; // 暂时默认为 true,后续可改为环境变量

interface ImageOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'avif' | 'json';
    fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
}

/**
 * 生成优化后的图片 URL
 * 如果支持 Cloudflare Image Resizing,则返回处理后的 URL
 * 否则返回原始 URL
 */
export function getOptimizedImageUrl(url: string, options: ImageOptions = {}): string {
    if (!url) return '';

    // 如果是本地开发环境或不支持 Image Resizing,直接返回原图
    // 注意:这里简单判断是否为相对路径或非 http 开头来排除一些特殊情况
    if (!ENABLE_IMAGE_RESIZING || url.startsWith('data:') || url.startsWith('blob:')) {
        return url;
    }

    // 构建 Cloudflare Image Resizing 参数
    const params: string[] = [];

    if (options.width) params.push(`width=${options.width}`);
    if (options.height) params.push(`height=${options.height}`);
    if (options.quality) params.push(`quality=${options.quality}`);
    if (options.format) params.push(`format=${options.format}`);
    if (options.fit) params.push(`fit=${options.fit}`);

    // 默认参数
    if (!options.format) params.push('format=auto');
    if (!options.quality) params.push('quality=80');

    // 构造 CDN URL
    // Cloudflare Image Resizing 格式: /cdn-cgi/image/<options>/<url>
    const paramString = params.join(',');

    // 对于完整 URL,直接拼接
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return `/cdn-cgi/image/${paramString}/${url}`;
    }

    // 对于相对路径,需要确保以 / 开头
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `/cdn-cgi/image/${paramString}${cleanUrl}`;
}

/**
 * 生成缩略图 URL
 */
export function getThumbnailUrl(url: string, size: number = 400): string {
    return getOptimizedImageUrl(url, {
        width: size,
        height: size,
        fit: 'cover',
        quality: 75
    });
}

/**
 * 预加载图片
 */
export function preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve();
        img.onerror = reject;
    });
}

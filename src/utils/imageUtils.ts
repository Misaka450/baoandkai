/**
 * 图片优化工具函数
 */

// 检查是否支持 Cloudflare Image Resizing
const ENABLE_IMAGE_RESIZING = import.meta.env.PROD; // 仅在生产环境开启，避免本地 404

// R2 资源基础域名 (从 r2Upload.ts 参考)
const R2_BASE_URL = 'https://1eaf793b.baoandkai.pages.dev';

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

    // 如果是开发环境或不支持 Image Resizing，直接返回
    if (!ENABLE_IMAGE_RESIZING || url.startsWith('data:') || url.startsWith('blob:')) {
        // 如果是开发环境下的 R2 相对路径，仍需补全域名才能在本地预览
        if (!url.startsWith('http') && !url.startsWith('data:') && !url.startsWith('blob:')) {
            return `${R2_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
        }
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

    // 如果是完整 URL，CDN 会尝试抓取该地址
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return `/cdn-cgi/image/${paramString}/${url}`;
    }

    // 对于相对路径（R2 资源），需要补全为完整的 R2 URL
    // 这样 Cloudflare Resizing 才知道去哪里拉取图片资源
    const fullUrl = `${R2_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
    return `/cdn-cgi/image/${paramString}/${fullUrl}`;
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

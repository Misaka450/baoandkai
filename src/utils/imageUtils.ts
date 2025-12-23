/**
 * 图片优化工具函数
 */

// 禁用 Cloudflare Image Resizing (按用户要求)
const ENABLE_IMAGE_RESIZING = false;

// 代理端点：通过 Functions 访问 R2 资源，解决同源和权限问题
const ASSETS_PROXY = '/api/uploads';

// 旧数据的 R2 域名，用于自动转换
const OLD_R2_DOMAIN = 'pub-f3abc7adae724902b344281ec73f700c.r2.dev';

interface ImageOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'avif' | 'json';
    fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
}

/**
 * 生成优化后的图片 URL
 */
export function getOptimizedImageUrl(url: string, options: ImageOptions = {}): string {
    if (!url) return '';

    // 1. 处理原始 URL，统一转化为本地代理路径
    let processedUrl = url;

    // 如果是完整的 R2 域名 URL，提取路径部分并转化为本地代理
    if (url.includes(OLD_R2_DOMAIN)) {
        const parts = url.split(OLD_R2_DOMAIN);
        const path = parts[parts.length - 1] || '';
        processedUrl = `${ASSETS_PROXY}${path.startsWith('/') ? path : `/${path}`}`;
    }
    // 如果是普通相对路径（不含 http）
    else if (!url.startsWith('http') && !url.startsWith('data:') && !url.startsWith('blob:')) {
        processedUrl = `${ASSETS_PROXY}${url.startsWith('/') ? url : `/${url}`}`;
    }

    // 2. 如果是开发环境或不支持 Resizing，直接返回处理后的 URL
    if (!ENABLE_IMAGE_RESIZING || processedUrl.startsWith('data:') || processedUrl.startsWith('blob:')) {
        return processedUrl;
    }

    // 3. 构建 Cloudflare Image Resizing 参数
    const params: string[] = [];
    if (options.width) params.push(`width=${options.width}`);
    if (options.height) params.push(`height=${options.height}`);
    if (options.quality) params.push(`quality=${options.quality}`);
    if (options.format) params.push(`format=${options.format}`);
    if (options.fit) params.push(`fit=${options.fit}`);

    // 默认参数
    if (!options.format) params.push('format=auto');
    if (!options.quality) params.push('quality=80');

    const paramString = params.join(',');

    // 4. 返回同源 Resizing URL
    // 因为 processedUrl 已经是 /api/uploads/... 格式，属于同源资源
    return `/cdn-cgi/image/${paramString}${processedUrl.startsWith('/') ? processedUrl : `/${processedUrl}`}`;
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

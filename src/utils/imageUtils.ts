/**
 * 图片优化工具函数
 */

// 全局已加载图片缓存记录 (内存中)
export const loadedImagesCache = new Set<string>();

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

    // 提取原始路径（去除查询参数）
    const originalUrl = url.split('?')[0];

    // 解析原始 URL 获取路径部分
    try {
        const urlObj = new URL(originalUrl);
        const pathname = originalUrl.replace(`https://${urlObj.host}`, '');

        const { width, height, quality = CF_IMAGE_CONFIG.quality, format = CF_IMAGE_CONFIG.format, fit = 'cover' } = options;

        // 构建转换参数
        const transforms: string[] = [];
        if (width) transforms.push(`width=${width}`);
        if (height) transforms.push(`height=${height}`);
        transforms.push(`quality=${quality}`);
        transforms.push(`format=${format}`);
        transforms.push(`fit=${fit}`);

        const params = transforms.join(',');

        // 构建新 URL: https://img.980823.xyz/cdn-cgi/image/width=400,quality=80,format=auto/albums/xxx.jpg
        return `https://${urlObj.host}/cdn-cgi/image/${params}${pathname}`;
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
 * 获取原图 URL（用于下载，不经过任何转换）
 */
export function getOriginalImageUrl(url: string): string {
    if (!url) return '';
    // 移除 cdn-cgi/image 参数
    if (url.includes('cdn-cgi/image')) {
        try {
            const parts = url.split('/');
            const domain = parts[2];
            const imageIndex = parts.findIndex(p => p === 'image');
            const pathStart = imageIndex + 2;
            return `https://${domain}/${parts.slice(pathStart).join('/')}`.split('?')[0];
        } catch {
            return url.split('?')[0];
        }
    }
    // 如果 URL 带有其他动态参数，则移除它们
    if (url.includes('?')) {
        return url.split('?')[0];
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
    if (!url) return '';
    // 对于 dicebear 头像保持原样（已是 SVG 矢量图）
    if (url.includes('dicebear.com')) return url;
    // 对于自定义上传的头像，使用动态缩放
    return getThumbnailUrl(url, size * 2);
}

/**
 * 生成头像 srcset 用于响应式
 */
export function getAvatarSrcSet(url: string): string {
    if (!url || url.includes('dicebear.com')) return '';
    return `${getThumbnailUrl(url, 200)} 1x, ${getThumbnailUrl(url, 400)} 2x`;
}

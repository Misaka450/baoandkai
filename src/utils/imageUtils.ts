/**
 * 图片优化工具函数
 */

// 全局已加载图片缓存记录 (内存中)
export const loadedImagesCache = new Set<string>();

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
 * 获取原图 URL
 */
export function getOriginalImageUrl(url: string): string {
    if (!url) return '';
    // 如果 URL 已经带有动态参数，则移除它们
    if (url.includes('?')) {
        return url.split('?')[0];
    }
    return url;
}

/**
 * 生成缩略图 URL
 * 适配 img.980823.xyz 的动态缩放参数
 */
export function getThumbnailUrl(url: string, size: number = 400): string {
    if (!url) return '';

    // 如果是 img.980823.xyz 或包含类似结构，则使用动态参数
    // 这种方式兼容性最好，不依赖预生成的缩略图文件
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${size}&quality=80&format=auto`;
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

/**
 * 图片优化工具函数
 */

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
    return url;
}

/**
 * 生成缩略图 URL
 * 目前直接返回原图，但可以配合 Cloudflare Images 或手动生成的缩略图
 */
export function getThumbnailUrl(url: string, _size: number = 150): string {
    if (!url) return '';
    return url;
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

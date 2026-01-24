/**
 * 图片优化工具函数
 */

/**
 * 获取原图 URL（不做任何转换）
 * 直接返回原始 URL，保持最佳质量和加载速度
 */
export function getOriginalImageUrl(url: string): string {
    if (!url) return '';
    return url;
}

/**
 * 生成缩略图 URL
 * 对于底部缩略图画廊，使用较小尺寸以加快加载
 * 注意：只用于缩略图预览，主图始终使用原图
 */
export function getThumbnailUrl(url: string, _size: number = 150): string {
    // 直接返回原图，不做转换处理
    // R2 图片已经有 CDN 加速，不需要额外代理
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

/**
 * URL 处理工具函数
 */

// 旧的 R2 公网子域
const OLD_R2_DOMAIN = 'pub-f3abc7adae724902b344281ec73f700c.r2.dev';
const PROXY_PATH = '/api/images/';

/**
 * 将旧的 R2 直链转换为本地代理链接
 * @param url 原始 URL
 * @returns 转换后的 URL
 */
export function transformImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.includes(OLD_R2_DOMAIN)) {
        // 提取文件名部分
        const parts = url.split(OLD_R2_DOMAIN + '/');
        if (parts.length > 1) {
            return PROXY_PATH + parts[1];
        }
    }
    return url;
}

/**
 * 转换图片数组或逗号分隔的字符串
 * @param images 图片数据
 * @returns 转换后的图片数组
 */
export function transformImageArray(images: string | string[] | null | undefined): string[] {
    if (!images) return [];

    const imageList = Array.isArray(images)
        ? images
        : (typeof images === 'string' ? images.split(',').filter(Boolean) : []);

    return imageList.map(transformImageUrl);
}

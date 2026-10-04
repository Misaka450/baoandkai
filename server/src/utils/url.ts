/**
 * URL 处理工具函数
 */

// 获取图片的基础 URL 路径，例如 '/uploads' 或 'https://bbkk.980823.xyz/uploads'
const IMAGE_BASE_URL = process.env.IMAGE_BASE_URL || '/uploads';

/**
 * 将原始 Key 转换为可访问的图片链接（完整链接与绝对路径保持不变）
 * @param url 原始 URL 或 Key
 * @returns 转换后的 URL
 */
export function transformImageUrl(url: string | null | undefined): string {
    if (!url) return '';

    // 已经是完整链接（http 开头）或绝对路径（/ 开头）时，保持原样
    if (url.startsWith('http') || url.startsWith('/')) {
        return url;
    }

    // 否则视为原始 Key，拼接到基础 URL
    return `${IMAGE_BASE_URL}/${url}`;
}

/**
 * 将图片数据序列化为 JSON 字符串（统一入库格式）
 * 支持数组、逗号分隔字符串、空值等输入格式
 * @param images 图片数据
 * @returns JSON 字符串格式的图片数组
 */
export function serializeImages(images: unknown): string {
    if (!images) return '[]'
    if (Array.isArray(images)) return JSON.stringify(images)
    if (typeof images === 'string') {
        const trimmed = images.trim()
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) return trimmed
        return JSON.stringify(trimmed.split(',').filter(Boolean))
    }
    return '[]'
}

/**
 * 转换图片数组或可能是 JSON 字符串的数据
 * @param images 图片数据
 * @returns 转换后的图片数组
 */
export function transformImageArray(images: string | string[] | null | undefined): string[] {
    if (!images) return [];

    let imageList: string[] = [];
    if (Array.isArray(images)) {
        imageList = images;
    } else if (typeof images === 'string') {
        const trimmed = images.trim();
        // 尝试解析 JSON 格式 (如 ["url1", "url2"])
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                imageList = JSON.parse(trimmed);
            } catch {
                imageList = trimmed.split(',').filter(Boolean);
            }
        } else {
            // 普通逗号分隔格式
            imageList = trimmed.split(',').filter(Boolean);
        }
    }

    return imageList.map(transformImageUrl);
}

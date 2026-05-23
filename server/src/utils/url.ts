/**
 * URL 处理工具函数
 */

// 获取图片的基础 URL 路径，例如 '/uploads' 或 'https://bbkk.980823.xyz/uploads'
const IMAGE_BASE_URL = process.env.IMAGE_BASE_URL || '/uploads';

/**
 * 将旧的 R2 直链、任何 r2.dev 域名或原始 Key 转换为 CDN 链接或本地代理链接
 * @param url 原始 URL 或 Key
 * @returns 转换后的 URL
 */
export function transformImageUrl(url: string | null | undefined): string {
    if (!url) return '';

    // 如果已经是 http 开头的其他外部链接，保持原样
    if (url.startsWith('http')) {
        // 如果是历史的 R2 域名，我们需要转换为新的基础 URL
        if (url.includes('r2.dev') || url.includes('img.980823.xyz')) {
            const match = url.match(/(?:https?:\/\/[^/]+(?:\.r2\.dev|img\.980823\.xyz)\/)(.+)$/);
            if (match && match[1]) {
                return `${IMAGE_BASE_URL}/${match[1]}`;
            }
        }
        return url;
    }

    // 如果已经是绝对路径（例如以 / 开头），保持原样
    if (url.startsWith('/')) {
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

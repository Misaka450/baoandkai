/**
 * URL 处理工具函数
 */

// 旧的 R2 公网子域
const OLD_R2_DOMAIN = 'pub-f3abc7adae724902b344281ec73f700c.r2.dev';
const PROXY_PATH = '/api/images/';

/**
 * 将旧的 R2 直链、任何 r2.dev 域名或原始 Key 转换为本地代理链接
 * @param url 原始 URL 或 Key
 * @returns 转换后的 URL
 */
export function transformImageUrl(url: string | null | undefined): string {
    if (!url) return '';

    // 如果已经是代理链接或本地路径，直接返回
    if (url.startsWith('/') || url.startsWith('./')) {
        return url;
    }

    // 匹配任何 r2.dev 域名
    if (url.includes('r2.dev')) {
        const match = url.match(/https?:\/\/[^/]+\.r2\.dev\/(.+)$/);
        if (match && match[1]) {
            return PROXY_PATH + match[1];
        }
    }

    // 如果是 http 开头的其他外部链接，保持原样
    if (url.startsWith('http')) {
        return url;
    }

    // 否则视为原始 R2 Key，拼接到代理路径
    return PROXY_PATH + url;
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

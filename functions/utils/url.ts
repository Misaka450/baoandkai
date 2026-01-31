/**
 * URL 处理工具函数
 */

// 部署后的自定义域名
const CUSTOM_DOMAIN = 'https://img.980823.xyz';
const PROXY_PATH = '/api/images/';

/**
 * 将旧的 R2 直链、任何 r2.dev 域名或原始 Key 转换为 CDN 链接或本地代理链接
 * @param url 原始 URL 或 Key
 * @returns 转换后的 URL
 */
export function transformImageUrl(url: string | null | undefined): string {
    if (!url) return '';

    // 如果已经是自定义域名，直接返回
    if (url.startsWith(CUSTOM_DOMAIN)) {
        return url;
    }

    // 如果是代理链接或本地路径，转换成自定义域名
    if (url.startsWith(PROXY_PATH)) {
        return url.replace(PROXY_PATH, `${CUSTOM_DOMAIN}/`);
    }

    // 如果已经是以 / 开头的绝对路径（但不是代理路径），可能是前端资源，保持原样
    if (url.startsWith('/')) {
        return url;
    }

    // 匹配任何 r2.dev 域名并转换
    if (url.includes('r2.dev')) {
        const match = url.match(/https?:\/\/[^/]+\.r2\.dev\/(.+)$/);
        if (match && match[1]) {
            return `${CUSTOM_DOMAIN}/${match[1]}`;
        }
    }

    // 如果是 http 开头的其他外部链接，保持原样
    if (url.startsWith('http')) {
        return url;
    }

    // 否则视为原始 R2 Key，拼接到自定义域名
    return `${CUSTOM_DOMAIN}/${url}`;
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

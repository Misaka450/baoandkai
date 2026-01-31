import { jsonResponse, errorResponse } from '../../utils/response';

export interface Env {
    IMAGES: R2Bucket;
}

// Cloudflare Pages Functions - 图片代理/直链API (带边缘缓存)
export async function onRequestGet(context: { request: Request; env: Env }) {
    const { request, env } = context;

    try {
        const url = new URL(request.url);

        // 移除 debug 参数，使用干净的 URL 作为缓存 key
        const cacheUrl = new URL(request.url);
        cacheUrl.searchParams.delete('debug');
        const cacheKey = new Request(cacheUrl.toString(), request);

        // 获取 Cloudflare 边缘缓存
        const cache = caches.default;

        // 1. 先检查边缘缓存
        let response = await cache.match(cacheKey);
        if (response) {
            // 缓存命中，直接返回（添加标记头便于调试）
            const cachedResponse = new Response(response.body, response);
            cachedResponse.headers.set('X-Cache', 'HIT');
            return cachedResponse;
        }

        // 2. 缓存未命中，从 R2 获取
        if (!env.IMAGES) {
            return errorResponse('系统错误: R2 存储绑定 (IMAGES) 未配置。', 500);
        }

        const key = url.pathname.split('/api/images/')[1];
        if (!key) {
            return errorResponse('未指定图片 Key', 400);
        }

        const decodedKey = decodeURIComponent(key);

        let object;
        try {
            object = await env.IMAGES.get(decodedKey);
        } catch (r2Error: any) {
            return errorResponse(`获取图片失败: ${r2Error.message}`, 500);
        }

        if (object === null) {
            return errorResponse(`图片不存在: ${decodedKey}`, 404);
        }

        // 3. 构建响应
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        // 浏览器缓存 1 个月，边缘缓存 1 年
        headers.set('Cache-Control', 'public, max-age=2592000, s-maxage=31536000, immutable');
        headers.set('X-Cache', 'MISS');

        response = new Response(object.body, { headers });

        // 4. 异步写入边缘缓存（不阻塞响应）
        context.waitUntil(cache.put(cacheKey, response.clone()));

        return response;
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}

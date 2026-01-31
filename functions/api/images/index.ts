import { jsonResponse, errorResponse } from '../../utils/response';

export interface Env {
    IMAGES: R2Bucket;
}

// Cloudflare Pages Functions - 图片代理/直链API
export async function onRequestGet(context: { request: Request; env: Env }) {
    const { request, env } = context;

    try {
        if (!env.IMAGES) {
            return errorResponse('系统错误: R2 存储绑定 (IMAGES) 未配置。请检查 Cloudflare Pages 后台设置。', 500);
        }

        const url = new URL(request.url);
        const key = url.pathname.split('/api/images/')[1];

        if (!key) {
            return errorResponse('未指定图片 Key', 400);
        }

        const decodedKey = decodeURIComponent(key);
        // 尝试获取对象
        let object;
        try {
            object = await env.IMAGES.get(decodedKey);
        } catch (r2Error: any) {
            return errorResponse(`获取图片失败: ${r2Error.message}`, 500);
        }

        if (object === null) {
            return errorResponse('图片不存在', 404);
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Cache-Control', 'public, max-age=31536000');

        return new Response(object.body, {
            headers,
        });
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}

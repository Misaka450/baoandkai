import { jsonResponse, errorResponse } from '../../utils/response';

export interface Env {
    IMAGES: R2Bucket;
}

// Cloudflare Pages Functions - 图片代理/直链API
export async function onRequestGet(context: { request: Request; env: Env }) {
    const { request, env } = context;

    try {
        const url = new URL(request.url);
        const isDebug = url.searchParams.get('debug') === '1';

        if (!env.IMAGES) {
            return errorResponse('系统错误: R2 存储绑定 (IMAGES) 未配置。请检查 Cloudflare Pages 后台设置。', 500);
        }

        const key = url.pathname.split('/api/images/')[1];

        if (!key) {
            return errorResponse('未指定图片 Key', 400);
        }

        const decodedKey = decodeURIComponent(key);

        if (isDebug) {
            // 诊断模式：返回详细信息
            let object;
            let objectError = null;
            try {
                object = await env.IMAGES.get(decodedKey);
            } catch (e: any) {
                objectError = e.message;
            }

            // 尝试列出 bucket 内容来查找
            const listResult = await env.IMAGES.list({ prefix: 'albums/', limit: 10 });

            return jsonResponse({
                raw_key: key,
                decoded_key: decodedKey,
                object_found: !!object,
                object_size: object?.size,
                object_error: objectError,
                sample_keys: listResult.objects.map(o => o.key).slice(0, 5)
            });
        }

        // 正常模式
        let object;
        try {
            object = await env.IMAGES.get(decodedKey);
        } catch (r2Error: any) {
            return errorResponse(`获取图片失败: ${r2Error.message}`, 500);
        }

        if (object === null) {
            return errorResponse(`图片不存在: ${decodedKey}`, 404);
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

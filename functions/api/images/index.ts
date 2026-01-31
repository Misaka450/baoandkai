import { jsonResponse, errorResponse } from '../../utils/response';

export interface Env {
    IMAGES: R2Bucket;
}

// Cloudflare Pages Functions - 图片代理/直链API
export async function onRequestGet(context: { request: Request; env: Env }) {
    const { request, env } = context;

    try {
        const url = new URL(request.url);
        const key = url.pathname.split('/api/images/')[1];

        if (!key) {
            return errorResponse('未指定图片 Key', 400);
        }

        const decodedKey = decodeURIComponent(key);
        const object = await env.IMAGES.get(decodedKey);

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

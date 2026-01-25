export async function onRequestGet(context) {
    const { params, env } = context;
    // [[path]].js 在 Pages Functions 中返回的是数组
    const pathArray = params.path || [];
    const key = pathArray.join('/');

    if (!env.IMAGES) {
        return new Response('Image storage not configured', { status: 500 });
    }

    if (!key) {
        return new Response('Key is required', { status: 400 });
    }

    const object = await env.IMAGES.get(key);

    if (!object) {
        return new Response('Image not found: ' + key, { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000');

    // 兜底处理 Content-Type，防止某些情况下缺失导致无法预览
    if (!headers.has('Content-Type')) {
        const ext = key.split('.').pop().toLowerCase();
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml'
        };
        headers.set('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    }

    return new Response(object.body, {
        headers,
    });
}

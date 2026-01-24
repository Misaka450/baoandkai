export async function onRequestGet(context) {
    const { params, env } = context;
    const key = params.key;

    if (!env.IMAGES) {
        return new Response('Image storage not configured', { status: 500 });
    }

    const object = await env.IMAGES.get(key);

    if (!object) {
        return new Response('Image not found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000');

    return new Response(object.body, {
        headers,
    });
}

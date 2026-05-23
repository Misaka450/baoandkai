import { Context, Next } from 'hono';

export async function corsMiddleware(c: Context, next: Next) {
    const origin = c.req.header('Origin');
    const allowedOriginsStr = process.env.ALLOWED_ORIGINS || '';
    const allowedOrigins = allowedOriginsStr ? allowedOriginsStr.split(',').map(s => s.trim()) : [];
    
    let corsOrigin = '';
    if (origin && allowedOrigins.length > 0) {
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            corsOrigin = origin;
        }
    }
    if (!corsOrigin && process.env.NODE_ENV !== 'production') {
        corsOrigin = origin || '*';
    }

    if (c.req.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': corsOrigin,
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
                'Access-Control-Max-Age': '86400',
                'Access-Control-Allow-Credentials': 'true',
            },
        });
    }

    await next();

    if (corsOrigin) {
        c.res.headers.set('Access-Control-Allow-Origin', corsOrigin);
        c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
        c.res.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return undefined;
}

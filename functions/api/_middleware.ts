import { errorResponse } from '../utils/response';

/**
 * 全局中间件：处理 CORS、公共路径验证以及 Token 鉴权逻辑
 * @param {import('@cloudflare/workers-types').EventContext<any, any, any>} context 
 */
export async function onRequest(context: any) {
    const { request, env, next } = context;
    const url = new URL(request.url);

    // 1. Handle CORS
    const origin = request.headers.get('Origin');
    const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',') : [];

    // Determine if the current origin is allowed
    let corsOrigin = '*'; // Default for dev or if not configured
    if (origin) {
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            corsOrigin = origin;
        } else if (allowedOrigins.length > 0) {
            corsOrigin = allowedOrigins[0];
        }
    }

    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': corsOrigin,
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    // 2. Define public paths (no auth required)
    const publicPaths = [
        '/api/auth/login',
        '/api/auth/check-token',
        '/api/config',  // 公开配置API给首页使用
        '/api/upload/', // Allow public access to uploaded files
        '/api/images/',  // Allow public access to images
        '/api/debug/',  // TEMP: Allow db debug
    ];

    // Allow GET requests to content APIs (public viewing, editing still requires auth)
    const publicGetPaths = [
        '/api/notes',
        '/api/timeline',
        '/api/albums',
        '/api/todos',
        '/api/food',
    ];

    const isPublicGet = request.method === 'GET' && publicGetPaths.some(path =>
        url.pathname === path || url.pathname.startsWith(path + '/')
    );

    // Check if current path is public
    const pathname = url.pathname;
    const isPublic = publicPaths.some(path => {
        return pathname === path || pathname.startsWith(path + '/') || (path.endsWith('/') && pathname.startsWith(path));
    });

    // 3. Auth check for non-public paths
    if (!isPublic && !isPublicGet) {
        try {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return errorResponse('未授权访问', 401);
            }

            const token = authHeader.split(' ')[1];

            // 1. Try to get from KV first
            let user = null;
            if (env.KV) {
                const cached = await env.KV.get(`token:${token}`, { type: 'json' });
                if (cached) {
                    if (new Date(cached.token_expires) > new Date()) {
                        user = cached;
                    }
                }
            }

            // 2. Fallback to DB if not in KV or KV not available
            if (!user) {
                user = await env.DB.prepare(`
                    SELECT id, username, email, token_expires
                    FROM users
                    WHERE token = ? AND token_expires > ?
                `).bind(token, new Date().toISOString()).first();

                // If found in DB, sync back to KV (if available)
                if (user && env.KV) {
                    const ttl = Math.floor((new Date(user.token_expires).getTime() - Date.now()) / 1000);
                    if (ttl > 0) {
                        await env.KV.put(`token:${token}`, JSON.stringify(user), { expirationTtl: ttl });
                    }
                }
            }

            if (!user) {
                return errorResponse('Token无效或已过期', 401);
            }

            // Attach user to context for downstream use
            context.data.user = user;

        } catch (err: any) {
            console.error('Middleware Auth Error:', err);
            const errorMessage = env.ENVIRONMENT === 'development' ? err.message : '认证失败';
            return errorResponse('服务器内部错误: ' + errorMessage, 500);
        }
    }

    // 4. Proceed to actual handler
    try {
        const response = await next();

        // 5. Add CORS and Security headers to all responses
        const newResponse = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: new Headers(response.headers)
        });

        // CORS Headers
        newResponse.headers.set('Access-Control-Allow-Origin', corsOrigin);
        newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        // Security Headers
        newResponse.headers.set('X-Content-Type-Options', 'nosniff');
        newResponse.headers.set('X-Frame-Options', 'DENY');
        newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        newResponse.headers.set('X-XSS-Protection', '1; mode=block');

        return newResponse;
    } catch (err: any) {
        console.error('Middleware Next Error:', err);
        const errorMessage = env.ENVIRONMENT === 'development' ? err.message : '请稍后重试';
        return errorResponse('服务器内部错误: ' + errorMessage, 500);
    }
}

import { errorResponse } from '../utils/response';

export async function onRequest(context) {
    const { request, env, next } = context;
    const url = new URL(request.url);

    // 1. Handle CORS for OPTIONS requests immediately
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    // 2. Define public paths (no auth required)
    const publicPaths = [
        '/api/auth/login',
        '/api/auth/check-token',
        '/api/config',
        '/api/notes',
        '/api/timeline',
        '/api/todos',
        '/api/food',
        '/api/albums',
        '/api/uploads/', // Allow public access to uploaded files
    ];

    // Check if current path is public
    const isPublic = publicPaths.some(path => url.pathname.startsWith(path));

    // 3. Auth check for non-public paths
    if (!isPublic) {
        try {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return errorResponse('未授权访问', 401);
            }

            const token = authHeader.split(' ')[1];

            // Verify token
            const user = await env.DB.prepare(`
        SELECT id, username, email, token_expires
        FROM users
        WHERE token = ? AND token_expires > datetime('now')
      `).bind(token).first();

            if (!user) {
                return errorResponse('Token无效或已过期', 401);
            }

            // Attach user to context for downstream use
            context.data.user = user;

        } catch (err) {
            console.error('Middleware Auth Error:', err);
            return errorResponse('服务器内部错误: ' + err.message, 500);
        }
    }

    // 4. Proceed to actual handler
    try {
        const response = await next();

        // 5. Add CORS headers to all responses
        // Clone response to ensure we can modify headers (in case original is immutable)
        const newResponse = new Response(response.body, response);
        newResponse.headers.set('Access-Control-Allow-Origin', '*');
        newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        return newResponse;
    } catch (err) {
        console.error('Middleware Next Error:', err);
        return errorResponse('服务器内部错误: ' + err.message, 500);
    }
}

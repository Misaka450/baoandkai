import { errorResponse } from '../utils/response';

/**
 * 全局中间件：处理 CORS、公共路径验证以及 Token 鉴权逻辑
 */
export async function onRequest(context: any) {
    const { request, env, next } = context;
    const url = new URL(request.url);

    // 1. CORS 处理 - 强制要求配置 ALLOWED_ORIGINS
    const origin = request.headers.get('Origin');
    const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',').map((s: string) => s.trim()) : [];

    // 确定允许的来源：不再默认允许 *
    let corsOrigin = '';
    if (origin && allowedOrigins.length > 0) {
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            corsOrigin = origin;
        }
    }
    // 开发环境回退：如果没有配置 ALLOWED_ORIGINS，允许 localhost
    if (!corsOrigin && env.ENVIRONMENT === 'development') {
        corsOrigin = origin || '*';
    }

    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': corsOrigin,
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400',
                'Access-Control-Allow-Credentials': 'true',
            },
        });
    }

    // 2. 定义公开路径（无需认证）
    // 注意：数据读取接口不再公开，所有数据API都需要认证
    const publicPaths = [
        '/api/auth/login',     // 登录接口
        '/api/auth/check-token', // Token验证接口
        '/api/config',         // 公开配置API（首页展示需要）
        '/api/images/',        // 图片资源访问（CDN直链需要）
    ];

    const pathname = url.pathname;
    const isPublic = publicPaths.some(path => {
        return pathname === path || pathname.startsWith(path + '/') || (path.endsWith('/') && pathname.startsWith(path));
    });

    // 3. 非公开路径需要认证
    if (!isPublic) {
        try {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return errorResponse('未授权访问', 401);
            }

            const token = authHeader.split(' ')[1];

            // 优先从 KV 缓存中获取用户信息
            let user = null;
            if (env.KV) {
                const cached = await env.KV.get(`token:${token}`, { type: 'json' });
                if (cached) {
                    if (new Date(cached.token_expires) > new Date()) {
                        user = cached;
                    } else {
                        // Token 已过期，清理 KV 缓存
                        await env.KV.delete(`token:${token}`);
                    }
                }
            }

            // KV 未命中或不可用，回退到数据库查询
            if (!user) {
                user = await env.DB.prepare(`
                    SELECT id, username, email, token_expires
                    FROM users
                    WHERE token = ? AND token_expires > ?
                `).bind(token, new Date().toISOString()).first();

                // 数据库命中后同步到 KV 缓存
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

            // 将用户信息注入上下文，供下游API使用
            context.data.user = user;

        } catch (err: any) {
            console.error('中间件认证错误:', err);
            const errorMessage = env.ENVIRONMENT === 'development' ? err.message : '认证失败';
            return errorResponse('服务器内部错误: ' + errorMessage, 500);
        }
    }

    // 4. 执行实际请求处理
    try {
        const response = await next();

        // 5. 为所有响应添加 CORS 和安全头
        const newResponse = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: new Headers(response.headers)
        });

        // CORS 头
        if (corsOrigin) {
            newResponse.headers.set('Access-Control-Allow-Origin', corsOrigin);
            newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            newResponse.headers.set('Access-Control-Allow-Credentials', 'true');
        }

        // 安全头
        newResponse.headers.set('X-Content-Type-Options', 'nosniff');
        newResponse.headers.set('X-Frame-Options', 'DENY');
        newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        newResponse.headers.set('X-XSS-Protection', '1; mode=block');

        return newResponse;
    } catch (err: any) {
        console.error('中间件处理错误:', err);
        const errorMessage = env.ENVIRONMENT === 'development' ? err.message : '请稍后重试';
        return errorResponse('服务器内部错误: ' + errorMessage, 500);
    }
}

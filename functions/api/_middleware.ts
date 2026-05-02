import { errorResponse } from '../utils/response';

/**
 * 中间件上下文环境变量
 */
interface MiddlewareEnv {
    DB: D1Database;
    KV?: KVNamespace;
    ALLOWED_ORIGINS?: string;
    ENVIRONMENT?: string;
}

/**
 * KV 缓存的用户信息
 */
interface CachedUser {
    id: number;
    username: string;
    email: string;
    token_expires: string;
}

/**
 * 中间件上下文类型
 */
interface MiddlewareContext {
    request: Request;
    env: MiddlewareEnv;
    next: () => Promise<Response>;
    data: Record<string, unknown>;
}

/**
 * 从请求的Cookie中解析指定名称的值
 */
function getCookieValue(request: Request, name: string): string | null {
    const cookieHeader = request.headers.get('Cookie')
    if (!cookieHeader) return null
    const match = cookieHeader.split(';').find(c => c.trim().startsWith(`${name}=`))
    return match ? match.split('=').slice(1).join('=').trim() : null
}

/**
 * 全局中间件：处理 CORS、公共路径验证、CSRF防护以及 Token 鉴权逻辑
 */
export async function onRequest(context: MiddlewareContext) {
    const { request, env, next } = context;
    const url = new URL(request.url);

    // 1. CORS 处理 - 强制要求配置 ALLOWED_ORIGINS
    const origin = request.headers.get('Origin');
    const allowedOrigins = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',').map((s: string) => s.trim()) : [];

    let corsOrigin = '';
    if (origin && allowedOrigins.length > 0) {
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            corsOrigin = origin;
        }
    }
    if (!corsOrigin && env.ENVIRONMENT === 'development') {
        corsOrigin = origin || '*';
    }

    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': corsOrigin,
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
                'Access-Control-Max-Age': '86400',
                'Access-Control-Allow-Credentials': 'true',
            },
        });
    }

    // 2. 定义公开路径（无需认证和CSRF验证）
    const publicPaths = [
        '/api/auth/login',
        '/api/auth/check-token',
        '/api/config',
        '/api/images/',
    ];

    const pathname = url.pathname;
    const isPublic = publicPaths.some(path => {
        return pathname === path || pathname.startsWith(path + '/') || (path.endsWith('/') && pathname.startsWith(path));
    });

    // 3. 非公开路径需要认证
    if (!isPublic) {
        try {
            // 优先从Cookie读取Token，回退到Authorization头（兼容过渡期）
            let token: string | null = getCookieValue(request, 'auth_token')

            if (!token) {
                const authHeader = request.headers.get('Authorization');
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    token = authHeader.split(' ')[1] ?? null;
                }
            }

            if (!token) {
                return errorResponse('未授权访问', 401);
            }

            // CSRF验证：非GET请求必须携带有效的CSRF令牌
            if (request.method !== 'GET') {
                const csrfFromHeader = request.headers.get('X-CSRF-Token')
                const csrfFromCookie = getCookieValue(request, 'csrf_token')

                if (!csrfFromHeader || !csrfFromCookie || csrfFromHeader !== csrfFromCookie) {
                    return errorResponse('CSRF验证失败', 403);
                }

                // 进一步验证CSRF令牌与认证Token的绑定关系
                if (env.KV) {
                    const storedCsrf = await env.KV.get(`csrf:${token}`)
                    if (storedCsrf !== csrfFromHeader) {
                        return errorResponse('CSRF令牌不匹配', 403);
                    }
                }
            }

            // 优先从 KV 缓存中获取用户信息
            let user: CachedUser | null = null;
            if (env.KV) {
                const cached = await env.KV.get<CachedUser>(`token:${token}`, { type: 'json' });
                if (cached) {
                    if (new Date(cached.token_expires) > new Date()) {
                        user = cached;
                    } else {
                        await env.KV.delete(`token:${token}`);
                        await env.KV.delete(`csrf:${token}`);
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

            context.data.user = user;

        } catch (err: unknown) {
            console.error('中间件认证错误:', err);
            const errorMessage = env.ENVIRONMENT === 'development' ? (err instanceof Error ? err.message : String(err)) : '认证失败';
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
        newResponse.headers.set('X-XSS-Protection', '0');
        // HSTS - 强制HTTPS（生产环境生效，max-age 1年，包含子域名）
        if (env.ENVIRONMENT === 'production') {
            newResponse.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }
        // 权限策略 - 限制浏览器功能访问
        newResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
        // CSP - 内容安全策略，防止XSS和数据注入攻击
        // 允许的脚本来源：自身、Cloudflare CDN
        // 允许的图片来源：自身、data:、blob:、R2域名、DiceBear头像API
        // 允许的样式来源：自身、inline（Tailwind需要）
        if (env.ENVIRONMENT === 'production') {
            newResponse.headers.set(
                'Content-Security-Policy',
                [
                    "default-src 'self'",
                    "script-src 'self' https://static.cloudflareinsights.com",
                    "style-src 'self' 'unsafe-inline'",
                    "img-src 'self' data: blob: https://img.980823.xyz https://api.dicebear.com https://*.r2.dev",
                    "font-src 'self'",
                    "connect-src 'self' https://img.980823.xyz https://*.r2.dev https://o*.ingest.sentry.io",
                    "frame-ancestors 'none'",
                    "base-uri 'self'",
                    "form-action 'self'",
                ].join('; ')
            );
        }

        return newResponse;
    } catch (err: unknown) {
        console.error('中间件处理错误:', err);
        const errorMessage = env.ENVIRONMENT === 'development' ? (err instanceof Error ? err.message : String(err)) : '请稍后重试';
        return errorResponse('服务器内部错误: ' + errorMessage, 500);
    }
}

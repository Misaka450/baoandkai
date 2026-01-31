/**
 * CORS中间件
 */

// 允许的域名列表
const ALLOWED_ORIGINS = [
    'https://baoandkai.pages.dev',
    'http://localhost:3000',
    'http://localhost:5173'
];

/**
 * 获取CORS头部
 */
export function getCorsHeaders(request: Request, env?: any): Record<string, string> {
    const origin = request.headers.get('Origin');

    // 在开发环境允许所有源,生产环境检查白名单
    const isDev = env?.ENVIRONMENT === 'development';
    const allowedOrigin = isDev
        ? (origin || '*')
        : (origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]);

    return {
        'Access-Control-Allow-Origin': allowedOrigin as string,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400'
    };
}

/**
 * 标准CORS头部(允许所有域名)
 */
export const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

/**
 * 带CORS的响应
 */
export function corsResponse<T = any>(data: T, status: number = 200, request: Request | null = null, env?: any): Response {
    const headers = request ? getCorsHeaders(request, env) : CORS_HEADERS;

    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    });
}

/**
 * 处理OPTIONS预检请求
 */
export function handleOptions(request: Request | null = null, env?: any): Response {
    const headers = request ? getCorsHeaders(request, env) : CORS_HEADERS;
    return new Response(null, { headers });
}

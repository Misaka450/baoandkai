import { Context, Next } from 'hono';

export async function securityMiddleware(c: Context, next: Next) {
    await next();

    c.res.headers.set('X-Content-Type-Options', 'nosniff');
    c.res.headers.set('X-Frame-Options', 'DENY');
    c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.res.headers.set('X-XSS-Protection', '0');

    const isProd = process.env.NODE_ENV === 'production';

    if (isProd) {
        c.res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        
        // 允许的图片来源包含本地服务路径与安全 Data/Blob URL（已彻底移除外部第三方 DiceBear 依赖）
        c.res.headers.set(
            'Content-Security-Policy',
            [
                "default-src 'self'",
                "script-src 'self' https://static.cloudflareinsights.com",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: blob: https: http: /uploads",
                "font-src 'self' data:",
                "connect-src 'self' https://o*.ingest.sentry.io",
                "frame-ancestors 'none'",
                "base-uri 'self'",
                "form-action 'self'",
            ].join('; ')
        );
    }
    c.res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
}

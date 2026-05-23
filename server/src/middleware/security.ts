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
        
        // 允许的图片来源添加本地服务路径 /uploads
        c.res.headers.set(
            'Content-Security-Policy',
            [
                "default-src 'self'",
                "script-src 'self' https://static.cloudflareinsights.com",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: blob: https://img.980823.xyz https://api.dicebear.com https://*.r2.dev /uploads",
                "font-src 'self'",
                "connect-src 'self' https://img.980823.xyz https://*.r2.dev https://o*.ingest.sentry.io",
                "frame-ancestors 'none'",
                "base-uri 'self'",
                "form-action 'self'",
            ].join('; ')
        );
    }
    c.res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
}

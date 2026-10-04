export function jsonResponse<T = any>(data: T, status: number = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

/**
 * 统一的错误响应出口
 *
 * 安全设计：生产环境（NODE_ENV=production）下，5xx 状态码一律返回通用文案，
 * 不把 error.message（可能包含 SQL 报错、文件路径、堆栈片段等内部信息）回传给客户端；
 * 4xx 属于用户输入类错误，原文保留以便前端提示。
 * 各路由的 console.error 已负责把详细原因记录到服务端日志。
 */
export function errorResponse(message: string, status: number = 500, details: any = null): Response {
    const isProd = process.env.NODE_ENV === 'production';
    const safeMessage = isProd && status >= 500 ? '服务器开小差了，请稍后再试' : message;
    // details 仅在非生产环境返回，生产环境一律置空
    const safeDetails = isProd ? null : details;

    return jsonResponse({
        error: safeMessage,
        details: safeDetails,
        success: false
    }, status);
}

export function jsonResponse<T = any>(data: T, status: number = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

export function errorResponse(message: string, status: number = 500, details: any = null): Response {
    return jsonResponse({
        error: message,
        details: details,
        success: false
    }, status);
}

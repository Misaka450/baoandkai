/**
 * 统一错误处理中间件
 */

export class APIError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'APIError';
  }
}

// 预定义的错误类型
export const ErrorTypes = {
  NOT_FOUND: (message = '资源不存在') => new APIError(message, 404, 'NOT_FOUND'),
  UNAUTHORIZED: (message = '未授权访问') => new APIError(message, 401, 'UNAUTHORIZED'),
  FORBIDDEN: (message = '禁止访问') => new APIError(message, 403, 'FORBIDDEN'),
  BAD_REQUEST: (message = '请求参数错误') => new APIError(message, 400, 'BAD_REQUEST'),
  VALIDATION_ERROR: (message = '数据验证失败') => new APIError(message, 422, 'VALIDATION_ERROR'),
  INTERNAL_ERROR: (message = '服务器内部错误') => new APIError(message, 500, 'INTERNAL_ERROR'),
};

/**
 * 统一的错误响应处理
 */
export function handleError(error, env) {
  const isDevelopment = env?.ENVIRONMENT === 'development';
  
  console.error('API Error:', error);
  
  if (error instanceof APIError) {
    return new Response(JSON.stringify({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(isDevelopment && { stack: error.stack })
      }
    }), {
      status: error.statusCode,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  // 未知错误
  return new Response(JSON.stringify({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isDevelopment ? error.message : '服务器内部错误,请稍后重试',
      ...(isDevelopment && { stack: error.stack })
    }
  }), {
    status: 500,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

/**
 * 成功响应
 */
export function successResponse(data, status = 200) {
  return new Response(JSON.stringify({
    success: true,
    data
  }), {
    status,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

// 统一的请求验证中间件
// 功能：验证token、权限、参数格式等

export interface User {
  id?: number;
  username?: string;
  admin?: boolean;
}

export interface AuthResult {
  valid: boolean;
  user?: User;
  error?: string;
  response?: Response;
  params?: any;
}

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  enum?: any[];
  default?: any;
}

export interface Schema {
  requireAuth?: boolean;
  params?: Record<string, ValidationRule>;
}

export function createAuthMiddleware(env: any) {
  return {
    // 验证管理员token
    async validateAdminToken(request: Request): Promise<AuthResult> {
      try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return { valid: false, error: '缺少认证令牌' };
        }

        const token = authHeader.substring(7);

        try {
          // 方法1: 检查数据库中的token（主要验证方式）
          const user = await env.DB.prepare(`
              SELECT id, username FROM users 
              WHERE token = ? AND token_expires > datetime('now')
            `).bind(token).first();

          if (user) {
            return { valid: true, user: { admin: true, id: user.id, username: user.username } };
          }

          // 方法2: 检查环境变量中的固定token（备用验证方式）
          const expectedToken = env.ADMIN_TOKEN;
          if (expectedToken && token === expectedToken) {
            return { valid: true, user: { admin: true } };
          }

          return { valid: false, error: '权限不足' };

        } catch (dbError) {
          console.error('数据库验证错误:', dbError);
          // 如果数据库验证失败，回退到环境变量验证
          const expectedToken = env.ADMIN_TOKEN;
          if (expectedToken && token === expectedToken) {
            return { valid: true, user: { admin: true } };
          }
          return { valid: false, error: '权限不足' };
        }
      } catch (error) {
        console.error('token验证错误:', error);
        return { valid: false, error: '令牌验证失败' };
      }
    },

    // 验证请求参数
    validateParams(params: any, schema: Record<string, ValidationRule>) {
      const errors: string[] = [];

      for (const [key, rule] of Object.entries(schema)) {
        const value = params[key];

        if (rule.required && (value === undefined || value === null || value === '')) {
          errors.push(`${key} 不能为空`);
          continue;
        }

        if (value !== undefined && value !== null && value !== '') {
          // 类型验证
          if (rule.type === 'number' && isNaN(Number(value))) {
            errors.push(`${key} 必须是数字`);
          }

          if (rule.type === 'string' && typeof value !== 'string') {
            errors.push(`${key} 必须是字符串`);
          }

          // 长度验证
          if (rule.minLength && String(value).length < rule.minLength) {
            errors.push(`${key} 至少需要 ${rule.minLength} 个字符`);
          }

          if (rule.maxLength && String(value).length > rule.maxLength) {
            errors.push(`${key} 最多 ${rule.maxLength} 个字符`);
          }

          // 数值范围验证
          if (rule.min !== undefined && Number(value) < rule.min) {
            errors.push(`${key} 不能小于 ${rule.min}`);
          }

          if (rule.max !== undefined && Number(value) > rule.max) {
            errors.push(`${key} 不能大于 ${rule.max}`);
          }

          // 枚举值验证
          if (rule.enum && !rule.enum.includes(value)) {
            errors.push(`${key} 必须是 ${rule.enum.join('、')} 之一`);
          }
        }
      }

      return { valid: errors.length === 0, errors };
    },

    // 创建统一的错误响应
    createErrorResponse(message: string, status: number = 400) {
      return new Response(JSON.stringify({
        success: false,
        error: message,
        message: message
      }), {
        status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    },

    // 创建验证包装器
    createValidator(schema: Schema) {
      return async (request: Request, env: any): Promise<AuthResult> => {
        try {
          let authResult: AuthResult | null = null;

          // 验证管理员权限（如果需要）
          if (schema.requireAuth) {
            authResult = await this.validateAdminToken(request);
            if (!authResult.valid) {
              return { valid: false, response: this.createErrorResponse(authResult.error!, 401) };
            }
          }

          // 获取请求参数
          let params: any = {};
          if (request.method === 'GET') {
            const url = new URL(request.url);
            params = Object.fromEntries(url.searchParams);
          } else {
            try {
              params = await request.json();
            } catch (e) {
              return { valid: false, response: this.createErrorResponse('请求格式错误', 400) };
            }
          }

          // 验证参数
          const validation = this.validateParams(params, schema.params || {});
          if (!validation.valid) {
            return {
              valid: false,
              response: this.createErrorResponse(validation.errors.join(', '), 400)
            };
          }

          return { valid: true, params, user: authResult?.user };
        } catch (error: any) {
          console.error('验证器错误:', error);
          return {
            valid: false,
            response: this.createErrorResponse('验证过程出错: ' + error.message, 500)
          };
        }
      };
    }
  };
}

// 预定义的验证规则
export const schemas: Record<string, Schema> = {
  // 待办事项创建/更新
  todo: {
    requireAuth: true,
    params: {
      title: { required: true, type: 'string', minLength: 1, maxLength: 100 },
      description: { required: false, type: 'string', maxLength: 500 },
      priority: { required: false, type: 'number', min: 1, max: 3, default: 2 },
      status: { required: false, type: 'string', enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
      category: { required: false, type: 'string', enum: ['general', 'work', 'life', 'study'], default: 'general' },
      due_date: { required: false, type: 'string' }
    }
  },

  // 分页参数
  pagination: {
    requireAuth: false,
    params: {
      page: { required: false, type: 'number', min: 1, default: 1 },
      limit: { required: false, type: 'number', min: 1, max: 100, default: 10 },
      sort: { required: false, type: 'string', enum: ['asc', 'desc'], default: 'desc' }
    }
  },

  // ID参数
  idParam: {
    requireAuth: true,
    params: {
      id: { required: true, type: 'number', min: 1 }
    }
  }
};

// 快捷验证函数
export async function withValidation(request: Request, env: any, schema: Schema, handler: (params: any, user: User | undefined) => Promise<Response>) {
  try {
    const middleware = createAuthMiddleware(env);
    const result = await middleware.createValidator(schema)(request, env);

    if (!result.valid) {
      return result.response!;
    }

    return handler(result.params, result.user);
  } catch (error: any) {
    console.error('验证错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '验证过程出错',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
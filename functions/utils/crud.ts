import { validate, validateRequired, validateLength, hasXSS, sanitizeObject } from './validation';
import { errorResponse } from './response';

/**
 * 从URL路径中提取并验证ID参数
 * 例如 /api/map/123 → 123
 */
export function extractIdFromUrl(url: URL): number {
    const segments = url.pathname.split('/').filter(Boolean);
    const idStr = segments.pop();
    const id = parseInt(idStr || '');

    if (isNaN(id) || id <= 0) {
        throw new ValidationError('无效的ID参数');
    }

    return id;
}

/**
 * 根据ID查找记录，不存在则抛出异常
 */
export async function findOrThrow<T>(
    db: D1Database,
    table: string,
    id: number,
    errorMessage?: string
): Promise<T> {
    const record = await db.prepare(`SELECT * FROM ${table} WHERE id = ?`)
        .bind(id)
        .first<T>();

    if (!record) {
        throw new NotFoundError(errorMessage || `${table}记录不存在`);
    }

    return record;
}

/**
 * 通用的输入验证 + XSS检测 + 消毒流程
 * @param body 请求体对象
 * @param requiredFields 必填字段列表 [{name: 'title', label: '标题', maxLength: 100}]
 * @param skipFields 跳过消毒的字段（如图片URL数组）
 * @returns 消毒后的数据对象
 */
export function validateAndSanitize<T extends Record<string, unknown>>(
    body: T,
    requiredFields: Array<{ name: string; label: string; maxLength?: number }>,
    skipFields: string[] = []
): Record<string, unknown> {
    // 构建验证规则
    const rules: (string | null)[] = [];

    for (const field of requiredFields) {
        const value = body[field.name];
        if (value !== undefined && value !== null) {
            const strValue = String(value);
            rules.push(validateRequired(strValue, field.label));
            if (field.maxLength) {
                rules.push(validateLength(strValue, field.label, 1, field.maxLength));
            }
        }
    }

    const validationError = validate(rules);
    if (validationError) {
        throw new ValidationError(validationError);
    }

    // XSS检测所有字符串字段
    for (const field of requiredFields) {
        const value = body[field.name];
        if (typeof value === 'string' && hasXSS(value)) {
            throw new ValidationError(`字段 ${field.label} 包含不安全字符`);
        }
    }

    // 消毒数据
    return sanitizeObject(body, skipFields);
}

/**
 * 从URL解析分页参数
 */
export function parsePaginationFromUrl(url: URL, defaultLimit = 20, maxLimit = 100) {
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(url.searchParams.get('limit') || String(defaultLimit), 10) || defaultLimit));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
}

/**
 * 验证错误
 */
export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

/**
 * 资源不存在错误
 */
export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}

/**
 * 统一的CRUD错误处理包装器
 * 自动将 ValidationError → 400, NotFoundError → 404, 其他 → 500
 */
export function handleCrudError(error: unknown): Response {
    if (error instanceof ValidationError) {
        return errorResponse(error.message, 400);
    }
    if (error instanceof NotFoundError) {
        return errorResponse(error.message, 404);
    }

    const message = error instanceof Error ? error.message : '未知错误';
    console.error('CRUD操作错误:', message);
    return errorResponse('服务器内部错误', 500);
}

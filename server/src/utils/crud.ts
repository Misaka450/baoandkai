import { Context } from 'hono';
import { validate, validateRequired, validateLength, hasXSS, sanitizeObject } from './validation.js';
import { pool } from '../lib/db.js';
import pg from 'pg';

/**
 * 从 Hono Context 提取并验证 ID 参数
 */
export function extractIdFromContext(c: Context): number {
  const idStr = c.req.param('id');
  const id = parseInt(idStr || '');

  if (isNaN(id) || id <= 0) {
    throw new ValidationError('无效的ID参数');
  }

  return id;
}

/**
 * 从URL路径中提取并验证ID参数 (保留，用于兼容)
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
  db: pg.Pool | pg.PoolClient,
  table: string,
  id: number,
  errorMessage?: string
): Promise<T> {
  // 检查表名是否合法，防止注入
  if (!/^[a-zA-Z0-9_]+$/.test(table)) {
    throw new Error('不合法的表名');
  }

  const { rows } = await db.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
  const record = rows[0];

  if (!record) {
    throw new NotFoundError(errorMessage || `${table}记录不存在`);
  }

  return record as T;
}

/**
 * 通用的输入验证 + XSS检测 + 消毒流程
 */
export function validateAndSanitize<T extends Record<string, unknown>>(
  body: T,
  requiredFields: Array<{ name: string; label: string; maxLength?: number }>,
  skipFields: string[] = []
): Record<string, unknown> {
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

  for (const field of requiredFields) {
    const value = body[field.name];
    if (typeof value === 'string' && hasXSS(value)) {
      throw new ValidationError(`字段 ${field.label} 包含不安全字符`);
    }
  }

  return sanitizeObject(body, skipFields);
}

/**
 * 从URL解析分页参数
 */
export function parsePaginationFromUrl(url: URL, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(url.searchParams.get('limit') || String(defaultLimit), 10) || defaultLimit)
  );
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
 */
export function handleCrudError(error: unknown, c: Context) {
  if (error instanceof ValidationError) {
    return c.json({ error: error.message, success: false }, 400);
  }
  if (error instanceof NotFoundError) {
    return c.json({ error: error.message, success: false }, 404);
  }

  const message = error instanceof Error ? error.message : '未知错误';
  console.error('CRUD操作错误:', error);
  return c.json({ error: '服务器内部错误', success: false }, 500);
}

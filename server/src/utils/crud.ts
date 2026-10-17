import { Context } from 'hono';
import pg from 'pg';

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
  console.error('CRUD操作错误:', message, error);
  return c.json({ error: '服务器内部错误', success: false }, 500);
}


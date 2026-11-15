import { Hono } from 'hono';
import { jsonResponse, errorResponse } from '../utils/response.js';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js';
import { validate, validateRequired, validateLength, validateDate, hasXSS } from '../utils/validation.js';
import { pool } from '../lib/db.js';
import { cache } from '../lib/cache.js';

const timeCapsules = new Hono();

/**
 * 获取 Asia/Shanghai 时区的今日日期（格式 YYYY-MM-DD）
 */
function getShanghaiToday(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

interface TimeCapsule {
  id: number;
  title: string | null;
  message: string;
  unlock_date: string;
  is_unlocked: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/time-capsules
 * 获取时间胶囊列表（支持分页，并批量自动解锁过期胶囊）
 */
timeCapsules.get('/', async (c) => {
  try {
    const url = new URL(c.req.url);
    const pagination = parsePagination(url, 20, 500);

    // 获取总记录数
    const { rows: countRows } = await pool.query('SELECT COUNT(*) as total FROM time_capsules');
    const total = parseInt(countRows[0]?.total || '0', 10);

    const now = getShanghaiToday();

    // 获取分页数据
    // 关键：未到解锁日期的胶囊，message 在 SQL 层直接返回 NULL（服务端密封），
    // 而不是依赖前端"不显示"，从根源上杜绝未到期内容通过接口泄露
    const { rows: capsuleRows } = await pool.query(
      `SELECT id, title,
              CASE WHEN unlock_date <= $3
                   THEN message
                   ELSE NULL
              END AS message,
              unlock_date, is_unlocked, created_by, created_at, updated_at
       FROM time_capsules
       ORDER BY unlock_date ASC
       LIMIT $1 OFFSET $2`,
      [pagination.pageSize, pagination.offset, now]
    );

    const capsules = capsuleRows as TimeCapsule[];

    // 批量检查并解锁到期的胶囊
    const toUnlock = capsules.filter((item) => item.unlock_date <= now && item.is_unlocked === 0);

    if (toUnlock.length > 0) {
      const ids = toUnlock.map((item) => item.id);
      const placeholders = ids.map((_, index) => `$${index + 1}`).join(',');
      
      await pool.query(
        `UPDATE time_capsules
         SET is_unlocked = 1, updated_at = NOW()
         WHERE id IN (${placeholders})`,
        ids
      );

      // 同步内存数据
      toUnlock.forEach((item) => {
        item.is_unlocked = 1;
      });

      await cache.del('stats:dashboard');
    }

    return jsonResponse(buildPaginatedResponse(capsules, total, pagination));
  } catch (error: any) {
    console.error('获取时间胶囊失败:', error);
    return errorResponse('获取时间胶囊失败: ' + error.message, 500);
  }
});

/**
 * POST /api/time-capsules
 * 创建时间胶囊
 */
timeCapsules.post('/', async (c) => {
  try {
    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return errorResponse('请求格式错误: 无效的JSON格式', 400);
    }

    const { title, message, unlock_date } = body || {};

    // 验证必填字段
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return errorResponse('留言内容不能为空', 400);
    }

    if (!unlock_date || typeof unlock_date !== 'string') {
      return errorResponse('解锁日期不能为空', 400);
    }

    const rules: (string | null)[] = [
      validateRequired(message, '留言内容'),
      validateLength(message.trim(), '留言内容', 1, 5000),
      validateDate(unlock_date, '解锁日期'),
    ];
    if (title !== undefined && title !== null && String(title).trim() !== '') {
      rules.push(validateLength(String(title).trim(), '标题', 1, 100));
    }
    const validationError = validate(rules);
    if (validationError) {
      return errorResponse(validationError, 400);
    }

    if ((title && hasXSS(String(title))) || hasXSS(message)) {
      return errorResponse('输入内容包含不安全字符', 400);
    }

    // 验证解锁日期必须是未来的日期（基于 Asia/Shanghai 时区）
    const today = getShanghaiToday();
    if (unlock_date <= today) {
      return errorResponse('解锁日期必须是未来的日期', 400);
    }

    // 插入并返回
    const { rows } = await pool.query(
      `INSERT INTO time_capsules (title, message, unlock_date, is_unlocked, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, 0, 'couple', NOW(), NOW())
       RETURNING id, title, message, unlock_date, is_unlocked, created_by, created_at, updated_at`,
      [title ? String(title).trim() : null, message.trim(), unlock_date]
    );

    const newCapsule = rows[0] as TimeCapsule;
    if (!newCapsule) {
      return errorResponse('创建时间胶囊失败', 500);
    }

    await cache.del('stats:dashboard');

    return jsonResponse({ data: newCapsule }, 201);
  } catch (error: any) {
    console.error('创建时间胶囊失败:', error);
    return errorResponse('创建时间胶囊失败: ' + error.message, 500);
  }
});

/**
 * DELETE /api/time-capsules/:id
 * 删除时间胶囊
 */
timeCapsules.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id') || '');
    if (isNaN(id)) {
      return errorResponse('无效的ID', 400);
    }

    const { rowCount } = await pool.query('DELETE FROM time_capsules WHERE id = $1', [id]);
    if (rowCount === 0) {
      return errorResponse('时间胶囊不存在', 404);
    }

    await cache.del('stats:dashboard');

    return jsonResponse({ success: true, message: '时间胶囊已删除' });
  } catch (error: any) {
    console.error('删除时间胶囊失败:', error);
    return errorResponse('删除时间胶囊失败: ' + error.message, 500);
  }
});

export default timeCapsules;

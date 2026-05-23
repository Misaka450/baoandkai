import { Hono } from 'hono';
import { jsonResponse, errorResponse } from '../utils/response.js';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js';
import { pool } from '../lib/db.js';

const timeCapsules = new Hono();

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
    const pagination = parsePagination(url);

    // 获取总记录数
    const { rows: countRows } = await pool.query('SELECT COUNT(*) as total FROM time_capsules');
    const total = parseInt(countRows[0]?.total || '0', 10);

    // 获取分页数据
    const { rows: capsuleRows } = await pool.query(
      `SELECT id, title, message, unlock_date, is_unlocked, created_by, created_at, updated_at
       FROM time_capsules
       ORDER BY unlock_date ASC
       LIMIT $1 OFFSET $2`,
      [pagination.pageSize, pagination.offset]
    );

    const capsules = capsuleRows as TimeCapsule[];

    // 批量检查并解锁到期的胶囊
    const now = new Date().toISOString().split('T')[0] || '';
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

    if (!unlock_date) {
      return errorResponse('解锁日期不能为空', 400);
    }

    // 验证解锁日期必须是未来的日期
    const unlockDate = new Date(unlock_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(unlockDate.getTime())) {
      return errorResponse('解锁日期格式无效', 400);
    }

    if (unlockDate <= today) {
      return errorResponse('解锁日期必须是未来的日期', 400);
    }

    // 插入并返回
    const { rows } = await pool.query(
      `INSERT INTO time_capsules (title, message, unlock_date, is_unlocked, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, 0, 'couple', NOW(), NOW())
       RETURNING id, title, message, unlock_date, is_unlocked, created_by, created_at, updated_at`,
      [title || null, message.trim(), unlock_date]
    );

    const newCapsule = rows[0] as TimeCapsule;
    if (!newCapsule) {
      return errorResponse('创建时间胶囊失败', 500);
    }

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

    // 检查是否存在
    const { rows } = await pool.query('SELECT id FROM time_capsules WHERE id = $1', [id]);
    if (rows.length === 0) {
      return errorResponse('时间胶囊不存在', 404);
    }

    await pool.query('DELETE FROM time_capsules WHERE id = $1', [id]);

    return jsonResponse({ success: true, message: '时间胶囊已删除' });
  } catch (error: any) {
    console.error('删除时间胶囊失败:', error);
    return errorResponse('删除时间胶囊失败: ' + error.message, 500);
  }
});

export default timeCapsules;

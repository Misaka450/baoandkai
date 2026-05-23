import { Hono } from 'hono';
import { jsonResponse, errorResponse } from '../utils/response.js';
import { transformImageArray, serializeImages } from '../utils/url.js';
import { validate, validateRequired, validateLength, validateDate, hasXSS, sanitizeObject } from '../utils/validation.js';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js';
import { findOrThrow, handleCrudError } from '../utils/crud.js';
import { pool } from '../lib/db.js';

const mapCheckins = new Hono();

interface MapCheckin {
  id: number;
  title: string;
  description: string;
  province: string;
  city: string;
  date: string;
  images: string;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/map
 * 获取地图打卡记录（支持分页和省份过滤）
 */
mapCheckins.get('/', async (c) => {
  try {
    const url = new URL(c.req.url);
    const province = (c.req.query('province') || '').trim();
    const pagination = parsePagination(url);

    let total = 0;
    let list: MapCheckin[] = [];

    if (province) {
      // 过滤省份计数
      const { rows: countRows } = await pool.query(
        'SELECT COUNT(*) as total FROM map_checkins WHERE province = $1',
        [province]
      );
      total = parseInt(countRows[0]?.total || '0', 10);

      // 获取列表
      const { rows } = await pool.query(
        `SELECT * FROM map_checkins
         WHERE province = $1
         ORDER BY date DESC, created_at DESC
         LIMIT $2 OFFSET $3`,
        [province, pagination.pageSize, pagination.offset]
      );
      list = rows as MapCheckin[];
    } else {
      // 全量计数
      const { rows: countRows } = await pool.query('SELECT COUNT(*) as total FROM map_checkins');
      total = parseInt(countRows[0]?.total || '0', 10);

      // 获取列表
      const { rows } = await pool.query(
        `SELECT * FROM map_checkins
         ORDER BY date DESC, created_at DESC
         LIMIT $1 OFFSET $2`,
        [pagination.pageSize, pagination.offset]
      );
      list = rows as MapCheckin[];
    }

    const checkinsWithImages = list.map((checkin) => ({
      ...checkin,
      images: transformImageArray(checkin.images),
    }));

    return jsonResponse(buildPaginatedResponse(checkinsWithImages, total, pagination));
  } catch (error: any) {
    console.error('获取地图打卡失败:', error);
    return errorResponse(error.message, 500);
  }
});

/**
 * POST /api/map
 * 新增打卡记录
 */
mapCheckins.post('/', async (c) => {
  try {
    const body: any = await c.req.json();
    const { title, description, province, city, date, images = [] } = body;

    // 输入验证
    const validationError = validate([
      validateRequired(title, '标题'),
      validateLength(title, '标题', 1, 100),
      validateRequired(province, '省份'),
      validateRequired(date, '日期'),
      validateDate(date, '日期'),
    ]);
    if (validationError) return errorResponse(validationError, 400);

    // XSS 检测
    if (hasXSS(title) || (description && hasXSS(description))) {
      return errorResponse('输入内容包含不安全字符', 400);
    }

    // 消毒数据
    const sanitized = sanitizeObject({ title, description, province, city }, ['images']);
    const imagesJson = serializeImages(images);

    // 插入并返回新记录
    const { rows } = await pool.query(
      `INSERT INTO map_checkins (title, description, province, city, date, images, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [
        sanitized.title,
        sanitized.description || '',
        sanitized.province,
        sanitized.city || '',
        date,
        imagesJson,
      ]
    );

    const newCheckin = rows[0] as MapCheckin;
    if (!newCheckin) {
      return errorResponse('创建失败', 500);
    }

    return jsonResponse({
      ...newCheckin,
      images: transformImageArray(newCheckin.images),
    });
  } catch (error: any) {
    console.error('创建打卡记录失败:', error);
    return errorResponse(error.message, 500);
  }
});

/**
 * GET /api/map/:id
 * 获取单个地图打卡记录详情
 */
mapCheckins.get('/:id', async (c) => {
  try {
    const checkinId = parseInt(c.req.param('id') || '');
    if (isNaN(checkinId)) {
      return errorResponse('无效的ID', 400);
    }

    const checkin = await findOrThrow<MapCheckin>(pool, 'map_checkins', checkinId);

    return jsonResponse({
      ...checkin,
      images: transformImageArray(checkin.images),
    });
  } catch (error: unknown) {
    return handleCrudError(error, c);
  }
});

/**
 * PUT /api/map/:id
 * 更新打卡记录
 */
mapCheckins.put('/:id', async (c) => {
  try {
    const checkinId = parseInt(c.req.param('id') || '');
    if (isNaN(checkinId)) {
      return errorResponse('无效的ID', 400);
    }

    const current = await findOrThrow<MapCheckin>(pool, 'map_checkins', checkinId);

    const body = (await c.req.json()) as Record<string, unknown>;
    const { title, description, province, city, date, images } = body;

    // 验证规则（仅验证传入字段）
    const fieldsToValidate: Array<{ name: string; label: string; maxLength?: number }> = [];
    if (title !== undefined) {
      fieldsToValidate.push({ name: 'title', label: '标题', maxLength: 100 });
    }
    if (date !== undefined) {
      fieldsToValidate.push({ name: 'date', label: '日期' });
    }

    // 验证并消毒
    const sanitized = sanitizeObject({ title, description, province, city }, ['images']);

    // 日期格式验证
    if (date !== undefined) {
      const dateError = validateDate(date as string, '日期');
      if (dateError) {
        return jsonResponse({ success: false, message: dateError }, 400);
      }
    }

    await pool.query(
      `UPDATE map_checkins SET
         title = $1,
         description = $2,
         province = $3,
         city = $4,
         date = $5,
         images = $6,
         updated_at = NOW()
       WHERE id = $7`,
      [
        title !== undefined ? sanitized.title : current.title,
        description !== undefined ? sanitized.description : current.description,
        province !== undefined ? sanitized.province : current.province,
        city !== undefined ? sanitized.city : current.city,
        date !== undefined ? date : current.date,
        images !== undefined ? serializeImages(images) : current.images,
        checkinId,
      ]
    );

    const { rows } = await pool.query('SELECT * FROM map_checkins WHERE id = $1', [checkinId]);
    const updated = rows[0] as MapCheckin;

    return jsonResponse({
      ...updated,
      images: transformImageArray(updated?.images),
    });
  } catch (error: unknown) {
    return handleCrudError(error, c);
  }
});

/**
 * DELETE /api/map/:id
 * 删除打卡记录
 */
mapCheckins.delete('/:id', async (c) => {
  try {
    const checkinId = parseInt(c.req.param('id') || '');
    if (isNaN(checkinId)) {
      return errorResponse('无效的ID', 400);
    }

    const { rowCount } = await pool.query('DELETE FROM map_checkins WHERE id = $1', [checkinId]);
    if (rowCount === 0) {
      return errorResponse('记录不存在', 404);
    }

    return jsonResponse({ success: true, message: '记录已删除' });
  } catch (error: unknown) {
    return handleCrudError(error, c);
  }
});

export default mapCheckins;

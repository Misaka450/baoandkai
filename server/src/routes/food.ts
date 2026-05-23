import { Hono } from 'hono';
import { jsonResponse, errorResponse } from '../utils/response.js';
import { transformImageArray, serializeImages } from '../utils/url.js';
import { validate, validateRequired, validateLength, validateDate, validateRating, hasXSS, sanitizeObject } from '../utils/validation.js';
import { buildPaginatedResponse, parsePagination } from '../utils/pagination.js';
import { findOrThrow, handleCrudError, ValidationError } from '../utils/crud.js';
import { pool } from '../lib/db.js';

const food = new Hono();

interface FoodCheckin {
  id: number;
  restaurant_name: string;
  description: string;
  date: string;
  address: string;
  cuisine: string;
  price_range: string;
  overall_rating: number;
  taste_rating: number;
  environment_rating: number;
  service_rating: number;
  recommended_dishes: string;
  images: string;
  sort_order: number;
  created_at: string;
  updated_at?: string;
}

interface CreateFoodBody {
  restaurant_name: string;
  description?: string;
  date: string;
  address?: string;
  cuisine?: string;
  price_range?: string;
  overall_rating?: number;
  taste_rating?: number;
  environment_rating?: number;
  service_rating?: number;
  recommended_dishes?: string | string[];
  images?: string[];
}

/**
 * GET /api/food/cuisines
 * 获取所有不重复的菜系列表
 */
food.get('/cuisines', async (c) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT cuisine FROM food_checkins 
       WHERE cuisine IS NOT NULL AND cuisine != '' 
       ORDER BY cuisine`
    );

    const cuisines = rows.map((r: any) => r.cuisine).filter(Boolean);

    return jsonResponse({
      data: cuisines,
      labels: {
        '火锅': 'Hot Pot',
        '甜点': 'Dessert',
        '烧烤': 'Barbecue',
        '面食': 'Noodles',
        '日料': 'Japanese',
        '韩料': 'Korean',
        '西餐': 'Western',
        '中餐': 'Chinese',
        '小吃': 'Snacks',
        '饮品': 'Drinks',
      },
    });
  } catch (error: any) {
    console.error('获取菜系列表失败:', error);
    return errorResponse(error.message, 500);
  }
});

/**
 * GET /api/food
 * 获取美食打卡列表（支持分页和菜系过滤）
 */
food.get('/', async (c) => {
  try {
    const url = new URL(c.req.url);

    // 兼容原有的前端 cuisines 判定
    if (c.req.query('cuisines') === 'true') {
      // 重定向到 /cuisines
      const cuisinesResult = await pool.query(
        `SELECT DISTINCT cuisine FROM food_checkins 
         WHERE cuisine IS NOT NULL AND cuisine != '' 
         ORDER BY cuisine`
      );
      const cuisines = cuisinesResult.rows.map((r: any) => r.cuisine).filter(Boolean);
      return jsonResponse({
        data: cuisines,
        labels: {
          '火锅': 'Hot Pot',
          '甜点': 'Dessert',
          '烧烤': 'Barbecue',
          '面食': 'Noodles',
          '日料': 'Japanese',
          '韩料': 'Korean',
          '西餐': 'Western',
          '中餐': 'Chinese',
          '小吃': 'Snacks',
          '饮品': 'Drinks',
        },
      });
    }

    const pagination = parsePagination(url, 12);
    const cuisine = c.req.query('cuisine') || '';

    let total = 0;
    let foodsList: FoodCheckin[] = [];

    if (cuisine) {
      const { rows: countRows } = await pool.query(
        'SELECT COUNT(*) as total FROM food_checkins WHERE cuisine = $1',
        [cuisine]
      );
      total = parseInt(countRows[0]?.total || '0', 10);

      const { rows } = await pool.query(
        `SELECT * FROM food_checkins
         WHERE cuisine = $1
         ORDER BY sort_order DESC, date DESC, created_at DESC
         LIMIT $2 OFFSET $3`,
        [cuisine, pagination.pageSize, pagination.offset]
      );
      foodsList = rows as FoodCheckin[];
    } else {
      const { rows: countRows } = await pool.query('SELECT COUNT(*) as total FROM food_checkins');
      total = parseInt(countRows[0]?.total || '0', 10);

      const { rows } = await pool.query(
        `SELECT * FROM food_checkins
         ORDER BY sort_order DESC, date DESC, created_at DESC
         LIMIT $1 OFFSET $2`,
        [pagination.pageSize, pagination.offset]
      );
      foodsList = rows as FoodCheckin[];
    }

    const foodsWithImages = foodsList.map((f) => ({
      ...f,
      images: transformImageArray(f.images),
    }));

    return jsonResponse(buildPaginatedResponse(foodsWithImages, total, pagination));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error('获取美食列表失败:', message);
    return errorResponse(message, 500);
  }
});

/**
 * POST /api/food
 * 新增美食记录
 */
food.post('/', async (c) => {
  try {
    const body = (await c.req.json()) as CreateFoodBody;
    const {
      restaurant_name,
      description,
      date,
      address,
      cuisine,
      price_range,
      overall_rating,
      taste_rating,
      environment_rating,
      service_rating,
      recommended_dishes,
      images = [],
    } = body;

    // 输入验证
    const validationError = validate([
      validateRequired(restaurant_name, '餐厅名称'),
      validateLength(restaurant_name, '餐厅名称', 1, 100),
      validateRequired(date, '日期'),
      validateDate(date, '日期'),
    ]);
    if (validationError) return errorResponse(validationError, 400);

    // 评分验证
    if (overall_rating) {
      const ratingError = validateRating(Number(overall_rating), '综合评分');
      if (ratingError) return errorResponse(ratingError, 400);
    }

    // XSS 检测
    if (hasXSS(restaurant_name) || (description && hasXSS(description))) {
      return errorResponse('输入内容包含不安全字符', 400);
    }

    // 消毒数据
    const sanitized = sanitizeObject(
      { restaurant_name, description, address, cuisine, price_range, recommended_dishes },
      ['images']
    );

    // 获取当前最大的 sort_order
    const { rows: maxRows } = await pool.query('SELECT MAX(sort_order) as max_order FROM food_checkins');
    const nextSortOrder = (maxRows[0]?.max_order || 0) + 1;

    // 插入并返回
    const { rows } = await pool.query(
      `INSERT INTO food_checkins (
         restaurant_name, description, date, address, cuisine, price_range,
         overall_rating, taste_rating, environment_rating, service_rating,
         recommended_dishes, images, sort_order, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
       RETURNING *`,
      [
        sanitized.restaurant_name,
        sanitized.description || '',
        date,
        sanitized.address || '',
        sanitized.cuisine || '',
        sanitized.price_range || '',
        overall_rating || 5,
        taste_rating || 5,
        environment_rating || 5,
        service_rating || 5,
        Array.isArray(recommended_dishes) ? recommended_dishes.join(',') : recommended_dishes || '',
        serializeImages(images),
        nextSortOrder,
      ]
    );

    const newFood = rows[0] as FoodCheckin;
    if (!newFood) {
      return errorResponse('创建失败', 500);
    }

    return jsonResponse({
      ...newFood,
      images: transformImageArray(newFood.images),
      recommended_dishes: newFood.recommended_dishes ? newFood.recommended_dishes.split(',') : [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error('美食打卡创建失败:', message);
    return errorResponse(message, 500);
  }
});

/**
 * POST /api/food/reorder
 * 批量更新美食排序
 */
food.post('/reorder', async (c) => {
  const client = await pool.connect();
  try {
    const items = (await c.req.json()) as { id: number; sort_order: number }[];

    if (!Array.isArray(items)) {
      return errorResponse('无效的数据格式', 400);
    }

    await client.query('BEGIN');

    for (const item of items) {
      await client.query('UPDATE food_checkins SET sort_order = $1 WHERE id = $2', [
        item.sort_order,
        item.id,
      ]);
    }

    await client.query('COMMIT');

    return jsonResponse({ success: true, message: '排序更新成功' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('更新美食排序失败:', error);
    return errorResponse(error.message, 500);
  } finally {
    client.release();
  }
});

/**
 * GET /api/food/:id
 * 获取单个美食记录
 */
food.get('/:id', async (c) => {
  try {
    const foodId = parseInt(c.req.param('id') || '');
    if (isNaN(foodId)) {
      return errorResponse('无效的ID', 400);
    }

    const foodItem = await findOrThrow<FoodCheckin>(pool, 'food_checkins', foodId);

    return jsonResponse({
      ...foodItem,
      images: transformImageArray(foodItem.images),
      recommended_dishes: foodItem.recommended_dishes ? foodItem.recommended_dishes.split(',') : [],
    });
  } catch (error: unknown) {
    return handleCrudError(error, c);
  }
});

/**
 * PUT /api/food/:id
 * 更新美食记录
 */
food.put('/:id', async (c) => {
  try {
    const foodId = parseInt(c.req.param('id') || '');
    if (isNaN(foodId)) {
      return errorResponse('无效的ID', 400);
    }

    const currentFood = await findOrThrow<FoodCheckin>(pool, 'food_checkins', foodId);

    const body = (await c.req.json()) as Record<string, unknown>;
    const {
      restaurant_name,
      description,
      date,
      address,
      cuisine,
      price_range,
      overall_rating,
      taste_rating,
      environment_rating,
      service_rating,
      recommended_dishes,
      images,
    } = body;

    // 仅验证传入的字段
    const fieldsToValidate: Array<{ name: string; label: string; maxLength?: number }> = [];
    if (restaurant_name !== undefined) {
      fieldsToValidate.push({ name: 'restaurant_name', label: '餐厅名称', maxLength: 100 });
    }
    if (date !== undefined) {
      fieldsToValidate.push({ name: 'date', label: '日期' });
    }

    // 验证并消毒
    const sanitized = sanitizeObject(
      { restaurant_name, description, address, cuisine, price_range, recommended_dishes },
      ['images']
    );

    // 日期验证
    if (date !== undefined) {
      const dateError = validateDate(date as string, '日期');
      if (dateError) {
        return jsonResponse({ success: false, message: dateError }, 400);
      }
    }

    // 评分校验
    if (overall_rating !== undefined) {
      const ratingError = validateRating(Number(overall_rating), '综合评分');
      if (ratingError) {
        return jsonResponse({ success: false, message: ratingError }, 400);
      }
    }

    await pool.query(
      `UPDATE food_checkins SET 
         restaurant_name = $1, 
         description = $2, 
         date = $3, 
         address = $4, 
         cuisine = $5, 
         price_range = $6,
         overall_rating = $7,
         taste_rating = $8,
         environment_rating = $9,
         service_rating = $10,
         recommended_dishes = $11,
         images = $12,
         updated_at = NOW() 
       WHERE id = $13`,
      [
        restaurant_name !== undefined ? sanitized.restaurant_name : currentFood.restaurant_name,
        description !== undefined ? sanitized.description : currentFood.description,
        date !== undefined ? date : currentFood.date,
        address !== undefined ? sanitized.address : currentFood.address,
        cuisine !== undefined ? sanitized.cuisine : currentFood.cuisine,
        price_range !== undefined ? sanitized.price_range : currentFood.price_range,
        overall_rating !== undefined ? overall_rating : currentFood.overall_rating,
        taste_rating !== undefined ? taste_rating : currentFood.taste_rating,
        environment_rating !== undefined ? environment_rating : currentFood.environment_rating,
        service_rating !== undefined ? service_rating : currentFood.service_rating,
        recommended_dishes !== undefined
          ? Array.isArray(recommended_dishes)
            ? recommended_dishes.join(',')
            : recommended_dishes
          : currentFood.recommended_dishes,
        images !== undefined ? serializeImages(images) : currentFood.images,
        foodId,
      ]
    );

    const { rows } = await pool.query('SELECT * FROM food_checkins WHERE id = $1', [foodId]);
    const updatedFood = rows[0] as FoodCheckin;

    return jsonResponse({
      ...updatedFood,
      images: transformImageArray(updatedFood?.images),
      recommended_dishes: updatedFood?.recommended_dishes ? updatedFood.recommended_dishes.split(',') : [],
    });
  } catch (error: unknown) {
    return handleCrudError(error, c);
  }
});

/**
 * DELETE /api/food/:id
 * 删除美食记录
 */
food.delete('/:id', async (c) => {
  try {
    const foodId = parseInt(c.req.param('id') || '');
    if (isNaN(foodId)) {
      return errorResponse('无效的ID', 400);
    }

    const { rowCount } = await pool.query('DELETE FROM food_checkins WHERE id = $1', [foodId]);
    if (rowCount === 0) {
      return errorResponse('记录不存在', 404);
    }

    return jsonResponse({ success: true, message: '记录已删除' });
  } catch (error: unknown) {
    return handleCrudError(error, c);
  }
});

export default food;

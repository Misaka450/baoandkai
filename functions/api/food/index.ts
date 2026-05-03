import { jsonResponse, errorResponse } from '../../utils/response';
import { transformImageArray, serializeImages } from '../../utils/url';
import { validate, validateRequired, validateLength, validateDate, validateRating, hasXSS, sanitizeObject } from '../../utils/validation';
import { buildPaginatedResponse, parsePagination } from '../../utils/pagination';

export interface Env {
  DB: D1Database;
}

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
  created_at: string;
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

// Cloudflare Pages Functions - 美食API
export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;

  try {
    const url = new URL(request.url);

    // 检查是否为获取分类列表的请求
    if (url.pathname.endsWith('/food/cuisines') || url.searchParams.get('cuisines') === 'true') {
      const cuisinesResult = await env.DB.prepare(`
        SELECT DISTINCT cuisine FROM food_checkins WHERE cuisine IS NOT NULL AND cuisine != '' ORDER BY cuisine
      `).all<{ cuisine: string }>();

      const cuisines = cuisinesResult.results.map(r => r.cuisine).filter(Boolean);

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
          '饮品': 'Drinks'
        }
      });
    }

    // 获取分页参数
    const pagination = parsePagination(url, 12);
    const cuisine = url.searchParams.get('cuisine') || '';

    // 构建查询条件
    let whereClause = '';
    const queryParams: (string | number)[] = [];

    if (cuisine) {
      whereClause = ' WHERE cuisine = ?';
      queryParams.push(cuisine);
    }

    // 获取总数
    const countResult = await env.DB.prepare(`
      SELECT COUNT(*) as total FROM food_checkins${whereClause}
    `).bind(...queryParams).first<{ total: number }>();
    const total = countResult?.total || 0;

    // 获取分页数据
    const foodsQuery = `
      SELECT * FROM food_checkins${whereClause}
      ORDER BY sort_order DESC, date DESC, created_at DESC
      LIMIT ? OFFSET ?
    `;
    const foods = await env.DB.prepare(foodsQuery)
      .bind(...queryParams, pagination.pageSize, pagination.offset)
      .all<FoodCheckin>();

    const foodsWithImages = foods.results.map(food => ({
      ...food,
      images: transformImageArray(food.images)
    }));

    return jsonResponse(buildPaginatedResponse(foodsWithImages, total, pagination));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    return errorResponse(message, 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const body = await request.json() as CreateFoodBody;
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
      images = []
    } = body;

    // 输入验证
    const validationError = validate([
      validateRequired(restaurant_name, '餐厅名称'),
      validateLength(restaurant_name, '餐厅名称', 1, 100),
      validateRequired(date, '日期'),
      validateDate(date, '日期'),
    ])
    if (validationError) return errorResponse(validationError, 400)

    // 评分验证
    if (overall_rating) {
      const ratingError = validateRating(Number(overall_rating), '综合评分')
      if (ratingError) return errorResponse(ratingError, 400)
    }

    // XSS检测
    if (hasXSS(restaurant_name) || (description && hasXSS(description))) {
      return errorResponse('输入内容包含不安全字符', 400)
    }

    // 消毒输入数据
    const sanitized = sanitizeObject(
      { restaurant_name, description, address, cuisine, price_range, recommended_dishes },
      ['images']
    )

    // 获取当前最大的 sort_order
    const maxSortResult = await env.DB.prepare(`
      SELECT MAX(sort_order) as max_order FROM food_checkins
    `).first<{ max_order: number }>();
    const nextSortOrder = (maxSortResult?.max_order || 0) + 1;

    const result = await env.DB.prepare(`
      INSERT INTO food_checkins (
        restaurant_name, description, date, address, cuisine, price_range,
        overall_rating, taste_rating, environment_rating, service_rating,
        recommended_dishes, images, sort_order, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      sanitized.restaurant_name, sanitized.description || '', date, sanitized.address || '', sanitized.cuisine || '', sanitized.price_range || '',
      overall_rating || 5, taste_rating || 5, environment_rating || 5, service_rating || 5,
      Array.isArray(recommended_dishes) ? recommended_dishes.join(',') : recommended_dishes || '',
      serializeImages(images),
      nextSortOrder
    ).run();

    const foodId = result.meta.last_row_id;
    const newFood = await env.DB.prepare(`
        SELECT * FROM food_checkins WHERE id = ?
      `).bind(foodId).first<FoodCheckin>();

    if (!newFood) {
      return errorResponse('创建失败', 500);
    }

    return jsonResponse({
      ...newFood,
      images: newFood.images ? newFood.images.split(',') : []
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    return errorResponse(message, 500);
  }
}
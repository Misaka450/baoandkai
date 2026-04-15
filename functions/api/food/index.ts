import { jsonResponse, errorResponse } from '../../utils/response';
import { transformImageArray } from '../../utils/url';

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
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '12', 10);
    const offset = (page - 1) * limit;
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
    `).first<{ total: number }>();
    const total = countResult?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // 获取分页数据
    const foodsQuery = `
      SELECT * FROM food_checkins${whereClause}
      ORDER BY sort_order DESC, date DESC, created_at DESC
      LIMIT ? OFFSET ?
    `;
    const foods = whereClause
      ? await env.DB.prepare(foodsQuery).bind(...queryParams, limit, offset).all<FoodCheckin>()
      : await env.DB.prepare(foodsQuery).bind(limit, offset).all<FoodCheckin>();

    const foodsWithImages = foods.results.map(food => ({
      ...food,
      images: transformImageArray(food.images)
    }));

    return jsonResponse({
      data: foodsWithImages,
      totalPages,
      totalCount: total,
      currentPage: page
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const body: any = await request.json();
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

    if (!restaurant_name) {
      return errorResponse('餐厅名称不能为空', 400);
    }
    if (!date) {
      return errorResponse('日期不能为空', 400);
    }

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
      restaurant_name, description || '', date, address || '', cuisine || '', price_range || '',
      overall_rating || 5, taste_rating || 5, environment_rating || 5, service_rating || 5,
      Array.isArray(recommended_dishes) ? recommended_dishes.join(',') : recommended_dishes || '',
      Array.isArray(images) ? images.join(',') : images,
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
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
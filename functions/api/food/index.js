import { jsonResponse, errorResponse } from '../../utils/response';

// Cloudflare Pages Functions - 美食API
export async function onRequestGet(context) {
  const { env, request } = context;

  try {
    // 获取分页参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '12', 10);
    const offset = (page - 1) * limit;

    // 获取总数
    const countResult = await env.DB.prepare(`
      SELECT COUNT(*) as total FROM food_checkins
    `).first();
    const total = countResult?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // 获取分页数据
    const foods = await env.DB.prepare(`
      SELECT * FROM food_checkins 
      ORDER BY date DESC, created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    const foodsWithImages = foods.results.map(food => ({
      ...food,
      images: food.images ? food.images.split(',') : []
    }));

    return jsonResponse({
      data: foodsWithImages,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
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

    if (!restaurant_name || !date) {
      return errorResponse('餐厅名称和日期不能为空', 400);
    }

    const result = await env.DB.prepare(`
      INSERT INTO food_checkins (
        restaurant_name, description, date, address, cuisine, price_range,
        overall_rating, taste_rating, environment_rating, service_rating,
        recommended_dishes, images, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      restaurant_name, description || '', date, address || '', cuisine || '', price_range || '',
      overall_rating || 5, taste_rating || 5, environment_rating || 5, service_rating || 5,
      Array.isArray(recommended_dishes) ? recommended_dishes.join(',') : recommended_dishes || '',
      Array.isArray(images) ? images.join(',') : images
    ).run();

    const foodId = result.meta.last_row_id;
    const newFood = await env.DB.prepare(`
        SELECT * FROM food_checkins WHERE id = ?
      `).bind(foodId).first();

    return jsonResponse({
      ...newFood,
      images: newFood.images ? newFood.images.split(',') : []
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
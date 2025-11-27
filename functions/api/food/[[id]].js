import { jsonResponse, errorResponse } from '../../utils/response';

// Cloudflare Pages Functions - 美食打卡ID相关API
export async function onRequestPut(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
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

    if (!id || isNaN(id)) {
      return errorResponse('无效的ID', 400);
    }

    if (!restaurant_name || !date) {
      return errorResponse('餐厅名称和日期不能为空', 400);
    }

    const result = await env.DB.prepare(`
      UPDATE food_checkins 
      SET restaurant_name = ?, description = ?, date = ?, address = ?, cuisine = ?, price_range = ?,
          overall_rating = ?, taste_rating = ?, environment_rating = ?, service_rating = ?,
          recommended_dishes = ?, images = ?, updated_at = datetime('now') 
      WHERE id = ?
    `).bind(
      restaurant_name, description || '', date, address || '', cuisine || '', price_range || '',
      overall_rating || 5, taste_rating || 5, environment_rating || 5, service_rating || 5,
      Array.isArray(recommended_dishes) ? recommended_dishes.join(',') : recommended_dishes || '',
      Array.isArray(images) ? images.join(',') : images, parseInt(id)
    ).run();

    if (result.changes === 0) {
      return errorResponse('记录不存在', 404);
    }

    const updatedFood = await env.DB.prepare(`
      SELECT * FROM food_checkins WHERE id = ?
    `).bind(parseInt(id)).first();

    return jsonResponse({
      ...updatedFood,
      images: updatedFood.images ? updatedFood.images.split(',') : []
    });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export async function onRequestDelete(context) {
  const { env, request } = context;

  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id || isNaN(id)) {
      return errorResponse('无效的ID', 400);
    }

    const result = await env.DB.prepare('DELETE FROM food_checkins WHERE id = ?').bind(parseInt(id)).run();

    if (result.changes === 0) {
      return errorResponse('记录不存在', 404);
    }

    return jsonResponse({ success: true, message: '删除成功' });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
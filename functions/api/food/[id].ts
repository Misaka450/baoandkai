import { jsonResponse, errorResponse } from '../../utils/response';

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

/**
 * 获取单个美食记录
 */
export async function onRequestGet(context: { env: Env; request: Request }) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').filter(Boolean).pop();
        const foodId = parseInt(id || '');

        if (isNaN(foodId)) {
            return errorResponse('无效的ID', 400);
        }

        const food = await env.DB.prepare(`SELECT * FROM food_checkins WHERE id = ?`).bind(foodId).first<FoodCheckin>();

        if (!food) {
            return errorResponse('记录不存在', 404);
        }

        return jsonResponse({
            ...food,
            images: food.images ? food.images.split(',') : [],
            recommended_dishes: food.recommended_dishes ? food.recommended_dishes.split(',') : []
        });
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}

/**
 * 更新美食记录
 */
export async function onRequestPut(context: { request: Request; env: Env }) {
    const { request, env } = context;

    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').filter(Boolean).pop();
        const foodId = parseInt(id || '');

        if (isNaN(foodId)) {
            return errorResponse('无效的ID', 400);
        }

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
            images
        } = body;

        const currentFood = await env.DB.prepare(`SELECT * FROM food_checkins WHERE id = ?`).bind(foodId).first<FoodCheckin>();
        if (!currentFood) {
            return errorResponse('记录不存在', 404);
        }

        await env.DB.prepare(`
            UPDATE food_checkins SET 
                restaurant_name = ?, 
                description = ?, 
                date = ?, 
                address = ?, 
                cuisine = ?, 
                price_range = ?,
                overall_rating = ?,
                taste_rating = ?,
                environment_rating = ?,
                service_rating = ?,
                recommended_dishes = ?,
                images = ?,
                updated_at = datetime('now') 
            WHERE id = ?
        `).bind(
            restaurant_name !== undefined ? restaurant_name : currentFood.restaurant_name,
            description !== undefined ? description : currentFood.description,
            date !== undefined ? date : currentFood.date,
            address !== undefined ? address : currentFood.address,
            cuisine !== undefined ? cuisine : currentFood.cuisine,
            price_range !== undefined ? price_range : currentFood.price_range,
            overall_rating !== undefined ? overall_rating : currentFood.overall_rating,
            taste_rating !== undefined ? taste_rating : currentFood.taste_rating,
            environment_rating !== undefined ? environment_rating : currentFood.environment_rating,
            service_rating !== undefined ? service_rating : currentFood.service_rating,
            recommended_dishes !== undefined ? (Array.isArray(recommended_dishes) ? recommended_dishes.join(',') : recommended_dishes) : currentFood.recommended_dishes,
            images !== undefined ? (Array.isArray(images) ? images.join(',') : images) : currentFood.images,
            foodId
        ).run();

        const updatedFood = await env.DB.prepare(`SELECT * FROM food_checkins WHERE id = ?`).bind(foodId).first<FoodCheckin>();

        return jsonResponse({
            ...updatedFood,
            images: updatedFood?.images ? updatedFood.images.split(',') : [],
            recommended_dishes: updatedFood?.recommended_dishes ? updatedFood.recommended_dishes.split(',') : []
        });
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}

/**
 * 删除美食记录
 */
export async function onRequestDelete(context: { env: Env; request: Request }) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').filter(Boolean).pop();
        const foodId = parseInt(id || '');

        if (isNaN(foodId)) {
            return errorResponse('无效的ID', 400);
        }

        await env.DB.prepare('DELETE FROM food_checkins WHERE id = ?').bind(foodId).run();

        return jsonResponse({ success: true, message: '记录已删除' });
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}

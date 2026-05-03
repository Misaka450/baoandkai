import { jsonResponse } from '../../utils/response';
import { transformImageArray, serializeImages } from '../../utils/url';
import { extractIdFromUrl, findOrThrow, validateAndSanitize, handleCrudError } from '../../utils/crud';
import { validateDate, validateRating } from '../../utils/validation';

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

// GET /api/food/:id — 获取单个美食记录
export async function onRequestGet(context: { env: Env; request: Request }) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const foodId = extractIdFromUrl(url);

        const food = await findOrThrow<FoodCheckin>(env.DB, 'food_checkins', foodId);

        return jsonResponse({
            ...food,
            images: transformImageArray(food.images),
            recommended_dishes: food.recommended_dishes ? food.recommended_dishes.split(',') : []
        });
    } catch (error: unknown) {
        return handleCrudError(error);
    }
}

// PUT /api/food/:id — 更新美食记录
export async function onRequestPut(context: { request: Request; env: Env }) {
    const { request, env } = context;

    try {
        const url = new URL(request.url);
        const foodId = extractIdFromUrl(url);

        const currentFood = await findOrThrow<FoodCheckin>(env.DB, 'food_checkins', foodId);

        const body = await request.json() as Record<string, unknown>;
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

        // 仅验证用户实际传入的字段
        const fieldsToValidate: Array<{ name: string; label: string; maxLength?: number }> = [];
        if (restaurant_name !== undefined) fieldsToValidate.push({ name: 'restaurant_name', label: '餐厅名称', maxLength: 100 });
        if (date !== undefined) fieldsToValidate.push({ name: 'date', label: '日期' });

        const sanitized = validateAndSanitize(
            { restaurant_name, description, address, cuisine, price_range, recommended_dishes },
            fieldsToValidate,
            ['images']
        );

        // 日期格式校验
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
            recommended_dishes !== undefined ? (Array.isArray(sanitized.recommended_dishes) ? sanitized.recommended_dishes.join(',') : sanitized.recommended_dishes) : currentFood.recommended_dishes,
            images !== undefined ? serializeImages(images) : currentFood.images,
            foodId
        ).run();

        const updatedFood = await env.DB.prepare('SELECT * FROM food_checkins WHERE id = ?')
            .bind(foodId).first<FoodCheckin>();

        return jsonResponse({
            ...updatedFood,
            images: transformImageArray(updatedFood?.images),
            recommended_dishes: updatedFood?.recommended_dishes ? updatedFood.recommended_dishes.split(',') : []
        });
    } catch (error: unknown) {
        return handleCrudError(error);
    }
}

// DELETE /api/food/:id — 删除美食记录
export async function onRequestDelete(context: { env: Env; request: Request }) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const foodId = extractIdFromUrl(url);

        const result = await env.DB.prepare('DELETE FROM food_checkins WHERE id = ?')
            .bind(foodId).run();

        if (result.meta.changes === 0) {
            return jsonResponse({ success: false, message: '记录不存在' }, 404);
        }

        return jsonResponse({ success: true, message: '记录已删除' });
    } catch (error: unknown) {
        return handleCrudError(error);
    }
}

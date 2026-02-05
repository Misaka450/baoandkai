import { jsonResponse, errorResponse } from '../../utils/response';

export interface Env {
    DB: D1Database;
}

/**
 * 批量更新美食排序
 */
export async function onRequestPost(context: { request: Request; env: Env }) {
    const { request, env } = context;

    try {
        const items: { id: number; sort_order: number }[] = await request.json();

        if (!Array.isArray(items)) {
            return errorResponse('无效的数据格式', 400);
        }

        // 批量更新排序
        const statements = items.map(item =>
            env.DB.prepare('UPDATE food_checkins SET sort_order = ? WHERE id = ?')
                .bind(item.sort_order, item.id)
        );

        await env.DB.batch(statements);

        return jsonResponse({ success: true, message: '排序更新成功' });
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}

import { jsonResponse, errorResponse } from '../../../../utils/response';

export interface Env {
    DB: D1Database;
}

interface ReorderItem {
    id: number;
    sort_order: number;
}

/**
 * 批量更新照片顺序
 * POST /api/albums/[id]/photos/reorder
 */
export async function onRequestPost(context: { env: Env; request: Request }) {
    const { env, request } = context;

    try {
        const url = new URL(request.url);
        const parts = url.pathname.split('/').filter(Boolean);
        // parts = ['api', 'albums', '1', 'photos', 'reorder']
        const albumId = parseInt(parts[2] || '');

        if (isNaN(albumId)) {
            return errorResponse('无效的相册ID', 400);
        }

        const items = await request.json() as ReorderItem[];

        if (!Array.isArray(items) || items.length === 0) {
            return errorResponse('无效的排序数据', 400);
        }

        // 使用 D1 的 batch 执行批量更新
        const stmts = items.map(item =>
            env.DB.prepare('UPDATE photos SET sort_order = ? WHERE id = ? AND album_id = ?')
                .bind(item.sort_order, item.id, albumId)
        );

        await env.DB.batch(stmts);

        return jsonResponse({ success: true, message: '顺序更新成功' });
    } catch (error: any) {
        console.error('更新照片顺序失败:', error);
        return errorResponse(error.message, 500);
    }
}

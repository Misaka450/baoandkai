import { jsonResponse, errorResponse } from '../../utils/response'

export interface Env {
    DB: D1Database
}

interface TimeCapsule {
    id: number
    title: string | null
    message: string
    unlock_date: string
    is_unlocked: number
    created_by: string
    created_at: string
    updated_at: string
}

/**
 * DELETE /api/time-capsules/:id
 * 删除时间胶囊（认证由中间件处理）
 */
export async function onRequestDelete(context: { env: Env; request: Request }): Promise<Response> {
    const { env, request } = context

    try {
        // 从URL路径中提取ID
        const url = new URL(request.url)
        const id = parseInt(url.pathname.split('/').filter(Boolean).pop() || '')

        if (isNaN(id)) {
            return errorResponse('无效的ID', 400)
        }

        // 先检查是否存在
        const existing = await env.DB.prepare(`
            SELECT id FROM time_capsules WHERE id = ?
        `).bind(id).first()

        if (!existing) {
            return errorResponse('时间胶囊不存在', 404)
        }

        // 删除时间胶囊
        await env.DB.prepare(`
            DELETE FROM time_capsules WHERE id = ?
        `).bind(id).run()

        return jsonResponse({ success: true, message: '时间胶囊已删除' })
    } catch (error: any) {
        console.error('删除时间胶囊失败:', error)
        return errorResponse('删除时间胶囊失败: ' + error.message, 500)
    }
}

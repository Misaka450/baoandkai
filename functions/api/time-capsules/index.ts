import { jsonResponse, errorResponse } from '../../utils/response'
import { parsePagination, buildPaginatedResponse } from '../../utils/pagination'

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
 * GET /api/time-capsules
 * 获取时间胶囊列表（支持分页，认证由中间件处理）
 */
export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
    const { env, request } = context

    try {
        const url = new URL(request.url)
        const pagination = parsePagination(url)

        const countResult = await env.DB.prepare('SELECT COUNT(*) as total FROM time_capsules').first<{ total: number }>()
        const total = countResult?.total || 0

        const result = await env.DB.prepare(`
            SELECT id, title, message, unlock_date, is_unlocked, created_by, created_at, updated_at
            FROM time_capsules
            ORDER BY unlock_date ASC
            LIMIT ? OFFSET ?
        `).bind(pagination.pageSize, pagination.offset).all<TimeCapsule>()

        const capsules = result.results || []

        // 批量检查并解锁到期的胶囊
        const now = new Date().toISOString().split('T')[0] || ''
        const toUnlock = capsules.filter(c => c.unlock_date <= now && c.is_unlocked === 0)

        if (toUnlock.length > 0) {
            const statements = toUnlock.map(c =>
                env.DB.prepare(`
                    UPDATE time_capsules
                    SET is_unlocked = 1, updated_at = datetime('now')
                    WHERE id = ?
                `).bind(c.id)
            )
            await env.DB.batch(statements)

            toUnlock.forEach(c => { c.is_unlocked = 1 })
        }

        return jsonResponse(buildPaginatedResponse(capsules, total, pagination))
    } catch (error: any) {
        console.error('获取时间胶囊失败:', error)
        return errorResponse('获取时间胶囊失败: ' + error.message, 500)
    }
}

/**
 * POST /api/time-capsules
 * 创建新的时间胶囊（认证由中间件处理）
 */
export async function onRequestPost(context: { env: Env; request: Request; data: any }): Promise<Response> {
    const { env, request } = context

    try {
        let body: any
        try {
            body = await request.json()
        } catch {
            return errorResponse('请求格式错误: 无效的JSON格式', 400)
        }

        const { title, message, unlock_date } = body || {}

        // 验证必填字段
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return errorResponse('留言内容不能为空', 400)
        }

        if (!unlock_date) {
            return errorResponse('解锁日期不能为空', 400)
        }

        // 验证解锁日期必须是未来的日期
        const unlockDate = new Date(unlock_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (isNaN(unlockDate.getTime())) {
            return errorResponse('解锁日期格式无效', 400)
        }

        if (unlockDate <= today) {
            return errorResponse('解锁日期必须是未来的日期', 400)
        }

        // 插入时间胶囊
        const result = await env.DB.prepare(`
            INSERT INTO time_capsules (title, message, unlock_date, is_unlocked, created_by, created_at, updated_at)
            VALUES (?, ?, ?, 0, 'couple', datetime('now'), datetime('now'))
        `).bind(
            title || null,
            message.trim(),
            unlock_date
        ).run()

        // 查询刚创建的记录返回给前端
        const newCapsule = await env.DB.prepare(`
            SELECT id, title, message, unlock_date, is_unlocked, created_by, created_at, updated_at
            FROM time_capsules WHERE id = ?
        `).bind(result.meta.last_row_id).first<TimeCapsule>()

        if (!newCapsule) {
            return errorResponse('创建时间胶囊失败', 500)
        }

        return jsonResponse({ data: newCapsule }, 201)
    } catch (error: any) {
        console.error('创建时间胶囊失败:', error)
        return errorResponse('创建时间胶囊失败: ' + error.message, 500)
    }
}

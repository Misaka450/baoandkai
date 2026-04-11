import { getDB } from '../../utils/db'
import { jsonResponse, errorResponse } from '../../utils/response'
import jwt from '@tsndr/cloudflare-worker-jwt'

export interface TimeCapsule {
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
 * GET /time-capsules/:id
 * 获取单个时间胶囊
 */
export async function onRequestGet({ env, params, request }: { env: Env; params: { id: string }; request: Request }): Promise<Response> {
  try {
    const db = getDB(env)

    // 验证 token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401)
    }

    const token = authHeader.split(' ')[1]
    const isValid = await jwt.verify(token, env.JWT_SECRET)
    if (!isValid) {
      return errorResponse('Invalid token', 401)
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return errorResponse('Invalid ID', 400)
    }

    // 查询时间胶囊
    const result = await db
      .select('id', 'title', 'message', 'unlock_date', 'is_unlocked', 'created_by', 'created_at', 'updated_at')
      .from('time_capsules')
      .where('id', '=', id)
      .run()

    if (result.results.length === 0) {
      return errorResponse('Time capsule not found', 404)
    }

    const capsule: TimeCapsule = result.results[0]

    // 检查是否应该解锁
    const now = new Date().toISOString().split('T')[0]
    if (capsule.unlock_date <= now && capsule.is_unlocked === 0) {
      // 更新胶囊状态为已解锁
      await db
        .update('time_capsules')
        .set({ is_unlocked: 1, updated_at: new Date().toISOString() })
        .where('id', '=', id)
        .run()
      
      capsule.is_unlocked = 1
    }

    return jsonResponse({ data: capsule })
  } catch (error) {
    console.error('Error fetching time capsule:', error)
    return errorResponse('Failed to fetch time capsule', 500)
  }
}

/**
 * DELETE /time-capsules/:id
 * 删除时间胶囊
 */
export async function onRequestDelete({ env, params, request }: { env: Env; params: { id: string }; request: Request }): Promise<Response> {
  try {
    const db = getDB(env)

    // 验证 token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401)
    }

    const token = authHeader.split(' ')[1]
    const isValid = await jwt.verify(token, env.JWT_SECRET)
    if (!isValid) {
      return errorResponse('Invalid token', 401)
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return errorResponse('Invalid ID', 400)
    }

    // 删除时间胶囊
    await db
      .delete()
      .from('time_capsules')
      .where('id', '=', id)
      .run()

    return jsonResponse({ message: 'Time capsule deleted successfully' })
  } catch (error) {
    console.error('Error deleting time capsule:', error)
    return errorResponse('Failed to delete time capsule', 500)
  }
}

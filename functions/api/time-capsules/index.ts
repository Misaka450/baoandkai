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
 * GET /time-capsules
 * 获取所有时间胶囊
 */
export async function onRequestGet({ env, request }: { env: Env; request: Request }): Promise<Response> {
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

    // 查询所有时间胶囊
    const result = await db
      .select('id', 'title', 'message', 'unlock_date', 'is_unlocked', 'created_by', 'created_at', 'updated_at')
      .from('time_capsules')
      .orderBy('unlock_date', 'asc')

    const capsules: TimeCapsule[] = result.results || []

    // 检查是否有胶囊应该解锁
    const now = new Date().toISOString().split('T')[0]
    for (const capsule of capsules) {
      if (capsule.unlock_date <= now && capsule.is_unlocked === 0) {
        // 更新胶囊状态为已解锁
        await db
          .update('time_capsules')
          .set({ is_unlocked: 1, updated_at: new Date().toISOString() })
          .where('id', '=', capsule.id)
          .run()
      }
    }

    return jsonResponse({ data: capsules })
  } catch (error) {
    console.error('Error fetching time capsules:', error)
    return errorResponse('Failed to fetch time capsules', 500)
  }
}

/**
 * POST /time-capsules
 * 创建新的时间胶囊
 */
export async function onRequestPost({ env, request }: { env: Env; request: Request }): Promise<Response> {
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

    // 解析请求体
    const body = await request.json()
    const { title, message, unlock_date } = body

    // 验证必填字段
    if (!message) {
      return errorResponse('Message is required', 400)
    }

    if (!unlock_date) {
      return errorResponse('Unlock date is required', 400)
    }

    // 验证解锁日期必须是未来的日期
    const unlockDate = new Date(unlock_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (unlockDate <= today) {
      return errorResponse('Unlock date must be in the future', 400)
    }

    // 插入时间胶囊
    const result = await db
      .insert('time_capsules')
      .values({
        title: title || null,
        message,
        unlock_date,
        is_unlocked: 0,
        created_by: 'couple',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .returning({
        id: 'id',
        title: 'title',
        message: 'message',
        unlock_date: 'unlock_date',
        is_unlocked: 'is_unlocked',
        created_by: 'created_by',
        created_at: 'created_at',
        updated_at: 'updated_at'
      })
      .run()

    const capsule: TimeCapsule = result.results[0]

    return jsonResponse({ data: capsule }, 201)
  } catch (error) {
    console.error('Error creating time capsule:', error)
    return errorResponse('Failed to create time capsule', 500)
  }
}

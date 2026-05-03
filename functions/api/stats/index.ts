import { jsonResponse, errorResponse } from '../../utils/response';

export interface Env {
    DB: D1Database;
    KV?: KVNamespace;
}

const CACHE_KEY = 'stats:dashboard';
const CACHE_TTL = 300; // 缓存5分钟

/**
 * 管理后台数据统计API
 * 提供数据总览、活跃度趋势、分类分布等统计信息
 * 使用KV缓存减少数据库查询压力
 */
export async function onRequestGet(context: { env: Env }) {
    const { env } = context;

    try {
        // 尝试从KV缓存读取
        if (env.KV) {
            const cached = await env.KV.get(CACHE_KEY, { type: 'json' });
            if (cached) {
                return jsonResponse({ ...cached as object, cached: true });
            }
        }

        // 并行执行所有统计查询，提升响应速度
        const [
            photoCount,
            albumCount,
            timelineCount,
            foodCount,
            mapCount,
            todoCount,
            todoCompletedCount,
            capsuleCount,
            capsuleUnlockedCount,
            noteCount,
            recentPhotos,
            monthlyActivity,
            cuisineDistribution,
            provinceDistribution,
            categoryDistribution,
        ] = await Promise.all([
            env.DB.prepare('SELECT COUNT(*) as count FROM photos').first<{ count: number }>(),
            env.DB.prepare('SELECT COUNT(*) as count FROM albums').first<{ count: number }>(),
            env.DB.prepare('SELECT COUNT(*) as count FROM timeline_events').first<{ count: number }>(),
            env.DB.prepare('SELECT COUNT(*) as count FROM food_checkins').first<{ count: number }>(),
            env.DB.prepare('SELECT COUNT(*) as count FROM map_checkins').first<{ count: number }>(),
            env.DB.prepare('SELECT COUNT(*) as count FROM todos').first<{ count: number }>(),
            env.DB.prepare("SELECT COUNT(*) as count FROM todos WHERE status = 'completed'").first<{ count: number }>(),
            env.DB.prepare('SELECT COUNT(*) as count FROM time_capsules').first<{ count: number }>(),
            env.DB.prepare('SELECT COUNT(*) as count FROM time_capsules WHERE is_unlocked = 1').first<{ count: number }>(),
            env.DB.prepare('SELECT COUNT(*) as count FROM notes').first<{ count: number }>(),
            env.DB.prepare(
                "SELECT COUNT(*) as count FROM photos WHERE created_at >= datetime('now', '-7 days')"
            ).first<{ count: number }>(),
            env.DB.prepare(`
                SELECT 
                    strftime('%Y-%m', date) as month,
                    'timeline' as type,
                    COUNT(*) as count
                FROM timeline_events 
                WHERE date >= date('now', '-12 months')
                GROUP BY month
                UNION ALL
                SELECT 
                    strftime('%Y-%m', date) as month,
                    'food' as type,
                    COUNT(*) as count
                FROM food_checkins 
                WHERE date >= date('now', '-12 months')
                GROUP BY month
                UNION ALL
                SELECT 
                    strftime('%Y-%m', date) as month,
                    'map' as type,
                    COUNT(*) as count
                FROM map_checkins 
                WHERE date >= date('now', '-12 months')
                GROUP BY month
                ORDER BY month ASC
            `).all<{ month: string; type: string; count: number }>(),
            env.DB.prepare(`
                SELECT cuisine, COUNT(*) as count 
                FROM food_checkins 
                WHERE cuisine IS NOT NULL AND cuisine != ''
                GROUP BY cuisine 
                ORDER BY count DESC
            `).all<{ cuisine: string; count: number }>(),
            env.DB.prepare(`
                SELECT province, COUNT(*) as count 
                FROM map_checkins 
                GROUP BY province 
                ORDER BY count DESC
            `).all<{ province: string; count: number }>(),
            env.DB.prepare(`
                SELECT COALESCE(category, '未分类') as category, COUNT(*) as count 
                FROM timeline_events 
                GROUP BY category 
                ORDER BY count DESC
            `).all<{ category: string; count: number }>(),
        ]);

        // 计算总打卡数（地图+美食）
        const totalCheckins = (mapCount?.count || 0) + (foodCount?.count || 0);

        // 处理月度活跃度数据，合并为统一格式
        const activityByMonth: Record<string, { timeline: number; food: number; map: number; total: number }> = {};
        for (const row of monthlyActivity.results) {
            if (!activityByMonth[row.month]) {
                activityByMonth[row.month] = { timeline: 0, food: 0, map: 0, total: 0 };
            }
            const monthStats = activityByMonth[row.month];
            if (!monthStats) continue;
            monthStats[row.type as 'timeline' | 'food' | 'map'] = row.count;
            monthStats.total += row.count;
        }

        const result = {
            overview: {
                photos: photoCount?.count || 0,
                albums: albumCount?.count || 0,
                timeline: timelineCount?.count || 0,
                food: foodCount?.count || 0,
                map: mapCount?.count || 0,
                checkins: totalCheckins,
                todos: todoCount?.count || 0,
                todosCompleted: todoCompletedCount?.count || 0,
                capsules: capsuleCount?.count || 0,
                capsulesUnlocked: capsuleUnlockedCount?.count || 0,
                notes: noteCount?.count || 0,
                recentPhotos: recentPhotos?.count || 0,
            },
            activityTrend: activityByMonth,
            cuisineDistribution: cuisineDistribution.results,
            provinceDistribution: provinceDistribution.results,
            categoryDistribution: categoryDistribution.results,
        };

        // 写入KV缓存
        if (env.KV) {
            await env.KV.put(CACHE_KEY, JSON.stringify(result), { expirationTtl: CACHE_TTL });
        }

        return jsonResponse(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '未知错误';
        return errorResponse(message, 500);
    }
}

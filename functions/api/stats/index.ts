import { jsonResponse, errorResponse } from '../../utils/response';

export interface Env {
    DB: D1Database;
}

/**
 * 管理后台数据统计API
 * 提供数据总览、活跃度趋势、分类分布等统计信息
 */
export async function onRequestGet(context: { env: Env }) {
    const { env } = context;

    try {
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
            // 照片总数
            env.DB.prepare('SELECT COUNT(*) as count FROM photos').first<{ count: number }>(),
            // 相册总数
            env.DB.prepare('SELECT COUNT(*) as count FROM albums').first<{ count: number }>(),
            // 时间轴事件总数
            env.DB.prepare('SELECT COUNT(*) as count FROM timeline_events').first<{ count: number }>(),
            // 美食打卡总数
            env.DB.prepare('SELECT COUNT(*) as count FROM food_checkins').first<{ count: number }>(),
            // 地图打卡总数
            env.DB.prepare('SELECT COUNT(*) as count FROM map_checkins').first<{ count: number }>(),
            // 待办事项总数
            env.DB.prepare('SELECT COUNT(*) as count FROM todos').first<{ count: number }>(),
            // 已完成待办数
            env.DB.prepare("SELECT COUNT(*) as count FROM todos WHERE status = 'completed'").first<{ count: number }>(),
            // 时光胶囊总数
            env.DB.prepare('SELECT COUNT(*) as count FROM time_capsules').first<{ count: number }>(),
            // 已解锁时光胶囊数
            env.DB.prepare('SELECT COUNT(*) as count FROM time_capsules WHERE is_unlocked = 1').first<{ count: number }>(),
            // 便签总数
            env.DB.prepare('SELECT COUNT(*) as count FROM notes').first<{ count: number }>(),
            // 最近7天新增照片数
            env.DB.prepare(
                "SELECT COUNT(*) as count FROM photos WHERE created_at >= datetime('now', '-7 days')"
            ).first<{ count: number }>(),
            // 最近12个月的活跃度（每月各类内容新增数量）
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
            // 美食菜系分布
            env.DB.prepare(`
                SELECT cuisine, COUNT(*) as count 
                FROM food_checkins 
                WHERE cuisine IS NOT NULL AND cuisine != ''
                GROUP BY cuisine 
                ORDER BY count DESC
            `).all<{ cuisine: string; count: number }>(),
            // 打卡省份分布
            env.DB.prepare(`
                SELECT province, COUNT(*) as count 
                FROM map_checkins 
                GROUP BY province 
                ORDER BY count DESC
            `).all<{ province: string; count: number }>(),
            // 时间轴分类分布
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
            activityByMonth[row.month][row.type as 'timeline' | 'food' | 'map'] = row.count;
            activityByMonth[row.month].total += row.count;
        }

        return jsonResponse({
            // 核心数据总览
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
            // 月度活跃度趋势
            activityTrend: activityByMonth,
            // 美食菜系分布
            cuisineDistribution: cuisineDistribution.results,
            // 打卡省份分布
            provinceDistribution: provinceDistribution.results,
            // 时间轴分类分布
            categoryDistribution: categoryDistribution.results,
        });
    } catch (error: any) {
        return errorResponse(error.message, 500);
    }
}

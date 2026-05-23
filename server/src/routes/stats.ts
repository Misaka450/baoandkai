import { Hono } from 'hono';
import { jsonResponse, errorResponse } from '../utils/response.js';
import { cache } from '../lib/cache.js';
import { pool } from '../lib/db.js';

const stats = new Hono();

const CACHE_KEY = 'stats:dashboard';
const CACHE_TTL = 300; // 缓存5分钟

/**
 * GET /api/stats
 * 管理后台数据统计API
 */
stats.get('/', async (c) => {
  try {
    // 尝试从缓存读取
    const cached = await cache.get<any>(CACHE_KEY);
    if (cached) {
      return jsonResponse({ ...cached, cached: true });
    }

    // 并行执行所有统计查询
    const [
      photoCountRes,
      albumCountRes,
      timelineCountRes,
      foodCountRes,
      mapCountRes,
      todoCountRes,
      todoCompletedCountRes,
      capsuleCountRes,
      capsuleUnlockedCountRes,
      noteCountRes,
      recentPhotosRes,
      monthlyActivityRes,
      cuisineDistributionRes,
      provinceDistributionRes,
      categoryDistributionRes,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*)::int as count FROM photos'),
      pool.query('SELECT COUNT(*)::int as count FROM albums'),
      pool.query('SELECT COUNT(*)::int as count FROM timeline_events'),
      pool.query('SELECT COUNT(*)::int as count FROM food_checkins'),
      pool.query('SELECT COUNT(*)::int as count FROM map_checkins'),
      pool.query('SELECT COUNT(*)::int as count FROM todos'),
      pool.query("SELECT COUNT(*)::int as count FROM todos WHERE status = 'completed'"),
      pool.query('SELECT COUNT(*)::int as count FROM time_capsules'),
      pool.query('SELECT COUNT(*)::int as count FROM time_capsules WHERE is_unlocked = 1'),
      pool.query('SELECT COUNT(*)::int as count FROM notes'),
      pool.query("SELECT COUNT(*)::int as count FROM photos WHERE created_at >= NOW() - INTERVAL '7 days'"),
      
      // 12 个月内趋势查询
      pool.query(`
        SELECT 
            SUBSTRING(date FROM 1 FOR 7) as month,
            'timeline' as type,
            COUNT(*)::int as count
        FROM timeline_events 
        WHERE date >= TO_CHAR(NOW() - INTERVAL '12 months', 'YYYY-MM-DD')
        GROUP BY month
        UNION ALL
        SELECT 
            SUBSTRING(date FROM 1 FOR 7) as month,
            'food' as type,
            COUNT(*)::int as count
        FROM food_checkins 
        WHERE date >= TO_CHAR(NOW() - INTERVAL '12 months', 'YYYY-MM-DD')
        GROUP BY month
        UNION ALL
        SELECT 
            SUBSTRING(date FROM 1 FOR 7) as month,
            'map' as type,
            COUNT(*)::int as count
        FROM map_checkins 
        WHERE date >= TO_CHAR(NOW() - INTERVAL '12 months', 'YYYY-MM-DD')
        GROUP BY month
        ORDER BY month ASC
      `),
      
      pool.query(`
        SELECT cuisine, COUNT(*)::int as count 
        FROM food_checkins 
        WHERE cuisine IS NOT NULL AND cuisine != ''
        GROUP BY cuisine 
        ORDER BY count DESC
      `),
      pool.query(`
        SELECT province, COUNT(*)::int as count 
        FROM map_checkins 
        GROUP BY province 
        ORDER BY count DESC
      `),
      pool.query(`
        SELECT COALESCE(category, '未分类') as category, COUNT(*)::int as count 
        FROM timeline_events 
        GROUP BY category 
        ORDER BY count DESC
      `),
    ]);

    const photoCount = photoCountRes.rows[0]?.count || 0;
    const albumCount = albumCountRes.rows[0]?.count || 0;
    const timelineCount = timelineCountRes.rows[0]?.count || 0;
    const foodCount = foodCountRes.rows[0]?.count || 0;
    const mapCount = mapCountRes.rows[0]?.count || 0;
    const todoCount = todoCountRes.rows[0]?.count || 0;
    const todoCompletedCount = todoCompletedCountRes.rows[0]?.count || 0;
    const capsuleCount = capsuleCountRes.rows[0]?.count || 0;
    const capsuleUnlockedCount = capsuleUnlockedCountRes.rows[0]?.count || 0;
    const noteCount = noteCountRes.rows[0]?.count || 0;
    const recentPhotos = recentPhotosRes.rows[0]?.count || 0;

    // 计算总打卡数
    const totalCheckins = mapCount + foodCount;

    // 合并月度活跃度数据
    const activityByMonth: Record<string, { timeline: number; food: number; map: number; total: number }> = {};
    for (const row of monthlyActivityRes.rows) {
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
        photos: photoCount,
        albums: albumCount,
        timeline: timelineCount,
        food: foodCount,
        map: mapCount,
        checkins: totalCheckins,
        todos: todoCount,
        todosCompleted: todoCompletedCount,
        capsules: capsuleCount,
        capsulesUnlocked: capsuleUnlockedCount,
        notes: noteCount,
        recentPhotos: recentPhotos,
      },
      activityTrend: activityByMonth,
      cuisineDistribution: cuisineDistributionRes.rows,
      provinceDistribution: provinceDistributionRes.rows,
      categoryDistribution: categoryDistributionRes.rows,
    };

    // 写入缓存
    await cache.set(CACHE_KEY, result, CACHE_TTL);

    return jsonResponse(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error('统计查询失败:', error);
    return errorResponse(message, 500);
  }
});

export default stats;

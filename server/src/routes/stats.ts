import { Hono } from 'hono';
import { jsonResponse, errorResponse } from '../utils/response.js';
import { cache } from '../lib/cache.js';
import { pool } from '../lib/db.js';

const stats = new Hono();

const CACHE_KEY = 'stats:dashboard';
const CACHE_TTL = 900; // 缓存15分钟（统计页面数据更新不频繁）

/**
 * GET /api/stats
 * 管理后台数据统计API
 */
stats.get('/', async (_c) => {
  try {
    // 尝试从缓存读取
    const cached = await cache.get<any>(CACHE_KEY);
    if (cached) {
      return jsonResponse({ ...cached, cached: true });
    }

    // 并行执行统计聚合查询（基础指标由 11 个独立请求合并为 1 个单次聚合查询，大幅降低连接池竞争）
    const [
      overviewRes,
      monthlyActivityRes,
      cuisineDistributionRes,
      provinceDistributionRes,
      categoryDistributionRes,
    ] = await Promise.all([
      pool.query(`
        SELECT
          (SELECT COUNT(*)::int FROM photos) AS photos,
          (SELECT COUNT(*)::int FROM albums) AS albums,
          (SELECT COUNT(*)::int FROM timeline_events) AS timeline,
          (SELECT COUNT(*)::int FROM food_checkins) AS food,
          (SELECT COUNT(*)::int FROM map_checkins) AS map,
          (SELECT COUNT(*)::int FROM todos) AS todos,
          (SELECT COUNT(*)::int FROM todos WHERE status = 'completed') AS todos_completed,
          (SELECT COUNT(*)::int FROM time_capsules) AS capsules,
          (SELECT COUNT(*)::int FROM time_capsules WHERE is_unlocked = 1) AS capsules_unlocked,
          (SELECT COUNT(*)::int FROM notes) AS notes,
          (SELECT COUNT(*)::int FROM photos WHERE created_at >= NOW() - INTERVAL '7 days') AS recent_photos
      `),

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

    const overview = overviewRes.rows[0] || {};
    const totalCheckins = (overview.map || 0) + (overview.food || 0);

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
        photos: overview.photos || 0,
        albums: overview.albums || 0,
        timeline: overview.timeline || 0,
        food: overview.food || 0,
        map: overview.map || 0,
        checkins: totalCheckins,
        todos: overview.todos || 0,
        todosCompleted: overview.todos_completed || 0,
        capsules: overview.capsules || 0,
        capsulesUnlocked: overview.capsules_unlocked || 0,
        notes: overview.notes || 0,
        recentPhotos: overview.recent_photos || 0,
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

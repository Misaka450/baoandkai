import { Hono } from 'hono';
import { jsonResponse, errorResponse } from '../utils/response.js';
import { transformImageUrl } from '../utils/url.js';
import { hasXSS, sanitizeObject } from '../utils/validation.js';
import { pool } from '../lib/db.js';

const config = new Hono();

const ALLOWED_CONFIG_FIELDS = [
  'coupleName1', 'coupleName2', 'anniversaryDate',
  'homeTitle', 'homeSubtitle', 'avatar1', 'avatar2',
  'customAvatar1', 'customAvatar2'
];

const TEXT_FIELDS = ['coupleName1', 'coupleName2', 'homeTitle', 'homeSubtitle'];

function isLocalImageUrl(url: string): boolean {
  return url.startsWith('/uploads/') || url.startsWith('/api/images/');
}

/**
 * GET /api/config
 * 获取系统配置
 */
config.get('/', async (c) => {
  try {
    // 1. 优先从 settings 表获取完整配置
    const { rows: settingsRows } = await pool.query(
      "SELECT value FROM settings WHERE key = $1",
      ['site_config']
    );
    const configRow = settingsRows[0];

    if (configRow) {
      try {
        const parsedConfig = JSON.parse(configRow.value);
        return jsonResponse({
          ...parsedConfig,
          avatar1: transformImageUrl(parsedConfig.avatar1),
          avatar2: transformImageUrl(parsedConfig.avatar2),
          customAvatar1: transformImageUrl(parsedConfig.customAvatar1),
          customAvatar2: transformImageUrl(parsedConfig.customAvatar2)
        });
      } catch (e) {
        console.error('解析 settings 失败:', e);
      }
    }

    // 2. 备选方案：从 users 表获取核心信息
    const { rows: userRows } = await pool.query(
      `SELECT couple_name1, couple_name2, anniversary_date,
              home_title, home_subtitle, avatar1, avatar2
       FROM users WHERE id = 1`
    );
    const user = userRows[0];

    const avatar1 = transformImageUrl(user?.avatar1);
    const avatar2 = transformImageUrl(user?.avatar2);

    return jsonResponse({
      coupleName1: user?.couple_name1 || '包包',
      coupleName2: user?.couple_name2 || '恺恺',
      anniversaryDate: user?.anniversary_date || '2023-10-08',
      homeTitle: user?.home_title || '包包和恺恺的小窝',
      homeSubtitle: user?.home_subtitle || '遇见你，是银河赠予我的糖。',
      avatar1,
      avatar2,
      customAvatar1: avatar1 && !avatar1.startsWith('http') && isLocalImageUrl(avatar1) ? avatar1 : '',
      customAvatar2: avatar2 && !avatar2.startsWith('http') && isLocalImageUrl(avatar2) ? avatar2 : ''
    });
  } catch (error: unknown) {
    console.error('获取配置失败:', error);
    return errorResponse('获取配置失败', 500);
  }
});

/**
 * PUT /api/config
 * 更新系统配置
 */
config.put('/', async (c) => {
  const client = await pool.connect();
  try {
    const rawConfig = await c.req.json() as Record<string, unknown>;

    // 字段白名单过滤
    const filteredConfig: Record<string, unknown> = {};
    for (const field of ALLOWED_CONFIG_FIELDS) {
      if (field in rawConfig) {
        filteredConfig[field] = rawConfig[field];
      }
    }

    // XSS 检测文本字段
    for (const field of TEXT_FIELDS) {
      const value = filteredConfig[field];
      if (typeof value === 'string' && hasXSS(value)) {
        return errorResponse(`字段 ${field} 包含不安全字符`, 400);
      }
    }

    // 消毒文本字段
    const sanitized = sanitizeObject(filteredConfig, ['avatar1', 'avatar2', 'customAvatar1', 'customAvatar2']);

    await client.query('BEGIN');

    // 1. 更新 settings 表（UPSERT 语法）
    await client.query(
      `INSERT INTO settings (key, value, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (key) 
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      ['site_config', JSON.stringify(sanitized)]
    );

    // 2. 同步更新 users 表中的核心字段
    await client.query(
      `UPDATE users SET 
           couple_name1 = $1, 
           couple_name2 = $2, 
           anniversary_date = $3,
           home_title = $4,
           home_subtitle = $5,
           avatar1 = $6,
           avatar2 = $7,
           updated_at = NOW()
       WHERE id = 1`,
      [
        sanitized.coupleName1,
        sanitized.coupleName2,
        sanitized.anniversaryDate,
        sanitized.homeTitle,
        sanitized.homeSubtitle,
        sanitized.avatar1,
        sanitized.avatar2
      ]
    );

    await client.query('COMMIT');

    return jsonResponse({ success: true, message: '配置已更新' });
  } catch (error: unknown) {
    await client.query('ROLLBACK');
    console.error('更新配置失败:', error);
    return errorResponse('更新配置失败', 500);
  } finally {
    client.release();
  }
});

export default config;

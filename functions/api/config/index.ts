import { jsonResponse, errorResponse } from '../../utils/response';
import { transformImageUrl } from '../../utils/url';

export interface Env {
  DB: D1Database;
}

/**
 * 获取系统配置
 */
export async function onRequestGet(context: { env: Env }) {
  const { env } = context;

  try {
    // 1. 尝试从 settings 表获取核心配置
    const configRow = await env.DB.prepare('SELECT value FROM settings WHERE key = ?')
      .bind('site_config')
      .first<{ value: string }>();

    if (configRow) {
      try {
        const config = JSON.parse(configRow.value);
        return jsonResponse({
          ...config,
          avatar1: transformImageUrl(config.avatar1),
          avatar2: transformImageUrl(config.avatar2),
          customAvatar1: transformImageUrl(config.customAvatar1),
          customAvatar2: transformImageUrl(config.customAvatar2)
        });
      } catch (e) {
        console.error('解析 settings 失败:', e);
      }
    }

    // 2. 备选方案：从 users 表获取核心信息 (兼容旧版数据结构)
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = 1').first<any>();

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
      customAvatar1: avatar1.startsWith('/api/images/') ? avatar1 : '',
      customAvatar2: avatar2.startsWith('/api/images/') ? avatar2 : ''
    });
  } catch (error: any) {
    console.error('获取配置失败:', error);
    return errorResponse(error.message, 500);
  }
}

/**
 * 更新系统配置
 */
export async function onRequestPut(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const config: any = await request.json();

    // 1. 更新 settings 表 (持久化所有配置)
    await env.DB.prepare(`
            INSERT OR REPLACE INTO settings (key, value, updated_at)
            VALUES (?, ?, datetime('now'))
        `).bind('site_config', JSON.stringify(config)).run();

    // 2. 同步更新 users 表中存在的字段 (核心配置与基础信息)
    try {
      await env.DB.prepare(`
                UPDATE users SET 
                    couple_name1 = ?, 
                    couple_name2 = ?, 
                    anniversary_date = ?,
                    home_title = ?,
                    home_subtitle = ?,
                    avatar1 = ?,
                    avatar2 = ?,
                    updated_at = datetime('now')
                WHERE id = 1
            `).bind(
        config.coupleName1,
        config.coupleName2,
        config.anniversaryDate,
        config.homeTitle,
        config.homeSubtitle,
        config.avatar1,
        config.avatar2
      ).run();
    } catch (e) {
      console.warn('同步更新 users 表失败 (可能缺少列或字段不匹配):', e);
    }

    return jsonResponse({ success: true, message: '配置已更新' });
  } catch (error: any) {
    console.error('更新配置失败:', error);
    return errorResponse(error.message, 500);
  }
}
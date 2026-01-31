import { jsonResponse, errorResponse } from '../../utils/response';
import { transformImageUrl } from '../../utils/url';

export interface Env {
  DB: D1Database;
}

/**
 * 获取系统配置
 * 从 users 表获取核心配置信息
 */
export async function onRequestGet(context: { env: Env }) {
  const { env } = context;

  try {
    // 获取主用户信息中的配置 (ID 为 1 的用户通常是管理员/主用户)
    const userConfig = await env.DB.prepare(`
            SELECT couple_name1, couple_name2, anniversary_date, avatar1, avatar2, home_title, home_subtitle
            FROM users 
            WHERE id = 1
        `).first<any>();

    if (!userConfig) {
      // 如果找不到用户，返回默认值
      return jsonResponse({
        coupleName1: '包包',
        coupleName2: '恺恺',
        anniversaryDate: '2023-10-08',
        homeTitle: '包包和恺恺的小窝',
        homeSubtitle: '遇见你，是银河赠予我的糖。',
        avatar1: '',
        avatar2: ''
      });
    }

    return jsonResponse({
      coupleName1: userConfig.couple_name1,
      coupleName2: userConfig.couple_name2,
      anniversaryDate: userConfig.anniversary_date,
      homeTitle: userConfig.home_title || '包包和恺恺的小窝',
      homeSubtitle: userConfig.home_subtitle || '遇见你，是银河赠予我的糖。',
      avatar1: transformImageUrl(userConfig.avatar1),
      avatar2: transformImageUrl(userConfig.avatar2)
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
    const body: any = await request.json();
    const {
      coupleName1,
      coupleName2,
      anniversaryDate,
      homeTitle,
      homeSubtitle,
      avatar1,
      avatar2
    } = body;

    // 更新数据库中 ID 为 1 的用户配置
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
      coupleName1,
      coupleName2,
      anniversaryDate,
      homeTitle,
      homeSubtitle,
      avatar1,
      avatar2
    ).run();

    return jsonResponse({ success: true, message: '配置已更新' });
  } catch (error: any) {
    console.error('更新配置失败:', error);
    return errorResponse(error.message, 500);
  }
}
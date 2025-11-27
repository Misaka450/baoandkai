import { jsonResponse, errorResponse } from '../../utils/response';

// Cloudflare Pages Functions - 设置API
export async function onRequestGet(context) {
  const { env } = context;

  try {
    const settings = await env.DB.prepare(`
      SELECT * FROM settings WHERE key = 'site_config'
    `).first();

    if (!settings) {
      // 创建默认设置
      const defaultSettings = {
        site_name: '包包和恺恺的故事',
        site_description: '记录我们的点点滴滴',
        theme: 'light'
      };

      await env.DB.prepare(`
        INSERT INTO settings (key, value, created_at)
        VALUES ('site_config', ?, datetime('now'))
      `).bind(JSON.stringify(defaultSettings)).run();

      return jsonResponse(defaultSettings);
    }

    // 解析存储的JSON值
    const config = JSON.parse(settings.value);

    return jsonResponse(config);
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { site_name, site_description, theme } = body;

    const config = { site_name, site_description, theme };

    await env.DB.prepare(`
      UPDATE settings 
      SET value = ?, updated_at = datetime('now') 
      WHERE key = 'site_config'
    `).bind(JSON.stringify(config)).run();

    const updatedSettings = await env.DB.prepare(`
      SELECT * FROM settings WHERE key = 'site_config'
    `).first();

    const result = JSON.parse(updatedSettings.value);

    return jsonResponse(result);
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
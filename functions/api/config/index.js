// Cloudflare Pages Functions - 配置API (兼容旧版本)
export async function onRequestGet(context) {
  const { env } = context;

  try {
    // 从settings表中获取配置
    const settings = await env.DB.prepare(`
      SELECT * FROM settings WHERE key = 'site_config'
    `).first();

    if (!settings) {
      // 创建默认配置
      const defaultConfig = {
        coupleName1: '包包',
        coupleName2: '恺恺',
        anniversaryDate: '2023-10-08',
        site_name: '包包和恺恺的故事',
        site_description: '记录我们的点点滴滴',
        theme: 'light'
      };

      await env.DB.prepare(`
        INSERT INTO settings (key, value, created_at)
        VALUES ('site_config', ?, datetime('now'))
      `).bind(JSON.stringify(defaultConfig)).run();

      return new Response(JSON.stringify({
        coupleName1: '包包',
        coupleName2: '恺恺',
        anniversaryDate: '2023-10-08'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // 解析存储的JSON值并返回兼容格式
    const config = JSON.parse(settings.value);

    return new Response(JSON.stringify({
      coupleName1: config.coupleName1 || '包包',
      coupleName2: config.coupleName2 || '恺恺',
      anniversaryDate: config.anniversaryDate || '2023-10-08',
      homeTitle: config.homeTitle || '包包和恺恺的小窝',
      homeSubtitle: config.homeSubtitle || '遇见你，是银河赠予我的糖。',
      avatar1: config.avatar1 || '',
      avatar2: config.avatar2 || ''
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    // 返回默认配置
    return new Response(JSON.stringify({
      coupleName1: '包包',
      coupleName2: '恺恺',
      anniversaryDate: '2023-10-08'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { coupleName1, coupleName2, anniversaryDate } = body;

    // 获取现有配置
    const existing = await env.DB.prepare(`
      SELECT * FROM settings WHERE key = 'site_config'
    `).first();

    let config = {};
    if (existing) {
      config = JSON.parse(existing.value);
    }

    // 更新配置
    config.coupleName1 = coupleName1 || config.coupleName1 || '包包';
    config.coupleName2 = coupleName2 || config.coupleName2 || '恺恺';
    config.anniversaryDate = anniversaryDate || config.anniversaryDate || '2023-10-08';
    config.homeTitle = body.homeTitle || config.homeTitle || '包包和恺恺的小窝';
    config.homeSubtitle = body.homeSubtitle || config.homeSubtitle || '遇见你，是银河赠予我的糖。';
    // 头像字段支持空值（用于恢复默认）
    if (body.avatar1 !== undefined) config.avatar1 = body.avatar1;
    if (body.avatar2 !== undefined) config.avatar2 = body.avatar2;

    await env.DB.prepare(`
      UPDATE settings 
      SET value = ?, updated_at = datetime('now') 
      WHERE key = 'site_config'
    `).bind(JSON.stringify(config)).run();

    return new Response(JSON.stringify({
      coupleName1: config.coupleName1,
      coupleName2: config.coupleName2,
      anniversaryDate: config.anniversaryDate,
      homeTitle: config.homeTitle,
      homeSubtitle: config.homeSubtitle,
      avatar1: config.avatar1 || '',
      avatar2: config.avatar2 || ''
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
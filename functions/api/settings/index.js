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
      
      return new Response(JSON.stringify(defaultSettings), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 解析存储的JSON值
    const config = JSON.parse(settings.value);

    return new Response(JSON.stringify(config), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
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

    return new Response(JSON.stringify(result), {
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
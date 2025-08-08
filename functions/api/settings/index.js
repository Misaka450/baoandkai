// Cloudflare Pages Functions - 设置API
export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    const settings = await env.DB.prepare(`
      SELECT * FROM settings WHERE id = 1
    `).first();
    
    if (!settings) {
      // 创建默认设置
      const defaultSettings = {
        site_name: '包包和恺恺的故事',
        site_description: '记录我们的点点滴滴',
        theme: 'light'
      };
      
      await env.DB.prepare(`
        INSERT INTO settings (id, site_name, site_description, theme, created_at)
        VALUES (1, ?, ?, ?, datetime('now'))
      `).bind(
        defaultSettings.site_name, defaultSettings.site_description, defaultSettings.theme
      ).run();
      
      return new Response(JSON.stringify(defaultSettings), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    return new Response(JSON.stringify(settings), {
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
    
    await env.DB.prepare(`
      UPDATE settings 
      SET site_name = ?, site_description = ?, theme = ?, 
          updated_at = datetime('now') 
      WHERE id = 1
    `).bind(site_name, site_description, theme).run();
    
    const updatedSettings = await env.DB.prepare(`
      SELECT * FROM settings WHERE id = 1
    `).first();

    return new Response(JSON.stringify(updatedSettings), {
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
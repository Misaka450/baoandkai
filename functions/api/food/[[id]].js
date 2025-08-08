// Cloudflare Pages Functions - 美食打卡ID相关API
export async function onRequestPut(context) {
  const { request, env } = context;
  
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    const body = await request.json();
    const { 
      restaurant_name, 
      description, 
      date, 
      address, 
      cuisine, 
      price_range,
      overall_rating,
      taste_rating,
      environment_rating,
      service_rating,
      recommended_dishes,
      images = [] 
    } = body;
    
    if (!id || isNaN(id)) {
      return new Response(JSON.stringify({ error: '无效的ID' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!restaurant_name || !date) {
      return new Response(JSON.stringify({ error: '餐厅名称和日期不能为空' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await env.DB.prepare(`
      UPDATE food_checkins 
      SET restaurant_name = ?, description = ?, date = ?, address = ?, cuisine = ?, price_range = ?,
          overall_rating = ?, taste_rating = ?, environment_rating = ?, service_rating = ?,
          recommended_dishes = ?, images = ?, updated_at = datetime('now') 
      WHERE id = ?
    `).bind(
      restaurant_name, description || '', date, address || '', cuisine || '', price_range || '',
      overall_rating || 5, taste_rating || 5, environment_rating || 5, service_rating || 5,
      Array.isArray(recommended_dishes) ? recommended_dishes.join(',') : recommended_dishes || '',
      Array.isArray(images) ? images.join(',') : images, parseInt(id)
    ).run();
    
    if (result.changes === 0) {
      return new Response(JSON.stringify({ error: '记录不存在' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const updatedFood = await env.DB.prepare(`
      SELECT * FROM food_checkins WHERE id = ?
    `).bind(parseInt(id)).first();

    return new Response(JSON.stringify({
      ...updatedFood,
      images: updatedFood.images ? updatedFood.images.split(',') : []
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

export async function onRequestDelete(context) {
  const { env } = context;
  
  try {
    const url = new URL(context.request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id || isNaN(id)) {
      return new Response(JSON.stringify({ error: '无效的ID' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await env.DB.prepare('DELETE FROM food_checkins WHERE id = ?').bind(parseInt(id)).run();
    
    if (result.changes === 0) {
      return new Response(JSON.stringify({ error: '记录不存在' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ success: true, message: '删除成功' }), {
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
      'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
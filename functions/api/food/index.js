// Cloudflare Pages Functions - 美食API
export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    const foods = await env.DB.prepare(`
      SELECT * FROM food_checkins ORDER BY date DESC, created_at DESC
    `).all();
    
    const foodsWithImages = foods.results.map(food => ({
      ...food,
      images: food.images ? food.images.split(',') : []
    }));

    return new Response(JSON.stringify(foodsWithImages), {
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

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
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
    
    if (!restaurant_name || !date) {
      return new Response(JSON.stringify({ error: '餐厅名称和日期不能为空' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const result = await env.DB.prepare(`
      INSERT INTO food_checkins (
        restaurant_name, description, date, address, cuisine, price_range,
        overall_rating, taste_rating, environment_rating, service_rating,
        recommended_dishes, images, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      restaurant_name, description || '', date, address || '', cuisine || '', price_range || '',
      overall_rating || 5, taste_rating || 5, environment_rating || 5, service_rating || 5,
      Array.isArray(recommended_dishes) ? recommended_dishes.join(',') : recommended_dishes || '',
      Array.isArray(images) ? images.join(',') : images
    ).run();
    
    const foodId = result.meta.last_row_id;
    const newFood = await env.DB.prepare(`
        SELECT * FROM food_checkins WHERE id = ?
      `).bind(foodId).first();

    return new Response(JSON.stringify({
      ...newFood,
      images: newFood.images ? newFood.images.split(',') : []
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
    
    await env.DB.prepare(`
      UPDATE food_checkins 
      SET restaurant_name = ?, description = ?, date = ?, address = ?, cuisine = ?, price_range = ?,
          overall_rating = ?, taste_rating = ?, environment_rating = ?, service_rating = ?,
          recommended_dishes = ?, images = ?, updated_at = datetime('now') 
      WHERE id = ?
    `).bind(
      restaurant_name, description || '', date, address || '', cuisine || '', price_range || '',
      overall_rating || 5, taste_rating || 5, environment_rating || 5, service_rating || 5,
      Array.isArray(recommended_dishes) ? recommended_dishes.join(',') : recommended_dishes || '',
      Array.isArray(images) ? images.join(',') : images, id
    ).run();
    
    const updatedFood = await env.DB.prepare(`
      SELECT * FROM food_checkins WHERE id = ?
    `).bind(id).first();

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
    
    await env.DB.prepare('DELETE FROM food_checkins WHERE id = ?').bind(id).run();
    
    return new Response(JSON.stringify({ success: true }), {
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
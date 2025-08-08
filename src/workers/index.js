import { Router } from 'itty-router'

const router = Router()

// CORS处理
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// 处理OPTIONS请求
router.options('*', () => new Response(null, { headers: corsHeaders }))

// 配置相关API
router.get('/api/config', async (request, env) => {
  try {
    const result = await env.DB.prepare('SELECT * FROM users LIMIT 1').first()
    if (!result) {
      return new Response(JSON.stringify({
        coupleName1: '包包',
        coupleName2: '恺恺',
        anniversaryDate: '2024-01-01',
        backgroundImage: null
      }), { headers: corsHeaders })
    }

    return new Response(JSON.stringify({
      coupleName1: result.couple_name1,
      coupleName2: result.couple_name2,
      anniversaryDate: result.anniversary_date,
      backgroundImage: result.background_image
    }), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})

router.post('/api/config', async (request, env) => {
  try {
    const body = await request.json()
    const { coupleName1, coupleName2, anniversaryDate, backgroundImage } = body

    await env.DB.prepare(`
      INSERT OR REPLACE INTO users (id, username, password_hash, email, couple_name1, couple_name2, anniversary_date, background_image)
      VALUES (1, 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@example.com', ?, ?, ?, ?)
    `).bind(coupleName1, coupleName2, anniversaryDate, backgroundImage).run()

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})

// 时间轴API
router.get('/api/timeline', async (request, env) => {
  try {
    const result = await env.DB.prepare('SELECT * FROM timeline_events ORDER BY date DESC').all()
    const events = result.results.map(event => ({
      ...event,
      images: event.images ? event.images.split(',') : []
    }))
    return new Response(JSON.stringify(events), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})

router.post('/api/timeline', async (request, env) => {
  try {
    const body = await request.json()
    const { title, description, date, location, category, images } = body

    await env.DB.prepare(`
      INSERT INTO timeline_events (title, description, date, location, category, images)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(title, description, date, location, category, images?.join(',')).run()

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})

router.put('/api/timeline/:id', async (request, env) => {
  try {
    const id = request.params.id
    const body = await request.json()
    const { title, description, date, location, category, images } = body

    await env.DB.prepare(`
      UPDATE timeline_events 
      SET title = ?, description = ?, date = ?, location = ?, category = ?, images = ?
      WHERE id = ?
    `).bind(title, description, date, location, category, images?.join(','), id).run()

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})

router.delete('/api/timeline/:id', async (request, env) => {
  try {
    const id = request.params.id
    await env.DB.prepare('DELETE FROM timeline_events WHERE id = ?').bind(id).run()
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})

// 相册API
router.get('/api/albums', async (request, env) => {
  try {
    const albums = await env.DB.prepare('SELECT * FROM albums ORDER BY created_at DESC').all()
    const photos = await env.DB.prepare('SELECT * FROM photos').all()
    
    const albumsWithPhotos = albums.results.map(album => ({
      ...album,
      photos: photos.results.filter(photo => photo.album_id === album.id)
    }))

    return new Response(JSON.stringify(albumsWithPhotos), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})

// 日记API
router.get('/api/diaries', async (request, env) => {
  try {
    const result = await env.DB.prepare('SELECT * FROM diaries ORDER BY date DESC').all()
    const diaries = result.results.map(diary => ({
      ...diary,
      images: diary.images ? diary.images.split(',') : []
    }))
    return new Response(JSON.stringify(diaries), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})

// 美食打卡API
router.get('/api/food-checkins', async (request, env) => {
  try {
    const result = await env.DB.prepare('SELECT * FROM food_checkins ORDER BY date DESC').all()
    const checkins = result.results.map(checkin => ({
      ...checkin,
      images: checkin.images ? checkin.images.split(',') : [],
      recommended_dishes: checkin.recommended_dishes ? checkin.recommended_dishes.split(',') : []
    }))
    return new Response(JSON.stringify(checkins), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})

// 文件上传API
router.post('/api/upload', async (request, env) => {
  try {
    const formData = await request.formData()
    const file = formData.get('image')
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    const filename = `${Date.now()}-${file.name}`
    await env.R2.put(filename, file.stream())
    
    const url = `https://${env.R2_BUCKET}.r2.cloudflarestorage.com/${filename}`
    
    return new Response(JSON.stringify({ url }), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})

// 认证API
router.post('/api/auth/login', async (request, env) => {
  try {
    const { username, password } = await request.json()
    
    // 简单的认证逻辑，生产环境应该使用密码哈希
    if (username === 'admin' && password === 'admin123') {
      return new Response(JSON.stringify({
        token: 'mock-jwt-token',
        user: { username, role: 'admin' }
      }), { headers: corsHeaders })
    }

    return new Response(JSON.stringify({ error: 'Invalid credentials' }), { 
      status: 401, 
      headers: corsHeaders 
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})

// 404处理
router.all('*', () => new Response('Not Found', { status: 404 }))

export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx)
  }
}
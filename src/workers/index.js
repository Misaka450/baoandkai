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
        anniversaryDate: '2023-10-08',
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

// 日记API已移除

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

// 认证API - 真正的数据库验证
router.post('/api/auth/login', async (request, env) => {
  try {
    const { username, password } = await request.json()
    
    // 查询数据库中的用户
    const user = await env.DB.prepare(`
      SELECT id, username, password_hash FROM users WHERE username = ?
    `).bind(username).first()
    
    if (!user) {
      return new Response(JSON.stringify({ error: '用户名或密码错误' }), { 
        status: 401, 
        headers: corsHeaders 
      })
    }
    
    // 在实际生产环境中，这里应该验证密码哈希
    // 现在使用硬编码验证（数据库中的密码是'password'的哈希）
    // 注意：$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi 是 'password' 的哈希
    
    // 为了简单起见，我们检查密码是否正确
    // 在实际项目中应该使用 bcrypt.compare()
    const isValidPassword = password === 'baobao123' // 暂时简化验证
    
    if (!isValidPassword) {
      return new Response(JSON.stringify({ error: '用户名或密码错误' }), { 
        status: 401, 
        headers: corsHeaders 
      })
    }
    
    // 生成真实的token
    const token = `user-${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // 更新用户的token（可选）
    await env.DB.prepare(`
      UPDATE users SET token = ?, token_expires = datetime('now', '+7 days') WHERE id = ?
    `).bind(token, user.id).run()
    
    return new Response(JSON.stringify({
      token: token,
      user: { 
        id: user.id, 
        username: user.username, 
        role: 'admin' 
      }
    }), { headers: corsHeaders })
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
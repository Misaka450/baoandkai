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

// 404处理
router.all('*', () => new Response('Not Found', { status: 404 }))

export default {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx)
  }
}
export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const db = env.DB;

    try {
      if (request.method === 'GET') {
        // 获取所有待办事项
        const { results } = await db.prepare(`
          SELECT * FROM todos 
          ORDER BY 
            CASE status 
              WHEN 'pending' THEN 1 
              WHEN 'completed' THEN 2 
              ELSE 3 
            END,
            priority DESC,
            created_at DESC
        `).all();
        
        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (request.method === 'POST') {
        // 创建新的待办事项
        const data = await request.json();
        
        if (!data.title) {
          return new Response(JSON.stringify({ error: '标题不能为空' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const result = await db.prepare(`
          INSERT INTO todos (title, description, status, priority, due_date, category)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          data.title,
          data.description || '',
          data.status || 'pending',
          data.priority || 1,
          data.due_date || null,
          data.category || 'general'
        ).run();

        const newTodo = await db.prepare('SELECT * FROM todos WHERE id = ?')
          .bind(result.meta.last_row_id).first();

        return new Response(JSON.stringify(newTodo), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders 
      });

    } catch (error) {
      console.error('API Error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
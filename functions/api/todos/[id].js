export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const db = env.DB;
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    try {
      if (request.method === 'GET') {
        // 获取单个待办事项
        const todo = await db.prepare('SELECT * FROM todos WHERE id = ?')
          .bind(id).first();
        
        if (!todo) {
          return new Response(JSON.stringify({ error: '待办事项不存在' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // 解析完成照片JSON
        if (todo.completion_photos) {
          try {
            todo.completion_photos = JSON.parse(todo.completion_photos);
          } catch {
            todo.completion_photos = [];
          }
        }

        return new Response(JSON.stringify(todo), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (request.method === 'PUT') {
        // 更新待办事项
        const data = await request.json();
        
        const updates = [];
        const values = [];

        if (data.title !== undefined) {
          updates.push('title = ?');
          values.push(data.title);
        }
        if (data.description !== undefined) {
          updates.push('description = ?');
          values.push(data.description);
        }
        if (data.status !== undefined) {
          updates.push('status = ?');
          values.push(data.status);
          if (data.status === 'completed' && !data.completed_at) {
            updates.push('completed_at = CURRENT_TIMESTAMP');
          }
        }
        if (data.priority !== undefined) {
          updates.push('priority = ?');
          values.push(data.priority);
        }
        if (data.due_date !== undefined) {
          updates.push('due_date = ?');
          values.push(data.due_date);
        }
        if (data.category !== undefined) {
          updates.push('category = ?');
          values.push(data.category);
        }
        if (data.completion_notes !== undefined) {
          updates.push('completion_notes = ?');
          values.push(data.completion_notes);
        }
        if (data.completion_photos !== undefined) {
          updates.push('completion_photos = ?');
          values.push(JSON.stringify(data.completion_photos));
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        if (updates.length === 0) {
          return new Response(JSON.stringify({ error: '没有要更新的字段' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        await db.prepare(`
          UPDATE todos 
          SET ${updates.join(', ')}
          WHERE id = ?
        `).bind(...values).run();

        const updatedTodo = await db.prepare('SELECT * FROM todos WHERE id = ?')
          .bind(id).first();

        return new Response(JSON.stringify(updatedTodo), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (request.method === 'DELETE') {
        // 删除待办事项
        const result = await db.prepare('DELETE FROM todos WHERE id = ?')
          .bind(id).run();
        
        if (result.meta.changes === 0) {
          return new Response(JSON.stringify({ error: '待办事项不存在' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ message: '删除成功' }), {
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
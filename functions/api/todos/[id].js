// Cloudflare Pages Functions - 单个待办事项API
export async function onRequestGet(context) {
  const { env, params } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const id = params.id;
    const todo = await env.DB.prepare('SELECT * FROM todos WHERE id = ?')
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
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPut(context) {
  const { request, env, params } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const id = params.id;
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
    if (data.notes !== undefined) {
      updates.push('completion_notes = ?');
      values.push(data.notes);
    } else if (data.completion_notes !== undefined) {
      updates.push('completion_notes = ?');
      values.push(data.completion_notes);
    }
    if (data.photos !== undefined) {
      updates.push('completion_photos = ?');
      values.push(JSON.stringify(data.photos));
    } else if (data.completion_photos !== undefined) {
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

    await env.DB.prepare(`
      UPDATE todos 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...values).run();

    const updatedTodo = await env.DB.prepare('SELECT * FROM todos WHERE id = ?')
      .bind(id).first();

    // 解析完成照片JSON
    if (updatedTodo.completion_photos) {
      try {
        updatedTodo.completion_photos = JSON.parse(updatedTodo.completion_photos);
      } catch {
        updatedTodo.completion_photos = [];
      }
    }

    return new Response(JSON.stringify(updatedTodo), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const id = params.id;
    const result = await env.DB.prepare('DELETE FROM todos WHERE id = ?')
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
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
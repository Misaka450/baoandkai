// 诊断端点 - 专门查看todos API的详细错误
export async function onRequestGet(context) {
  const { env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const results = {
      timestamp: new Date().toISOString(),
      checks: {}
    };

    // 1. 检查数据库连接
    try {
      await env.DB.prepare('SELECT 1').first();
      results.checks.database_connection = '✅ 正常';
    } catch (error) {
      results.checks.database_connection = `❌ 失败: ${error.message}`;
    }

    // 2. 检查todos表是否存在
    try {
      const tableInfo = await env.DB.prepare('PRAGMA table_info(todos)').all();
      if (tableInfo.results && tableInfo.results.length > 0) {
        results.checks.todos_table = '✅ 存在';
        results.table_structure = tableInfo.results;
      } else {
        results.checks.todos_table = '❌ 表不存在';
      }
    } catch (error) {
      results.checks.todos_table = `❌ 检查失败: ${error.message}`;
    }

    // 3. 检查能否查询数据
    try {
      const sampleData = await env.DB.prepare('SELECT * FROM todos LIMIT 1').all();
      results.checks.data_query = '✅ 正常';
      results.sample_count = sampleData.results?.length || 0;
    } catch (error) {
      results.checks.data_query = `❌ 失败: ${error.message}`;
    }

    // 4. 检查表结构详情
    try {
      const columns = await env.DB.prepare(`
        SELECT 
          name,
          type,
          "notnull",
          dflt_value,
          pk
        FROM pragma_table_info('todos')
      `).all();
      results.checks.columns = columns.results;
    } catch (error) {
      results.checks.columns = `❌ 获取列信息失败: ${error.message}`;
    }

    return new Response(JSON.stringify(results, null, 2), {
      headers: corsHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: '诊断端点错误',
      details: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    // 模拟创建操作，但不实际插入数据
    const body = await request.json();
    
    const simulation = {
      timestamp: new Date().toISOString(),
      received_body: body,
      validation: {
        title: typeof body.title,
        has_title: !!body.title,
        description: typeof body.description,
        status: body.status,
        priority: body.priority,
        due_date: body.due_date,
        category: body.category
      }
    };

    // 检查SQL语句
    try {
      const sql = `
        INSERT INTO todos (
          title, description, status, priority, due_date, 
          category, completion_notes, completion_photos, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;
      
      simulation.prepared_sql = sql;
      simulation.parameters = [
        body.title || '',
        body.description || '',
        body.status || 'pending',
        body.priority || 3,
        body.due_date || null,
        body.category || 'general',
        body.notes || null,
        body.photos ? JSON.stringify(body.photos) : null
      ];

      // 检查每个参数类型
      simulation.parameter_types = simulation.parameters.map(p => ({
        value: p,
        type: typeof p,
        is_null: p === null
      }));

    } catch (error) {
      simulation.sql_error = error.message;
    }

    return new Response(JSON.stringify(simulation, null, 2), {
      headers: corsHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: '模拟创建失败',
      details: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
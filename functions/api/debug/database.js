// 数据库调试API
export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    const tables = await env.DB.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `).all();
    
    const tableInfo = {};
    
    for (const table of tables.results) {
      const columns = await env.DB.prepare(`
        PRAGMA table_info(${table.name})
      `).all();
      
      const rowCount = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM ${table.name}
      `).first();
      
      tableInfo[table.name] = {
        columns: columns.results.map(col => ({
          name: col.name,
          type: col.type,
          notNull: col.notnull,
          defaultValue: col.dflt_value,
          primaryKey: col.pk
        })),
        rowCount: rowCount.count
      };
    }
    
    return new Response(JSON.stringify({
      success: true,
      tables: tableInfo,
      totalTables: tables.results.length
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
// Cloudflare Pages Functions - 相册调试API
export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    // 检查albums表结构
    const albumsSchema = await env.oursql.prepare(`
      PRAGMA table_info(albums)
    `).all();
    
    // 检查photos表结构
    const photosSchema = await env.oursql.prepare(`
      PRAGMA table_info(photos)
    `).all();
    
    // 简单查询测试
    const simpleAlbums = await env.oursql.prepare(`
      SELECT * FROM albums LIMIT 1
    `).all();
    
    const simplePhotos = await env.oursql.prepare(`
      SELECT * FROM photos LIMIT 1
    `).all();
    
    return new Response(JSON.stringify({
      albumsSchema: albumsSchema.results,
      photosSchema: photosSchema.results,
      albumsSample: simpleAlbums.results,
      photosSample: simplePhotos.results,
      albumsCount: albums.results?.length || 0,
      photosCount: photos.results?.length || 0
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
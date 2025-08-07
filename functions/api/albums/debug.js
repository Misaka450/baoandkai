// Cloudflare Pages Functions - 相册调试API
export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    // 检查albums表结构
    const albumsSchema = await env.DB.prepare(`
      SELECT sql FROM sqlite_master WHERE type='table' AND name='albums'
    `).first();
    
    const photosSchema = await env.DB.prepare(`
      SELECT sql FROM sqlite_master WHERE type='table' AND name='photos'
    `).first();
    
    const simpleAlbums = await env.DB.prepare(`
      SELECT * FROM albums ORDER BY created_at DESC LIMIT 3
    `).all();
    
    const simplePhotos = await env.DB.prepare(`
      SELECT * FROM photos ORDER BY created_at DESC LIMIT 5
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
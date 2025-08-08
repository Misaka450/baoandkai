// Cloudflare Pages Functions - 测试POST请求
export async function onRequestPost(context) {
  const { request } = context;
  
  try {
    console.log('收到POST请求');
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    
    const text = await request.text();
    console.log('原始请求体:', text);
    
    let body;
    try {
      body = JSON.parse(text);
      console.log('解析后的JSON:', body);
    } catch (e) {
      console.error('JSON解析错误:', e);
      return new Response(JSON.stringify({ 
        error: 'JSON解析失败', 
        details: e.message,
        received: text 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      received: body,
      type: typeof body
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('服务器错误:', error);
    return new Response(JSON.stringify({ 
      error: '服务器错误', 
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
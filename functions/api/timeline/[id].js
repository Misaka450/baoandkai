import { jsonResponse, errorResponse } from '../../utils/response';

/**
 * 更新时间轴事件
 */
export async function onRequestPut(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').filter(Boolean).pop();
    const eventId = parseInt(id);
    const body = await request.json();
    const { title, description, date, location, category, images = [] } = body;

    if (isNaN(eventId)) {
      return errorResponse('无效的ID', 400);
    }

    if (!title || !date) {
      return errorResponse('标题和日期不能为空', 400);
    }

    const result = await env.DB.prepare(`
      UPDATE timeline_events 
      SET title = ?, description = ?, date = ?, location = ?, category = ?, images = ?, updated_at = datetime('now') 
      WHERE id = ?
    `).bind(title, description, date, location || '', category || '日常', images.join(','), eventId).run();

    if (result.changes === 0) {
      return errorResponse('记录不存在', 404);
    }

    const updatedEvent = await env.DB.prepare(`
      SELECT * FROM timeline_events WHERE id = ?
    `).bind(eventId).first();

    return jsonResponse({
      ...updatedEvent,
      images: updatedEvent.images ? updatedEvent.images.split(',') : []
    });
  } catch (error) {
    console.error('更新时间轴失败:', error);
    return errorResponse(error.message, 500);
  }
}

/**
 * 删除时间轴事件（包含 R2 物理清理）
 */
export async function onRequestDelete(context) {
  const { env, request } = context;

  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').filter(Boolean).pop();
    const eventId = parseInt(id);

    if (isNaN(eventId)) {
      return errorResponse('无效的ID', 400);
    }

    // 1. 获取事件详情以获取待清理的照片 URL
    const event = await env.DB.prepare(`SELECT images FROM timeline_events WHERE id = ?`).bind(eventId).first();

    if (event && event.images && env.IMAGES) {
      const imageUrls = event.images.split(',').filter(Boolean);
      // 将异步清理改为由 await 控制的串行或并行清理，确保在 DB 删除前完成（或至少确保删除请求已发出）
      const cleanupPromises = imageUrls.map(async (imgUrl) => {
        // 去除空格并清理路径
        const trimmedUrl = imgUrl.trim();
        if (trimmedUrl.includes('/api/images/')) {
          const key = trimmedUrl.split('/api/images/')[1];
          if (key) {
            try {
              const decodedKey = decodeURIComponent(key);
              console.log('正在从R2物理删除文件:', decodedKey);
              await env.IMAGES.delete(decodedKey);
              return true;
            } catch (e) {
              console.error(`R2物理文件删除失败 [${key}]:`, e);
            }
          }
        }
        return false;
      });

      // 关键改进：等待所有图片删除指令完成（即使失败也不中断流程）
      await Promise.allSettled(cleanupPromises);
    }

    // 2. 删除数据库记录
    const result = await env.DB.prepare('DELETE FROM timeline_events WHERE id = ?').bind(eventId).run();

    if (result.changes === 0) {
      return errorResponse('记录不存在', 404);
    }

    return jsonResponse({ success: true, message: '事件及关联资源已删除' });
  } catch (error) {
    console.error('删除时间轴记录失败:', error);
    return errorResponse(error.message, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
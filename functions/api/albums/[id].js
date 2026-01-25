import { jsonResponse, errorResponse } from '../../utils/response';

/**
 * 获取单个相册详情及其包含的所有照片
 * @param {import('@cloudflare/workers-types').EventContext} context 
 */
export async function onRequestGet(context) {
  const { env, request } = context;

  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id || isNaN(id)) {
      return errorResponse('无效的ID', 400);
    }

    const album = await env.DB.prepare(`
      SELECT * FROM albums WHERE id = ?
    `).bind(parseInt(id)).first();

    if (!album) {
      return errorResponse('相册不存在', 404);
    }

    const photos = await env.DB.prepare(`
      SELECT * FROM photos WHERE album_id = ? ORDER BY sort_order ASC
    `).bind(parseInt(id)).all();

    return jsonResponse({
      ...album,
      photos: photos.results || []
    });
  } catch (error) {
    console.error('获取相册失败:', error);
    return errorResponse(error.message, 500);
  }
}

/**
 * 更新相册基本信息及照片列表
 * @param {import('@cloudflare/workers-types').EventContext} context 
 */
export async function onRequestPut(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    const body = await request.json();
    const { name, description, photos = [], cover_url } = body;

    if (!id || isNaN(id)) {
      return errorResponse('无效的ID', 400);
    }

    if (!name || !name.trim()) {
      return errorResponse('相册名称不能为空', 400);
    }

    // 更新相册信息（包括封面）
    const result = await env.DB.prepare(`
      UPDATE albums SET name = ?, description = ?, cover_url = ?, updated_at = datetime('now') 
      WHERE id = ?
    `).bind(name.trim(), description?.trim() || '', cover_url || '', parseInt(id)).run();

    if (result.changes === 0) {
      return errorResponse('相册不存在', 404);
    }

    // 删除旧照片并插入新照片（带排序字段）
    await env.DB.prepare('DELETE FROM photos WHERE album_id = ?').bind(parseInt(id)).run();

    if (photos.length > 0) {
      const photoPromises = photos.map((photo, index) =>
        env.DB.prepare(`
          INSERT INTO photos (album_id, url, caption, sort_order) 
          VALUES (?, ?, ?, ?)
        `).bind(
          parseInt(id),
          photo.url || photo,
          photo.caption || '',
          photo.sort_order !== undefined ? photo.sort_order : index
        ).run()
      );
      await Promise.all(photoPromises);
    }

    const updatedAlbum = await env.DB.prepare(`
      SELECT * FROM albums WHERE id = ?
    `).bind(parseInt(id)).first();

    const albumPhotos = await env.DB.prepare(`
      SELECT * FROM photos WHERE album_id = ?
    `).bind(parseInt(id)).all();

    return jsonResponse({
      ...updatedAlbum,
      photos: albumPhotos.results || []
    });
  } catch (error) {
    console.error('更新相册失败:', error);
    return errorResponse(error.message, 500);
  }
}

/**
 * 删除相册及其关联的所有照片
 * @param {import('@cloudflare/workers-types').EventContext} context 
 */
export async function onRequestDelete(context) {
  const { env, request } = context;

  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();

    if (!id || isNaN(id)) {
      return errorResponse('无效的ID', 400);
    }

    // 先删除相册中的照片
    await env.DB.prepare('DELETE FROM photos WHERE album_id = ?').bind(parseInt(id)).run();

    // 再删除相册
    const result = await env.DB.prepare('DELETE FROM albums WHERE id = ?').bind(parseInt(id)).run();

    if (result.changes === 0) {
      return errorResponse('相册不存在', 404);
    }

    return jsonResponse({ success: true, message: '删除成功' });
  } catch (error) {
    return errorResponse(error.message, 500);
  }
}
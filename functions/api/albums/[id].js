import { jsonResponse, errorResponse } from '../../utils/response';

/**
 * 获取单个相册详情及其包含的所有照片
 * @param {import('@cloudflare/workers-types').EventContext} context 
 */
export async function onRequestGet(context) {
  const { env, request } = context;

  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').filter(Boolean).pop();

    if (!id || isNaN(parseInt(id))) {
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
    const id = url.pathname.split('/').filter(Boolean).pop();

    if (!id || isNaN(parseInt(id))) {
      return errorResponse('无效的ID', 400);
    }

    const body = await request.json();
    const { name, description, photos, cover_url } = body;

    // 1. 更新相册基本信息（仅更新提供的字段）
    // 先获取当前数据用于补全
    const currentAlbum = await env.DB.prepare(`SELECT * FROM albums WHERE id = ?`).bind(parseInt(id)).first();
    if (!currentAlbum) {
      return errorResponse('相册不存在', 404);
    }

    const finalName = name !== undefined ? name.trim() : currentAlbum.name;
    const finalDescription = description !== undefined ? description.trim() : currentAlbum.description;
    const finalCoverUrl = cover_url !== undefined ? cover_url : currentAlbum.cover_url;

    if (!finalName) {
      return errorResponse('相册名称不能为空', 400);
    }

    await env.DB.prepare(`
      UPDATE albums SET name = ?, description = ?, cover_url = ?, updated_at = datetime('now') 
      WHERE id = ?
    `).bind(finalName, finalDescription, finalCoverUrl, parseInt(id)).run();

    // 2. 只有在 body 中明确传入了 photos 数组时才处理照片更新（避免单纯设置封面时误删照片）
    if (photos && Array.isArray(photos)) {
      // 删除旧照片并插入新照片
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
    const id = url.pathname.split('/').filter(Boolean).pop();

    if (!id || isNaN(parseInt(id))) {
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
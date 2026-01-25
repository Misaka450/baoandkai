import { jsonResponse, errorResponse } from '../../utils/response';

/**
 * 获取单个相册详情及其包含的所有照片
 */
export async function onRequestGet(context) {
  const { env, request } = context;

  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').filter(Boolean).pop();
    const albumId = parseInt(id);

    if (isNaN(albumId)) {
      return errorResponse('无效的ID', 400);
    }

    const album = await env.DB.prepare(`SELECT * FROM albums WHERE id = ?`).bind(albumId).first();

    if (!album) {
      return errorResponse('相册不存在', 404);
    }

    const photos = await env.DB.prepare(`
      SELECT * FROM photos WHERE album_id = ? ORDER BY sort_order ASC
    `).bind(albumId).all();

    return jsonResponse({
      ...album,
      photos: photos.results || []
    });
  } catch (error) {
    console.error('获取相册详情失败:', error);
    return errorResponse(error.message, 500);
  }
}

/**
 * 更新相册基本信息及照片列表
 * 优化点：使用事务批处理，支持局部更新，防止数据不一致
 */
export async function onRequestPut(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').filter(Boolean).pop();
    const albumId = parseInt(id);

    if (isNaN(albumId)) {
      return errorResponse('无效的ID', 400);
    }

    const body = await request.json();
    const { name, description, photos, cover_url } = body;

    // 1. 获取当前数据以确保相册存在并用于补全字段
    const currentAlbum = await env.DB.prepare(`SELECT * FROM albums WHERE id = ?`).bind(albumId).first();
    if (!currentAlbum) {
      return errorResponse('相册不存在', 404);
    }

    const finalName = name !== undefined ? name.trim() : currentAlbum.name;
    const finalDescription = description !== undefined ? description.trim() : currentAlbum.description;
    const finalCoverUrl = cover_url !== undefined ? cover_url : currentAlbum.cover_url;

    if (!finalName) {
      return errorResponse('相册名称不能为空', 400);
    }

    const statements = [];

    // 添加更新相册基本信息的 SQL
    statements.push(
      env.DB.prepare(`
        UPDATE albums SET name = ?, description = ?, cover_url = ?, updated_at = datetime('now') 
        WHERE id = ?
      `).bind(finalName, finalDescription, finalCoverUrl, albumId)
    );

    // 2. 如果传入了照片列表，则同步更新照片（慎用：执行的是全量替换）
    if (photos && Array.isArray(photos)) {
      // 先清空旧照片记录
      statements.push(env.DB.prepare('DELETE FROM photos WHERE album_id = ?').bind(albumId));

      // 插入新照片
      if (photos.length > 0) {
        photos.forEach((photo, index) => {
          statements.push(
            env.DB.prepare(`
              INSERT INTO photos (album_id, url, caption, sort_order, created_at) 
              VALUES (?, ?, ?, ?, datetime('now'))
            `).bind(
              albumId,
              photo.url || photo,
              photo.caption || '',
              photo.sort_order !== undefined ? photo.sort_order : index
            )
          );
        });
      }
    }

    // 执行批处理事务
    await env.DB.batch(statements);

    // 获取更新后的最终状态返回给前端
    const updatedAlbum = await env.DB.prepare(`SELECT * FROM albums WHERE id = ?`).bind(albumId).first();
    const albumPhotos = await env.DB.prepare(`SELECT * FROM photos WHERE album_id = ? ORDER BY sort_order ASC`).bind(albumId).all();

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
 * 优化点：在删除数据库记录的同时同步清理 R2 存储中的物理文件
 */
export async function onRequestDelete(context) {
  const { env, request } = context;

  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').filter(Boolean).pop();
    const albumId = parseInt(id);

    if (isNaN(albumId)) {
      return errorResponse('无效的ID', 400);
    }

    // 1. 获取所有关联照片以清理 R2
    const photos = await env.DB.prepare(`SELECT url FROM photos WHERE album_id = ?`).bind(albumId).all();

    // 2. 如果配置了 R2 图片存储，清理物理文件
    if (env.IMAGES && photos.results?.length > 0) {
      const fileCleanupPromises = photos.results
        .map(p => {
          // 仅处理属于系统的内部图片链接 (/api/images/...)
          if (p.url && p.url.startsWith('/api/images/')) {
            const key = p.url.split('/api/images/')[1];
            // 解码以匹配 R2 中的 Key
            try {
              return env.IMAGES.delete(decodeURIComponent(key));
            } catch (e) {
              console.error('解析照片 Key 失败:', key, e);
            }
          }
          return null;
        })
        .filter(Boolean);

      // 建议并行执行删除，失败不应阻塞 DB 删除
      Promise.all(fileCleanupPromises).catch(e => console.error('R2 文件物理删除过程中出错:', e));
    }

    // 3. 执行数据库事务删除
    await env.DB.batch([
      env.DB.prepare('DELETE FROM photos WHERE album_id = ?').bind(albumId),
      env.DB.prepare('DELETE FROM albums WHERE id = ?').bind(albumId)
    ]);

    return jsonResponse({ success: true, message: '相册及照片资源已彻底删除' });
  } catch (error) {
    console.error('删除相册失败:', error);
    return errorResponse(error.message, 500);
  }
}
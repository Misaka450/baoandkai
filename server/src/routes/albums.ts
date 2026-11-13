import { Hono } from 'hono';
import { jsonResponse, errorResponse } from '../utils/response.js';
import { transformImageUrl, extractStorageKey } from '../utils/url.js';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js';
import { validate, validateRequired, validateLength, hasXSS, sanitizeObject } from '../utils/validation.js';
import { pool } from '../lib/db.js';
import { storage } from '../lib/storage.js';

const albums = new Hono();

interface Album {
  id: number;
  name: string;
  description: string;
  cover_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface Photo {
  id: number;
  album_id: number;
  url: string;
  caption?: string;
  sort_order: number;
  created_at?: string;
}

/**
 * GET /api/albums
 * 获取相册列表（支持分页）
 */
albums.get('/', async (c) => {
  try {
    const url = new URL(c.req.url);
    const pagination = parsePagination(url);

    // 获取总记录数
    const { rows: countRows } = await pool.query('SELECT COUNT(*) as total FROM albums');
    const total = parseInt(countRows[0]?.total || '0', 10);

    // 获取相册列表，结合子查询获取第一张照片为封面及照片数
    const { rows: albumsList } = await pool.query(
      `SELECT 
         a.*,
         (SELECT url FROM photos WHERE album_id = a.id ORDER BY sort_order ASC, id ASC LIMIT 1) AS cover_url,
         (SELECT COUNT(*)::int FROM photos WHERE album_id = a.id) AS photo_count
       FROM albums a
       ORDER BY a.id DESC
       LIMIT $1 OFFSET $2`,
      [pagination.pageSize, pagination.offset]
    );

    const albumsWithPhotos = albumsList.map((album: any) => ({
      ...album,
      cover_url: transformImageUrl(album.cover_url || ''),
      photos: album.cover_url
        ? [
            {
              id: 0,
              album_id: album.id,
              url: transformImageUrl(album.cover_url),
              sort_order: 0,
            },
          ]
        : [],
    }));

    return jsonResponse(buildPaginatedResponse(albumsWithPhotos, total, pagination));
  } catch (error: any) {
    console.error('获取相册列表失败:', error);
    return errorResponse(error.message, 500);
  }
});

/**
 * POST /api/albums
 * 创建新相册
 */
albums.post('/', async (c) => {
  try {
    const body: any = await c.req.json();
    const { name, description } = body;

    // 输入验证
    const validationError = validate([
      validateRequired(name, '相册名称'),
      validateLength(name, '相册名称', 1, 100),
    ]);
    if (validationError) return errorResponse(validationError, 400);

    // XSS 检测
    if (hasXSS(name) || (description && hasXSS(description))) {
      return errorResponse('输入内容包含不安全字符', 400);
    }

    // 消毒输入数据
    const sanitized = sanitizeObject({ name, description }, []);

    // 插入并返回新生成的记录
    const { rows } = await pool.query(
      `INSERT INTO albums (name, description, created_at, updated_at) 
       VALUES ($1, $2, NOW(), NOW()) 
       RETURNING *`,
      [sanitized.name, sanitized.description || '']
    );
    const newAlbum = rows[0];

    return jsonResponse(newAlbum, 201);
  } catch (error: any) {
    console.error('创建相册失败:', error);
    return errorResponse(error.message, 500);
  }
});

/**
 * GET /api/albums/:id
 * 获取单个相册详情
 */
albums.get('/:id', async (c) => {
  try {
    const albumId = parseInt(c.req.param('id') || '');
    if (isNaN(albumId)) {
      return errorResponse('无效的ID', 400);
    }

    // 查询相册基本信息
    const { rows: albumRows } = await pool.query('SELECT * FROM albums WHERE id = $1', [albumId]);
    const album = albumRows[0] as Album;

    if (!album) {
      return errorResponse('相册不存在', 404);
    }

    // 查询照片列表
    const { rows: photoRows } = await pool.query(
      'SELECT * FROM photos WHERE album_id = $1 ORDER BY sort_order ASC',
      [albumId]
    );

    return jsonResponse({
      ...album,
      cover_url: transformImageUrl(album.cover_url),
      photos: (photoRows as Photo[]).map((p) => ({
        ...p,
        url: transformImageUrl(p.url),
      })),
    });
  } catch (error: any) {
    console.error('获取相册详情失败:', error);
    return errorResponse(error.message, 500);
  }
});

/**
 * PUT /api/albums/:id
 * 更新相册基本信息及照片列表
 */
albums.put('/:id', async (c) => {
  const albumId = parseInt(c.req.param('id') || '', 10);
  if (isNaN(albumId)) {
    return errorResponse('无效的ID', 400);
  }

  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return errorResponse('请求参数格式错误', 400);
  }

  const { name, description, photos, cover_url } = body || {};
  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    return errorResponse('相册名称不能为空', 400);
  }

  const client = await pool.connect();
  try {
    // 开启事务（持有 client 期间统一用 client.query 防止连接池死锁）
    await client.query('BEGIN');

    // 1. 获取当前数据
    const { rows: albumRows } = await client.query('SELECT * FROM albums WHERE id = $1', [albumId]);
    const currentAlbum = albumRows[0] as Album;
    if (!currentAlbum) {
      await client.query('ROLLBACK');
      return errorResponse('相册不存在', 404);
    }

    const finalName = name !== undefined ? name.trim() : currentAlbum.name;
    const finalDescription = description !== undefined ? String(description).trim() : currentAlbum.description;
    const finalCoverUrl = cover_url !== undefined ? cover_url : currentAlbum.cover_url;

    if (!finalName) {
      await client.query('ROLLBACK');
      return errorResponse('相册名称不能为空', 400);
    }

    // 更新相册基本信息
    const { rows: updatedAlbumRows } = await client.query(
      `UPDATE albums 
       SET name = $1, description = $2, cover_url = $3, updated_at = NOW() 
       WHERE id = $4
       RETURNING *`,
      [finalName, finalDescription, finalCoverUrl, albumId]
    );

    // 2. 如果传入了照片列表，按 id / url 增量更新并保留原有 date/location（EXIF）
    if (photos && Array.isArray(photos)) {
      const { rows: existingPhotos } = await client.query(
        'SELECT id, url, caption, date, location, sort_order FROM photos WHERE album_id = $1',
        [albumId]
      );

      const existingById = new Map<number, any>();
      const existingByUrl = new Map<string, any>();
      for (const ep of existingPhotos) {
        existingById.set(Number(ep.id), ep);
        if (ep.url && !existingByUrl.has(ep.url)) {
          existingByUrl.set(ep.url, ep);
        }
      }

      const keptIds = new Set<number>();

      for (let index = 0; index < photos.length; index++) {
        const photo = photos[index];
        const isObj = typeof photo === 'object' && photo !== null;
        const photoId = isObj && photo.id !== undefined ? Number(photo.id) : undefined;
        const photoUrl = typeof photo === 'string' ? photo : photo?.url;
        const photoCaption = typeof photo === 'string' ? undefined : photo?.caption;
        const photoSortOrder = isObj && photo.sort_order !== undefined ? Number(photo.sort_order) : index;
        const photoDate = isObj ? photo.date : undefined;
        const photoLocation = isObj ? photo.location : undefined;

        let matched = photoId !== undefined && Number.isFinite(photoId) ? existingById.get(photoId) : undefined;
        if (!matched && photoUrl) {
          const candidate = existingByUrl.get(photoUrl);
          if (candidate && !keptIds.has(Number(candidate.id))) {
            matched = candidate;
          }
        }

        if (matched) {
          const matchedId = Number(matched.id);
          keptIds.add(matchedId);
          const finalUrl = photoUrl || matched.url;
          const finalCaption = photoCaption !== undefined ? photoCaption : (matched.caption || '');
          const finalDate = photoDate !== undefined ? photoDate : (matched.date ?? null);
          const finalLocation = photoLocation !== undefined ? photoLocation : (matched.location ?? null);

          await client.query(
            `UPDATE photos 
             SET url = $1, caption = $2, date = $3, location = $4, sort_order = $5
             WHERE id = $6 AND album_id = $7`,
            [finalUrl, finalCaption, finalDate, finalLocation, photoSortOrder, matchedId, albumId]
          );
        } else if (photoUrl) {
          const { rows: insertedRows } = await client.query(
            `INSERT INTO photos (album_id, url, caption, date, location, sort_order, created_at) 
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             RETURNING id`,
            [albumId, photoUrl, photoCaption || '', photoDate ?? null, photoLocation ?? null, photoSortOrder]
          );
          if (insertedRows[0]?.id !== undefined) {
            keptIds.add(Number(insertedRows[0].id));
          }
        }
      }

      if (keptIds.size > 0) {
        await client.query(
          'DELETE FROM photos WHERE album_id = $1 AND NOT (id = ANY($2::int[]))',
          [albumId, Array.from(keptIds)]
        );
      } else {
        await client.query('DELETE FROM photos WHERE album_id = $1', [albumId]);
      }
    }

    const { rows: updatedPhotoRows } = await client.query(
      'SELECT * FROM photos WHERE album_id = $1 ORDER BY sort_order ASC',
      [albumId]
    );

    await client.query('COMMIT');

    return jsonResponse({
      ...updatedAlbumRows[0],
      photos: updatedPhotoRows,
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('更新相册失败:', error);
    return errorResponse(error.message, 500);
  } finally {
    client.release();
  }
});

/**
 * DELETE /api/albums/:id
 * 删除相册及其关联的所有照片
 */
albums.delete('/:id', async (c) => {
  const albumId = parseInt(c.req.param('id') || '', 10);
  if (isNaN(albumId)) {
    return errorResponse('无效的ID', 400);
  }

  const client = await pool.connect();
  let photosToDelete: Array<{ url: string }> = [];
  try {
    // 1. 事务内查询关联照片并删除数据库记录（统一使用 client.query 防止连接池死锁）
    await client.query('BEGIN');
    const { rows: photos } = await client.query('SELECT url FROM photos WHERE album_id = $1', [albumId]);
    photosToDelete = photos;

    await client.query('DELETE FROM photos WHERE album_id = $1', [albumId]);
    await client.query('DELETE FROM albums WHERE id = $1', [albumId]);
    await client.query('COMMIT');
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('删除相册失败:', error);
    return errorResponse(error.message, 500);
  } finally {
    client.release();
  }

  // 2. 事务 COMMIT 成功后，再异步删除磁盘物理文件
  const fileCleanupPromises = photosToDelete
    .map((p: any) => {
      const key = extractStorageKey(p.url);
      return key ? storage.delete(key).catch((e) => console.error('物理删除本地图片失败:', key, e)) : null;
    })
    .filter((p): p is Promise<void> => p !== null);

  Promise.all(fileCleanupPromises).catch((e) =>
    console.error('物理删除相册照片文件出错:', e)
  );

  return jsonResponse({ success: true, message: '相册及照片资源已彻底删除' });
});

export default albums;

import { Hono } from 'hono';
import { jsonResponse, errorResponse } from '../utils/response.js';
import { transformImageUrl } from '../utils/url.js';
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
  const client = await pool.connect();
  try {
    const albumId = parseInt(c.req.param('id') || '');
    if (isNaN(albumId)) {
      return errorResponse('无效的ID', 400);
    }

    const body: any = await c.req.json();
    const { name, description, photos, cover_url } = body;

    // 开启事务
    await client.query('BEGIN');

    // 1. 获取当前数据
    const { rows: albumRows } = await client.query('SELECT * FROM albums WHERE id = $1', [albumId]);
    const currentAlbum = albumRows[0] as Album;
    if (!currentAlbum) {
      await client.query('ROLLBACK');
      return errorResponse('相册不存在', 404);
    }

    const finalName = name !== undefined ? name.trim() : currentAlbum.name;
    const finalDescription = description !== undefined ? description.trim() : currentAlbum.description;
    const finalCoverUrl = cover_url !== undefined ? cover_url : currentAlbum.cover_url;

    if (!finalName) {
      await client.query('ROLLBACK');
      return errorResponse('相册名称不能为空', 400);
    }

    // 更新相册基本信息
    await client.query(
      `UPDATE albums 
       SET name = $1, description = $2, cover_url = $3, updated_at = NOW() 
       WHERE id = $4`,
      [finalName, finalDescription, finalCoverUrl, albumId]
    );

    // 2. 如果传入了照片列表，则先删除旧的，再插入新的
    if (photos && Array.isArray(photos)) {
      await client.query('DELETE FROM photos WHERE album_id = $1', [albumId]);

      if (photos.length > 0) {
        for (let index = 0; index < photos.length; index++) {
          const photo = photos[index];
          const photoUrl = typeof photo === 'string' ? photo : photo.url;
          const photoCaption = typeof photo === 'string' ? '' : photo.caption || '';
          const photoSortOrder = (typeof photo !== 'string' && photo.sort_order !== undefined) ? photo.sort_order : index;

          await client.query(
            `INSERT INTO photos (album_id, url, caption, sort_order, created_at) 
             VALUES ($1, $2, $3, $4, NOW())`,
            [albumId, photoUrl, photoCaption, photoSortOrder]
          );
        }
      }
    }

    await client.query('COMMIT');

    // 重新获取更新后的数据返回
    const { rows: updatedAlbumRows } = await pool.query('SELECT * FROM albums WHERE id = $1', [albumId]);
    const { rows: updatedPhotoRows } = await pool.query(
      'SELECT * FROM photos WHERE album_id = $1 ORDER BY sort_order ASC',
      [albumId]
    );

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
  const client = await pool.connect();
  try {
    const albumId = parseInt(c.req.param('id') || '');
    if (isNaN(albumId)) {
      return errorResponse('无效的ID', 400);
    }

    // 1. 获取照片，以便删除本地物理文件
    const { rows: photos } = await pool.query('SELECT url FROM photos WHERE album_id = $1', [albumId]);

    const fileCleanupPromises = photos
      .map((p: any) => {
        if (p.url) {
          // 适配 /uploads/ 或 /api/images/
          let key = '';
          if (p.url.includes('/uploads/')) {
            key = p.url.split('/uploads/')[1] || '';
          } else if (p.url.includes('/api/images/')) {
            key = p.url.split('/api/images/')[1] || '';
          }
          if (key) {
            try {
              return storage.delete(decodeURIComponent(key));
            } catch (e) {
              console.error('物理删除本地图片失败:', key, e);
            }
          }
        }
        return null;
      })
      .filter((p): p is Promise<void> => p !== null);

    // 物理删除磁盘图片
    await Promise.all(fileCleanupPromises).catch((e) =>
      console.error('物理删除相册照片文件出错:', e)
    );

    // 2. 事务删除数据库记录
    await client.query('BEGIN');
    await client.query('DELETE FROM photos WHERE album_id = $1', [albumId]);
    await client.query('DELETE FROM albums WHERE id = $1', [albumId]);
    await client.query('COMMIT');

    return jsonResponse({ success: true, message: '相册及照片资源已彻底删除' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('删除相册失败:', error);
    return errorResponse(error.message, 500);
  } finally {
    client.release();
  }
});

export default albums;

import { Hono } from 'hono';
import { jsonResponse, errorResponse } from '../utils/response.js';
import { transformImageUrl } from '../utils/url.js';
import { pool } from '../lib/db.js';
import { storage } from '../lib/storage.js';
import { validateImageMagic } from '../utils/validation.js';
import { parsePhotoExif } from '../utils/exif.js';
import path from 'path';
import fs from 'fs/promises';

const photos = new Hono();

interface Photo {
  id: number;
  album_id: number;
  url: string;
  caption: string;
  sort_order: number;
  created_at?: string;
}

interface ReorderItem {
  id: number;
  sort_order: number;
}

/**
 * GET /api/albums/:id/photos
 * 获取特定相册的所有照片
 */
photos.get('/', async (c) => {
  try {
    const albumId = parseInt(c.req.param('id') || '');
    if (isNaN(albumId)) {
      return errorResponse('无效的相册ID', 400);
    }

    const { rows: photoRows } = await pool.query(
      'SELECT * FROM photos WHERE album_id = $1 ORDER BY sort_order ASC, id ASC',
      [albumId]
    );

    const formattedPhotos = (photoRows as Photo[]).map((p) => ({
      ...p,
      url: transformImageUrl(p.url),
    }));

    return jsonResponse({
      data: formattedPhotos,
      count: formattedPhotos.length,
    });
  } catch (error: any) {
    console.error('获取相册照片失败:', error);
    return errorResponse(error.message, 500);
  }
});

/**
 * POST /api/albums/:id/photos
 * 向相册上传并添加照片
 */
photos.post('/', async (c) => {
  try {
    const albumId = parseInt(c.req.param('id') || '');
    if (isNaN(albumId)) {
      return errorResponse('无效的相册ID', 400);
    }

    const body = await c.req.parseBody();
    const file = body.file as File | undefined;

    if (!file) {
      return errorResponse('未找到上传文件', 400);
    }

    // 验证文件类型和大小
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxFileSize = 20 * 1024 * 1024; // 20MB

    if (!allowedTypes.includes(file.type)) {
      return errorResponse(`不支持的文件类型: ${file.type}`, 400);
    }

    if (file.size > maxFileSize) {
      return errorResponse(`文件太大: ${file.name} (${file.size} bytes)`, 400);
    }

    // 将上传的文件转换为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 验证文件魔数（Magic Number），防止伪装文件类型
    if (!validateImageMagic(new Uint8Array(buffer), file.type)) {
      return errorResponse(`文件类型验证失败: ${file.name}，文件内容与声明类型不匹配`, 400);
    }

    // 获取相册名称以便按结构存放
    const { rows: albumRows } = await pool.query('SELECT name FROM albums WHERE id = $1', [albumId]);
    const albumName = albumRows[0]?.name || 'default';
    
    const timestamp = Date.now();
    const randomStr = crypto.randomUUID().substring(0, 8);
    const extension = file.name.split('.').pop() || 'jpg';

    // 智能解析 EXIF（拍摄时间与经纬度城市）
    const exifMeta = await parsePhotoExif(buffer);

    // 本地相对存储路径: albums/AlbumName/timestamp-random.ext
    const key = `albums/${albumName}/${timestamp}-${randomStr}.${extension}`;

    // 存入本地存储
    await storage.put(key, buffer);

    // 拼装保存在数据库里的路径（以前缀 /uploads/ 开头的绝对路径）
    const proxiedUrl = `/uploads/${key}`;

    // 写入数据库（包含 EXIF 提取出的拍摄日期与地点）
    const { rows: newPhotoRows } = await pool.query(
      `INSERT INTO photos (album_id, url, caption, date, location, sort_order, created_at) 
       VALUES ($1, $2, $3, $4, $5, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM photos WHERE album_id = $6), NOW()) 
       RETURNING *`,
      [albumId, proxiedUrl, file.name, exifMeta.date || null, exifMeta.location || null, albumId]
    );

    const newPhoto = newPhotoRows[0] as Photo;

    return jsonResponse({
      ...newPhoto,
      url: transformImageUrl(newPhoto.url),
      detectedExif: exifMeta
    }, 201);
  } catch (error: any) {
    console.error('上传照片失败:', error);
    return errorResponse(error.message, 500);
  }
});

/**
 * POST /api/albums/:id/photos/sync-exif
 * 自动扫描相册中的存量历史照片并补齐 EXIF 拍摄时间与地点
 */
photos.post('/sync-exif', async (c) => {
  try {
    const albumId = parseInt(c.req.param('id') || '');
    if (isNaN(albumId)) {
      return errorResponse('无效的相册ID', 400);
    }

    const { rows: photosList } = await pool.query(
      'SELECT id, url, date, location FROM photos WHERE album_id = $1',
      [albumId]
    );

    let updatedCount = 0;
    const uploadBase = storage.getUploadDir();

    for (const p of photosList) {
      // 如果日期或地点已存在，则跳过
      if (p.date && p.location) continue;

      let relPath = p.url;
      if (relPath.startsWith('/uploads/')) {
        relPath = relPath.replace('/uploads/', '');
      }
      const fullPath = path.join(uploadBase, relPath);

      try {
        const fileBuf = await fs.readFile(fullPath);
        const meta = await parsePhotoExif(fileBuf);

        const newDate = p.date || meta.date;
        const newLoc = p.location || meta.location;

        if (newDate !== p.date || newLoc !== p.location) {
          await pool.query(
            'UPDATE photos SET date = $1, location = $2 WHERE id = $3',
            [newDate, newLoc, p.id]
          );
          updatedCount++;
        }
      } catch (err) {
        // 单个文件读取失败忽略
      }
    }

    return jsonResponse({
      success: true,
      scanned: photosList.length,
      updated: updatedCount,
      message: `已扫描 ${photosList.length} 张照片，成功补全 ${updatedCount} 张的拍摄信息`
    });
  } catch (error: any) {
    console.error('批量同步 EXIF 失败:', error);
    return errorResponse(error.message, 500);
  }
});

/**
 * POST /api/albums/:id/photos/reorder
 * 批量更新照片顺序
 */
photos.post('/reorder', async (c) => {
  const client = await pool.connect();
  try {
    const albumId = parseInt(c.req.param('id') || '');
    if (isNaN(albumId)) {
      return errorResponse('无效的相册ID', 400);
    }

    const items = (await c.req.json()) as ReorderItem[];
    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse('无效的排序数据', 400);
    }

    await client.query('BEGIN');

    for (const item of items) {
      await client.query(
        'UPDATE photos SET sort_order = $1 WHERE id = $2 AND album_id = $3',
        [item.sort_order, item.id, albumId]
      );
    }

    await client.query('COMMIT');

    return jsonResponse({ success: true, message: '顺序更新成功' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('更新照片顺序失败:', error);
    return errorResponse(error.message, 500);
  } finally {
    client.release();
  }
});

/**
 * PUT /api/albums/:id/photos/:photoId
 * 更新照片信息 (如标题、排序)
 */
photos.put('/:photoId', async (c) => {
  try {
    const albumId = parseInt(c.req.param('id') || '');
    const photoId = parseInt(c.req.param('photoId') || '');

    if (isNaN(albumId) || isNaN(photoId)) {
      return errorResponse('无效的相册ID或照片ID', 400);
    }

    const data = (await c.req.json()) as { caption?: string; sort_order?: number };

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.caption !== undefined) {
      updates.push(`caption = $${paramIndex++}`);
      params.push(data.caption);
    }

    if (data.sort_order !== undefined) {
      updates.push(`sort_order = $${paramIndex++}`);
      params.push(data.sort_order);
    }

    if (updates.length === 0) {
      return errorResponse('没有提供要更新的字段', 400);
    }

    params.push(photoId);
    params.push(albumId);

    const query = `UPDATE photos SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND album_id = $${paramIndex++}`;
    const { rowCount } = await pool.query(query, params);

    if (rowCount === 0) {
      return errorResponse('照片不存在或未更新', 404);
    }

    return jsonResponse({ success: true, message: '照片更新成功' });
  } catch (error: any) {
    console.error('更新照片失败:', error);
    return errorResponse(error.message, 500);
  }
});

/**
 * DELETE /api/albums/:id/photos/:photoId
 * 删除单张相册照片
 */
photos.delete('/:photoId', async (c) => {
  try {
    const albumId = parseInt(c.req.param('id') || '');
    const photoId = parseInt(c.req.param('photoId') || '');

    if (isNaN(albumId) || isNaN(photoId)) {
      return errorResponse('无效的相册ID或照片ID', 400);
    }

    // 1. 获取照片信息以删除本地物理文件
    const { rows: photoRows } = await pool.query(
      'SELECT * FROM photos WHERE id = $1 AND album_id = $2',
      [photoId, albumId]
    );
    const photo = photoRows[0] as Photo;

    if (!photo) {
      return errorResponse('照片不存在', 404);
    }

    // 2. 从本地存储物理删除文件
    if (photo.url) {
      let key = '';
      if (photo.url.includes('/uploads/')) {
        key = photo.url.split('/uploads/')[1] || '';
      } else if (photo.url.includes('/api/images/')) {
        key = photo.url.split('/api/images/')[1] || '';
      }

      if (key) {
        try {
          await storage.delete(decodeURIComponent(key));
        } catch (e) {
          console.error('删除本地图片文件失败:', key, e);
        }
      }
    }

    // 3. 从数据库删除记录
    await pool.query('DELETE FROM photos WHERE id = $1', [photoId]);

    return jsonResponse({ success: true, message: '照片已彻底删除' });
  } catch (error: any) {
    console.error('删除照片失败:', error);
    return errorResponse(error.message, 500);
  }
});

/**
 * 兼容旧端点: POST /api/delete/photo
 * 用于兼容原有的删除照片 POST 端点
 */
export async function handleLegacyDeletePhoto(c: any) {
  try {
    const { photoId, url } = (await c.req.json()) as { photoId: number; url: string };

    if (!photoId) {
      return errorResponse('未指定照片 ID', 400);
    }

    // 1. 物理删除文件
    if (url) {
      let key = '';
      if (url.includes('/uploads/')) {
        key = url.split('/uploads/')[1] || '';
      } else if (url.includes('/api/images/')) {
        key = url.split('/api/images/')[1] || '';
      }

      if (key) {
        try {
          await storage.delete(decodeURIComponent(key));
        } catch (e) {
          console.error('物理删除本地图片失败:', key, e);
        }
      }
    }

    // 2. 从数据库删除记录
    await pool.query('DELETE FROM photos WHERE id = $1', [photoId]);

    return jsonResponse({ success: true, message: '照片已彻底删除' });
  } catch (error: any) {
    console.error('兼容删除照片接口失败:', error);
    return errorResponse(error.message, 500);
  }
}

export default photos;

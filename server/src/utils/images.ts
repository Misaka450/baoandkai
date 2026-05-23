import pg from 'pg';
import { pool } from '../lib/db.js';

export interface ImageRecord {
  id: number;
  entity_type: string;
  entity_id: number;
  url: string;
  caption?: string;
  sort_order: number;
  created_at: string;
}

/**
 * 获取指定实体的所有图片（按排序字段排列）
 */
export async function getEntityImages(
  db: pg.Pool | pg.PoolClient,
  entityType: string,
  entityId: number
): Promise<ImageRecord[]> {
  const { rows } = await db.query(
    'SELECT * FROM images WHERE entity_type = $1 AND entity_id = $2 ORDER BY sort_order ASC',
    [entityType, entityId]
  );
  return rows as ImageRecord[];
}

/**
 * 批量获取多个实体的图片（按 entity_id 分组）
 * 返回 Map<entityId, ImageRecord[]>
 */
export async function getBatchEntityImages(
  db: pg.Pool | pg.PoolClient,
  entityType: string,
  entityIds: number[]
): Promise<Map<number, ImageRecord[]>> {
  if (entityIds.length === 0) return new Map();

  const placeholders = entityIds.map((_, index) => `$${index + 2}`).join(',');
  const { rows } = await db.query(
    `SELECT * FROM images WHERE entity_type = $1 AND entity_id IN (${placeholders}) ORDER BY sort_order ASC`,
    [entityType, ...entityIds]
  );

  const map = new Map<number, ImageRecord[]>();
  for (const img of rows as ImageRecord[]) {
    const list = map.get(img.entity_id) || [];
    list.push(img);
    map.set(img.entity_id, list);
  }
  return map;
}

/**
 * 替换实体的所有图片（先删后插）
 * 用事务处理
 */
export async function replaceEntityImages(
  db: pg.Pool,
  entityType: string,
  entityId: number,
  images: { url: string; caption?: string }[]
): Promise<void> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'DELETE FROM images WHERE entity_type = $1 AND entity_id = $2',
      [entityType, entityId]
    );

    for (let i = 0; i < images.length; i++) {
      const img = images[i]!;
      await client.query(
        'INSERT INTO images (entity_type, entity_id, url, caption, sort_order) VALUES ($1, $2, $3, $4, $5)',
        [entityType, entityId, img.url, img.caption || null, i]
      );
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/**
 * 删除实体的所有图片
 */
export async function deleteEntityImages(
  db: pg.Pool | pg.PoolClient,
  entityType: string,
  entityId: number
): Promise<void> {
  await db.query(
    'DELETE FROM images WHERE entity_type = $1 AND entity_id = $2',
    [entityType, entityId]
  );
}

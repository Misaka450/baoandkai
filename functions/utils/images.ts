/**
 * 图片关联表查询辅助函数
 * 替代旧的 images TEXT 字段，使用多态关联统一管理图片
 */

export interface ImageRecord {
    id: number
    entity_type: string
    entity_id: number
    url: string
    caption?: string
    sort_order: number
    created_at: string
}

/**
 * 获取指定实体的所有图片（按排序字段排列）
 */
export async function getEntityImages(
    db: D1Database,
    entityType: string,
    entityId: number
): Promise<ImageRecord[]> {
    const result = await db.prepare(
        'SELECT * FROM images WHERE entity_type = ? AND entity_id = ? ORDER BY sort_order ASC'
    )
        .bind(entityType, entityId)
        .all<ImageRecord>()
    return result.results
}

/**
 * 批量获取多个实体的图片（按 entity_id 分组）
 * 返回 Map<entityId, ImageRecord[]>
 */
export async function getBatchEntityImages(
    db: D1Database,
    entityType: string,
    entityIds: number[]
): Promise<Map<number, ImageRecord[]>> {
    if (entityIds.length === 0) return new Map()

    const placeholders = entityIds.map(() => '?').join(',')
    const result = await db.prepare(
        `SELECT * FROM images WHERE entity_type = ? AND entity_id IN (${placeholders}) ORDER BY sort_order ASC`
    )
        .bind(entityType, ...entityIds)
        .all<ImageRecord>()

    const map = new Map<number, ImageRecord[]>()
    for (const img of result.results) {
        const list = map.get(img.entity_id) || []
        list.push(img)
        map.set(img.entity_id, list)
    }
    return map
}

/**
 * 替换实体的所有图片（先删后插）
 */
export async function replaceEntityImages(
    db: D1Database,
    entityType: string,
    entityId: number,
    images: { url: string; caption?: string }[]
): Promise<void> {
    const batch: D1PreparedStatement[] = []

    batch.push(
        db.prepare('DELETE FROM images WHERE entity_type = ? AND entity_id = ?')
            .bind(entityType, entityId)
    )

    images.forEach((img, index) => {
        batch.push(
            db.prepare(
                'INSERT INTO images (entity_type, entity_id, url, caption, sort_order) VALUES (?, ?, ?, ?, ?)'
            ).bind(entityType, entityId, img.url, img.caption || null, index)
        )
    })

    await db.batch(batch)
}

/**
 * 删除实体的所有图片
 */
export async function deleteEntityImages(
    db: D1Database,
    entityType: string,
    entityId: number
): Promise<void> {
    await db.prepare('DELETE FROM images WHERE entity_type = ? AND entity_id = ?')
        .bind(entityType, entityId)
        .run()
}

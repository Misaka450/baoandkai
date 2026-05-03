-- =====================================================
-- 迁移 001：创建 images 关联表
-- 将 timeline_events / food_checkins / map_checkins / todos
-- 中的 images TEXT 字段迁移为独立的多态关联表
-- =====================================================

-- 1. 创建 images 关联表
CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_images_entity ON images(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_images_entity_sort ON images(entity_type, entity_id, sort_order);

-- 2. 迁移 timeline_events 的 images 数据
INSERT INTO images (entity_type, entity_id, url, sort_order)
SELECT 'timeline', id, value, rowid - 1
FROM timeline_events, json_each(images)
WHERE images IS NOT NULL AND images != '' AND images != '[]';

-- 3. 迁移 food_checkins 的 images 数据
INSERT INTO images (entity_type, entity_id, url, sort_order)
SELECT 'food', id, value, rowid - 1
FROM food_checkins, json_each(images)
WHERE images IS NOT NULL AND images != '' AND images != '[]';

-- 4. 迁移 map_checkins 的 images 数据
INSERT INTO images (entity_type, entity_id, url, sort_order)
SELECT 'map', id, value, rowid - 1
FROM map_checkins, json_each(images)
WHERE images IS NOT NULL AND images != '' AND images != '[]';

-- 5. 迁移 todos 的 images 数据
INSERT INTO images (entity_type, entity_id, url, sort_order)
SELECT 'todo', id, value, rowid - 1
FROM todos, json_each(images)
WHERE images IS NOT NULL AND images != '' AND images != '[]';

-- 6. 迁移 todos 的 completion_photos 数据
INSERT INTO images (entity_type, entity_id, url, sort_order)
SELECT 'todo_completion', id, value, rowid - 1
FROM todos, json_each(completion_photos)
WHERE completion_photos IS NOT NULL AND completion_photos != '' AND completion_photos != '[]';

-- 注意：旧字段 images / completion_photos 暂时保留不删除
-- 等所有 API 代码迁移完成后，再执行清理迁移删除旧字段

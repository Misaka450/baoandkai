-- 直接在Cloudflare D1控制台执行的SQL脚本
-- 数据库名称: oursql

-- 1. 为photos表添加排序字段
ALTER TABLE photos ADD COLUMN sort_order INTEGER DEFAULT 0;

-- 2. 创建索引优化查询性能
CREATE INDEX idx_photos_sort_order ON photos(album_id, sort_order);

-- 3. 更新现有照片的排序值（按ID顺序作为默认排序）
UPDATE photos SET sort_order = id;

-- 4. 验证修改结果
SELECT 
    id,
    album_id,
    url,
    sort_order,
    created_at
FROM photos 
ORDER BY album_id, sort_order
LIMIT 10;
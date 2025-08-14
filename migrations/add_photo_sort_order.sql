-- 为照片表添加排序字段，支持用户自定义图片顺序
-- 这个字段将保存用户在相册中手动排列的图片顺序

ALTER TABLE photos ADD COLUMN sort_order INTEGER DEFAULT 0;

-- 创建索引以优化按排序查询
CREATE INDEX idx_photos_sort_order ON photos(album_id, sort_order);

-- 更新现有照片的排序值（按ID顺序作为默认排序）
UPDATE photos SET sort_order = id;
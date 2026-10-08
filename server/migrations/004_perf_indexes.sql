-- =====================================================
-- 004_perf_indexes.sql — 高频查询性能优化索引
-- =====================================================

-- 1. 那年今日（同月同日回忆检索）表达式索引：避免每次查询发生全表模糊扫描
CREATE INDEX IF NOT EXISTS idx_timeline_month_day ON timeline_events(SUBSTRING(date FROM 6 FOR 5));
CREATE INDEX IF NOT EXISTS idx_photos_month_day ON photos(SUBSTRING(date FROM 6 FOR 5));

-- 2. 相册首图与排序复合索引（加速相册列表分页查询）
CREATE INDEX IF NOT EXISTS idx_photos_album_sort_id ON photos(album_id, sort_order ASC, id ASC);

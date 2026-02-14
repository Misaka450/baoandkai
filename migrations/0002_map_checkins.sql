-- 地图打卡功能
CREATE TABLE IF NOT EXISTS map_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  province TEXT NOT NULL,
  city TEXT,
  date TEXT NOT NULL,
  images TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_map_checkins_province ON map_checkins(province);
CREATE INDEX IF NOT EXISTS idx_map_checkins_date ON map_checkins(date);
CREATE INDEX IF NOT EXISTS idx_map_checkins_created_at ON map_checkins(created_at);

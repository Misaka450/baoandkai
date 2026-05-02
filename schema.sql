-- =====================================================
-- 包包和恺恺的小窝 - 数据库结构定义
-- 版本: 2.0.0
-- 更新日期: 2026-04-13
-- =====================================================

PRAGMA defer_foreign_keys = TRUE;

-- -------------------------------------------------------
-- 1. 用户表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  couple_name1 TEXT NOT NULL,
  couple_name2 TEXT NOT NULL,
  anniversary_date TEXT NOT NULL,
  home_title TEXT DEFAULT '包包和恺恺的小窝',
  home_subtitle TEXT DEFAULT '遇见你，是银河赠予我的糖。',
  avatar1 TEXT,
  avatar2 TEXT,
  background_image TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime')),
  token TEXT,
  token_expires DATETIME
);

-- 用户认证 Token 索引
CREATE INDEX IF NOT EXISTS idx_users_token ON users(token);

-- -------------------------------------------------------
-- 2. 相册表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS albums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 相册名称唯一索引（防止重名相册）
CREATE UNIQUE INDEX IF NOT EXISTS idx_albums_name ON albums(name);
CREATE INDEX IF NOT EXISTS idx_albums_created_at ON albums(created_at);

-- -------------------------------------------------------
-- 3. 照片表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  album_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  date TEXT,
  location TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);

-- 照片查询优化索引
CREATE INDEX IF NOT EXISTS idx_photos_album_id ON photos(album_id);
CREATE INDEX IF NOT EXISTS idx_photos_album_sort ON photos(album_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);

-- -------------------------------------------------------
-- 4. 时间轴事件表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS timeline_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  location TEXT,
  category TEXT,
  images TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 时间轴查询优化索引
CREATE INDEX IF NOT EXISTS idx_timeline_date ON timeline_events(date);
CREATE INDEX IF NOT EXISTS idx_timeline_category ON timeline_events(category);
CREATE INDEX IF NOT EXISTS idx_timeline_created_at ON timeline_events(created_at);

-- -------------------------------------------------------
-- 5. 美食打卡表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS food_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurant_name TEXT NOT NULL,
  address TEXT,
  cuisine TEXT,
  date TEXT NOT NULL,
  description TEXT,
  taste_rating INTEGER CHECK (taste_rating BETWEEN 1 AND 5),
  environment_rating INTEGER CHECK (environment_rating BETWEEN 1 AND 5),
  service_rating INTEGER CHECK (service_rating BETWEEN 1 AND 5),
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  recommended_dishes TEXT,
  price_range TEXT,
  images TEXT,
  latitude REAL,
  longitude REAL,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 美食打卡查询优化索引
CREATE INDEX IF NOT EXISTS idx_food_date ON food_checkins(date);
CREATE INDEX IF NOT EXISTS idx_food_rating ON food_checkins(overall_rating);
CREATE INDEX IF NOT EXISTS idx_food_created_at ON food_checkins(created_at);
CREATE INDEX IF NOT EXISTS idx_food_sort_order ON food_checkins(sort_order);

-- -------------------------------------------------------
-- 6. 便签/碎碎念表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  color TEXT DEFAULT 'bg-yellow-100 border-yellow-200',
  user_id INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 便签查询优化索引
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at);

-- -------------------------------------------------------
-- 7. 系统设置表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- -------------------------------------------------------
-- 8. 待办事项/甜蜜清单表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  due_date DATE,
  category TEXT DEFAULT 'general',
  completed_at DATETIME,
  completion_notes TEXT,
  completion_photos TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime')),
  images TEXT
);

-- 待办事项查询优化索引
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);

-- -------------------------------------------------------
-- 9. 地图打卡表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS map_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  province TEXT NOT NULL,
  city TEXT,
  date TEXT NOT NULL,
  images TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 地图打卡查询优化索引
CREATE INDEX IF NOT EXISTS idx_map_province ON map_checkins(province);
CREATE INDEX IF NOT EXISTS idx_map_city ON map_checkins(city);
CREATE INDEX IF NOT EXISTS idx_map_date ON map_checkins(date);

-- -------------------------------------------------------
-- 10. 时光胶囊表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS time_capsules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  message TEXT NOT NULL,
  unlock_date TEXT NOT NULL,
  is_unlocked INTEGER DEFAULT 0 CHECK (is_unlocked IN (0, 1)),
  created_by TEXT DEFAULT 'couple',
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 时光胶囊查询优化索引
CREATE INDEX IF NOT EXISTS idx_capsule_unlock_date ON time_capsules(unlock_date);
CREATE INDEX IF NOT EXISTS idx_capsule_is_unlocked ON time_capsules(is_unlocked);

-- -------------------------------------------------------
-- 11. 日记表 [已弃用] - 该功能已移除，表保留用于数据兼容
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS diaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  mood TEXT,
  weather TEXT,
  images TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- 日记查询优化索引 [已弃用]
CREATE INDEX IF NOT EXISTS idx_diary_date ON diaries(date);
CREATE INDEX IF NOT EXISTS idx_diary_mood ON diaries(mood);
CREATE INDEX IF NOT EXISTS idx_diary_created_at ON diaries(created_at);

-- -------------------------------------------------------
-- 触发器：自动更新 updated_at 字段
-- -------------------------------------------------------
CREATE TRIGGER IF NOT EXISTS tr_users_updated
  AFTER UPDATE ON users
  BEGIN
    UPDATE users SET updated_at = datetime('now', 'localtime') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS tr_albums_updated
  AFTER UPDATE ON albums
  BEGIN
    UPDATE albums SET updated_at = datetime('now', 'localtime') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS tr_timeline_updated
  AFTER UPDATE ON timeline_events
  BEGIN
    UPDATE timeline_events SET updated_at = datetime('now', 'localtime') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS tr_food_updated
  AFTER UPDATE ON food_checkins
  BEGIN
    UPDATE food_checkins SET updated_at = datetime('now', 'localtime') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS tr_notes_updated
  AFTER UPDATE ON notes
  BEGIN
    UPDATE notes SET updated_at = datetime('now', 'localtime') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS tr_todos_updated
  AFTER UPDATE ON todos
  BEGIN
    UPDATE todos SET updated_at = datetime('now', 'localtime') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS tr_map_updated
  AFTER UPDATE ON map_checkins
  BEGIN
    UPDATE map_checkins SET updated_at = datetime('now', 'localtime') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS tr_capsule_updated
  AFTER UPDATE ON time_capsules
  BEGIN
    UPDATE time_capsules SET updated_at = datetime('now', 'localtime') WHERE id = NEW.id;
  END;

-- 日记更新触发器 [已弃用]
CREATE TRIGGER IF NOT EXISTS tr_diary_updated
  AFTER UPDATE ON diaries
  BEGIN
    UPDATE diaries SET updated_at = datetime('now', 'localtime') WHERE id = NEW.id;
  END;

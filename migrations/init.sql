-- 用户表
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  couple_name1 TEXT NOT NULL,
  couple_name2 TEXT NOT NULL,
  anniversary_date TEXT NOT NULL,
  background_image TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 时间轴事件表
CREATE TABLE timeline_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  location TEXT,
  category TEXT,
  images TEXT, -- 用逗号分隔的图片URL
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 相册表
CREATE TABLE albums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 照片表
CREATE TABLE photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  album_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  date TEXT,
  location TEXT,
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);

-- 日记表
CREATE TABLE diaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  mood TEXT,
  weather TEXT,
  images TEXT, -- 用逗号分隔的图片URL
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 美食打卡表
CREATE TABLE food_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurant_name TEXT NOT NULL,
  address TEXT,
  cuisine TEXT,
  date TEXT NOT NULL,
  description TEXT,
  taste_rating INTEGER,
  environment_rating INTEGER,
  service_rating INTEGER,
  overall_rating INTEGER,
  recommended_dishes TEXT, -- 用逗号分隔
  price_range TEXT,
  images TEXT, -- 用逗号分隔的图片URL
  latitude REAL,
  longitude REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认管理员用户
INSERT INTO users (username, password_hash, email, couple_name1, couple_name2, anniversary_date)
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@example.com', '小明', '小红', '2023-01-01');

-- 创建索引优化查询性能
CREATE INDEX idx_timeline_date ON timeline_events(date);
CREATE INDEX idx_diary_date ON diaries(date);
CREATE INDEX idx_food_date ON food_checkins(date);
CREATE INDEX idx_photos_album ON photos(album_id);
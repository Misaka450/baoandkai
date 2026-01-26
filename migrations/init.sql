-- 数据库初始化脚本 - 最新版本
-- 包含所有必要的表结构、索引和初始数据

-- 1. 用户表 (users)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  couple_name1 TEXT NOT NULL,
  couple_name2 TEXT NOT NULL,
  anniversary_date TEXT NOT NULL,
  background_image TEXT,
  token TEXT,
  token_expires TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. 设置表 (settings)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 3. 碎碎念表 (notes)
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  color TEXT DEFAULT 'bg-yellow-100 border-yellow-200',
  likes INTEGER DEFAULT 0,
  user_id INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. 待办事项表 (todos)
CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  priority INTEGER DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  due_date TEXT,
  category TEXT DEFAULT 'general',
  images TEXT,
  completion_photos TEXT,
  completion_notes TEXT,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. 时间轴事件表 (timeline_events)
CREATE TABLE IF NOT EXISTS timeline_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  location TEXT,
  category TEXT DEFAULT '日常',
  images TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 6. 相册表 (albums)
CREATE TABLE IF NOT EXISTS albums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 7. 照片表 (photos)
CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  album_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);

-- 8. 美食打卡表 (food_checkins)
CREATE TABLE IF NOT EXISTS food_checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  restaurant_name TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  address TEXT,
  cuisine TEXT,
  price_range TEXT,
  overall_rating INTEGER DEFAULT 5,
  taste_rating INTEGER,
  environment_rating INTEGER,
  service_rating INTEGER,
  recommended_dishes TEXT,
  images TEXT,
  latitude REAL,
  longitude REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_users_token ON users(token);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);
CREATE INDEX IF NOT EXISTS idx_timeline_events_date ON timeline_events(date);
CREATE INDEX IF NOT EXISTS idx_timeline_events_category ON timeline_events(category);
CREATE INDEX IF NOT EXISTS idx_timeline_events_created_at ON timeline_events(created_at);
CREATE INDEX IF NOT EXISTS idx_albums_created_at ON albums(created_at);
CREATE INDEX IF NOT EXISTS idx_photos_album_id ON photos(album_id);
CREATE INDEX IF NOT EXISTS idx_photos_sort_order ON photos(album_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);
CREATE INDEX IF NOT EXISTS idx_food_checkins_date ON food_checkins(date);
CREATE INDEX IF NOT EXISTS idx_food_checkins_overall_rating ON food_checkins(overall_rating);
CREATE INDEX IF NOT EXISTS idx_food_checkins_created_at ON food_checkins(created_at);

-- 插入默认管理员用户 (密码: baobao123 的 bcrypt 哈希)
INSERT OR IGNORE INTO users (id, username, password_hash, email, couple_name1, couple_name2, anniversary_date)
VALUES (1, 'baobao', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'baobao@example.com', '包包', '恺恺', '2023-10-08');

-- 初始化默认配置
INSERT OR IGNORE INTO settings (key, value) VALUES ('site_config', '{"site_name": "包包和恺恺的故事", "site_description": "记录我们的点点滴滴", "theme": "light"}');

-- 插入示例碎碎念
INSERT OR IGNORE INTO notes (id, content, color, user_id) VALUES 
(1, '今天天气真好，想和你一起散步', 'bg-yellow-100 border-yellow-200', 1),
(2, '突然想到你笑起来的样子，好可爱', 'bg-pink-100 border-pink-200', 1),
(3, '想你了，不知道你现在在做什么', 'bg-blue-100 border-blue-200', 1);
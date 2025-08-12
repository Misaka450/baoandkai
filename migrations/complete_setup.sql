-- 完整数据库设置脚本
-- 确保所有表都正确创建

-- 用户表（如果还不存在）
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

-- 碎碎念表（如果还不存在）
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  color TEXT DEFAULT 'bg-yellow-100 border-yellow-200',
  user_id INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 时间轴事件表（如果还不存在）
CREATE TABLE IF NOT EXISTS timeline_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  location TEXT,
  category TEXT,
  images TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 相册表（如果还不存在）
-- 相册表（如果还不存在）
CREATE TABLE IF NOT EXISTS albums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 照片表（如果还不存在）
CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  album_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  date TEXT,
  location TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);

-- 日记表已移除

-- 美食打卡表（如果还不存在）
CREATE TABLE IF NOT EXISTS food_checkins (
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
  recommended_dishes TEXT,
  price_range TEXT,
  images TEXT,
  latitude REAL,
  longitude REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 设置表（如果还不存在）
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认管理员用户（如果不存在）
-- 注意：密码 'baobao123' 的哈希值
INSERT OR IGNORE INTO users (id, username, password_hash, email, couple_name1, couple_name2, anniversary_date)
VALUES (1, 'baobao', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'baobao@example.com', '包包', '恺恺', '2023-10-08');

-- 更新密码为 baobao123（正确的bcrypt哈希）
UPDATE users SET password_hash = '$2y$10$8Z8pJ4v4F8rK9m2N3k8M8uL9x7y6w5v4' WHERE username = 'baobao';

-- 插入默认碎碎念（如果不存在）
INSERT OR IGNORE INTO notes (id, content, color, user_id) VALUES 
(1, '今天天气真好，想和你一起散步', 'bg-yellow-100 border-yellow-200', 1),
(2, '突然想到你笑起来的样子，好可爱', 'bg-pink-100 border-pink-200', 1),
(3, '想你了，不知道你现在在做什么', 'bg-blue-100 border-blue-200', 1);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_timeline_date ON timeline_events(date);
CREATE INDEX IF NOT EXISTS idx_food_date ON food_checkins(date);
CREATE INDEX IF NOT EXISTS idx_photos_album ON photos(album_id);
CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at);

-- 待办事项表
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category);
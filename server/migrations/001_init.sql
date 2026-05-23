-- =====================================================
-- 包包和恺恺的小窝 - PostgreSQL 17 数据库结构定义
-- 版本: 2.0.0
-- =====================================================

-- -------------------------------------------------------
-- 1. 用户表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  couple_name1 VARCHAR(255) NOT NULL,
  couple_name2 VARCHAR(255) NOT NULL,
  anniversary_date VARCHAR(50) NOT NULL,
  home_title VARCHAR(255) DEFAULT '包包和恺恺的小窝',
  home_subtitle VARCHAR(255) DEFAULT '遇见你，是银河赠予我的糖。',
  avatar1 TEXT,
  avatar2 TEXT,
  background_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  token VARCHAR(255),
  token_expires TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_token ON users(token);

-- -------------------------------------------------------
-- 2. 相册表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS albums (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_albums_created_at ON albums(created_at);

-- -------------------------------------------------------
-- 3. 照片表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS photos (
  id SERIAL PRIMARY KEY,
  album_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  date VARCHAR(50),
  location TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_photos_album FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_photos_album_id ON photos(album_id);
CREATE INDEX IF NOT EXISTS idx_photos_album_sort ON photos(album_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);

-- -------------------------------------------------------
-- 4. 时间轴事件表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS timeline_events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date VARCHAR(50) NOT NULL,
  location TEXT,
  category VARCHAR(100),
  images TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_date ON timeline_events(date);
CREATE INDEX IF NOT EXISTS idx_timeline_category ON timeline_events(category);
CREATE INDEX IF NOT EXISTS idx_timeline_created_at ON timeline_events(created_at);

-- -------------------------------------------------------
-- 5. 美食打卡表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS food_checkins (
  id SERIAL PRIMARY KEY,
  restaurant_name VARCHAR(255) NOT NULL,
  address TEXT,
  cuisine VARCHAR(100),
  date VARCHAR(50) NOT NULL,
  description TEXT,
  taste_rating INTEGER CHECK (taste_rating BETWEEN 1 AND 5),
  environment_rating INTEGER CHECK (environment_rating BETWEEN 1 AND 5),
  service_rating INTEGER CHECK (service_rating BETWEEN 1 AND 5),
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  recommended_dishes TEXT,
  price_range VARCHAR(100),
  images TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_date ON food_checkins(date);
CREATE INDEX IF NOT EXISTS idx_food_rating ON food_checkins(overall_rating);
CREATE INDEX IF NOT EXISTS idx_food_created_at ON food_checkins(created_at);
CREATE INDEX IF NOT EXISTS idx_food_sort_order ON food_checkins(sort_order);

-- -------------------------------------------------------
-- 6. 便签/碎碎念表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  color VARCHAR(100) DEFAULT 'bg-yellow-100 border-yellow-200',
  user_id INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_notes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at);

-- -------------------------------------------------------
-- 7. 系统设置表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- -------------------------------------------------------
-- 8. 待办事项/甜蜜清单表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS todos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  due_date DATE,
  category VARCHAR(100) DEFAULT 'general',
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_notes TEXT,
  completion_photos TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  images TEXT
);

CREATE INDEX IF NOT EXISTS idx_todos_status ON todos(status);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_category ON todos(category);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);

-- -------------------------------------------------------
-- 9. 地图打卡表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS map_checkins (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  province VARCHAR(100) NOT NULL,
  city VARCHAR(100),
  date VARCHAR(50) NOT NULL,
  images TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_map_province ON map_checkins(province);
CREATE INDEX IF NOT EXISTS idx_map_city ON map_checkins(city);
CREATE INDEX IF NOT EXISTS idx_map_date ON map_checkins(date);

-- -------------------------------------------------------
-- 10. 时光胶囊表
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS time_capsules (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  message TEXT NOT NULL,
  unlock_date VARCHAR(50) NOT NULL,
  is_unlocked INTEGER DEFAULT 0 CHECK (is_unlocked IN (0, 1)),
  created_by VARCHAR(100) DEFAULT 'couple',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_capsule_unlock_date ON time_capsules(unlock_date);
CREATE INDEX IF NOT EXISTS idx_capsule_is_unlocked ON time_capsules(is_unlocked);

-- -------------------------------------------------------
-- 11. 图片关联表（多态关联）
-- 统一管理各模块的图片，替代旧的 images TEXT 字段
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_images_entity ON images(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_images_entity_sort ON images(entity_type, entity_id, sort_order);

-- -------------------------------------------------------
-- 12. 日记表 [已弃用] - 保留数据兼容
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS diaries (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  date VARCHAR(50) NOT NULL,
  mood VARCHAR(100),
  weather VARCHAR(100),
  images TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diary_date ON diaries(date);
CREATE INDEX IF NOT EXISTS idx_diary_mood ON diaries(mood);
CREATE INDEX IF NOT EXISTS idx_diary_created_at ON diaries(created_at);

-- -------------------------------------------------------
-- 13. 创建触发器函数：更新 updated_at
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- -------------------------------------------------------
-- 14. 绑定触发器到各表
-- -------------------------------------------------------
CREATE OR REPLACE TRIGGER tr_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE OR REPLACE TRIGGER tr_albums_updated
  BEFORE UPDATE ON albums
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE OR REPLACE TRIGGER tr_timeline_updated
  BEFORE UPDATE ON timeline_events
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE OR REPLACE TRIGGER tr_food_updated
  BEFORE UPDATE ON food_checkins
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE OR REPLACE TRIGGER tr_notes_updated
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE OR REPLACE TRIGGER tr_todos_updated
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE OR REPLACE TRIGGER tr_map_updated
  BEFORE UPDATE ON map_checkins
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE OR REPLACE TRIGGER tr_capsule_updated
  BEFORE UPDATE ON time_capsules
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE OR REPLACE TRIGGER tr_diary_updated
  BEFORE UPDATE ON diaries
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

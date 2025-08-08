-- 创建碎碎念表
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  color TEXT DEFAULT 'bg-yellow-100 border-yellow-200',
  user_id INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 插入一些示例碎碎念
INSERT INTO notes (content, color, user_id) VALUES 
('今天天气真好，想和你一起散步', 'bg-yellow-100 border-yellow-200', 1),
('突然想到你笑起来的样子，好可爱', 'bg-pink-100 border-pink-200', 1),
('想你了，不知道你现在在做什么', 'bg-blue-100 border-blue-200', 1);
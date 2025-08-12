-- 添加示例相册和照片数据

-- 添加示例相册
INSERT INTO albums (name, description, cover_image) VALUES 
('我们的第一次约会', '2023年10月8日，第一次约会的甜蜜回忆', 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=500'),
('生日惊喜', '恺恺的生日，包包精心准备的惊喜', 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=500'),
('周末小旅行', '一起去的城市小旅行', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500');

-- 为第一个相册添加照片
INSERT INTO photos (album_id, url, caption) VALUES 
(1, 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800', '第一次约会的咖啡厅'),
(1, 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800', '夕阳下的漫步'),
(1, 'https://images.unsplash.com/photo-1511920170033-f8396924c12c?w=800', '晚餐时光');

-- 为第二个相册添加照片
INSERT INTO photos (album_id, url, caption) VALUES 
(2, 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800', '生日蛋糕'),
(2, 'https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?w=800', '生日礼物'),
(2, 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800', '生日派对');

-- 为第三个相册添加照片
INSERT INTO photos (album_id, url, caption) VALUES 
(3, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800', '城市风景'),
(3, 'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=800', '美食时光'),
(3, 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800', '日落美景');
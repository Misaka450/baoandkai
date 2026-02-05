PRAGMA defer_foreign_keys=TRUE;
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
, token TEXT, token_expires DATETIME);
INSERT INTO "users" VALUES(1,'baobao','$2b$10$Us3.HjObBE.R8H920xyqhOzpjjdHRiqMpTBCDot7AVRXSUN026Te2','admin@example.com','包包','恺恺','2023-10-08',NULL,'2025-08-07 15:20:17','2025-08-07 15:20:17','80fa8602-be11-481e-9002-954f70e475f4','2026-02-12T15:38:31.511Z');
CREATE TABLE timeline_events (
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
INSERT INTO "timeline_events" VALUES(8,'第一次相遇','在小红书的帖子下第一次相遇','2023-08-05','小红书','约会','','2025-08-12 07:59:04','2025-08-12 07:59:04');
INSERT INTO "timeline_events" VALUES(13,'加上了微信','','2023-08-08','微信','约会','','2025-08-12 08:02:40','2025-08-12 08:02:40');
INSERT INTO "timeline_events" VALUES(14,'包包送我生日蛋糕','包包给我过的第一个生日，送我了一个小蛋糕','2023-08-17','公司宿舍','日常','','2025-08-12 08:08:58','2026-02-01 14:22:09');
INSERT INTO "timeline_events" VALUES(15,'和包包表白了','和包包逛了北街，晚上在楼下进行了表白','2023-10-08','商业自动化研究所','约会','','2025-08-12 08:11:04','2025-08-12 08:11:04');
INSERT INTO "timeline_events" VALUES(16,'到包包上门了','去包包家要名分喽','2025-02-03','枣阳公园一号','约会','','2025-08-12 08:21:09','2025-08-12 08:21:09');
INSERT INTO "timeline_events" VALUES(17,'两个人第一次去南京',replace('和李双还有她对象四人自驾南京！\n跨年我还把杨子恺惹哭了呜呜呜\n但是他丝毫不生我气哈哈哈','\n',char(10)),'2023-12-31','南京新街口','日常','https://pub-f3abc7adae724902b344281ec73f700c.r2.dev/timeline/1755095258745_w6kfxv.jpg,https://pub-f3abc7adae724902b344281ec73f700c.r2.dev/timeline/1755095282680_9ww930.jpg,https://pub-f3abc7adae724902b344281ec73f700c.r2.dev/timeline/1755095301501_ov0zau.jpg','2025-08-13 14:28:25','2025-08-13 14:28:25');
INSERT INTO "timeline_events" VALUES(19,'第一次去长沙','想吃心心念念的湘菜和茶颜悦色','2024-07-26','长沙','日常','https://img.980823.xyz/timeline/1755095556623_imblio.jpg,https://img.980823.xyz/timeline/1755095614145_zeqeua.jpg,https://img.980823.xyz/timeline/1755095622941_514m2n.jpg','2025-08-13 14:34:06','2026-01-31 12:40:57');
INSERT INTO "timeline_events" VALUES(20,'第一次去许昌胖东来','胖东来天使城，东西不便宜，人居多，炸鸡口味一般般...','2024-07-06','许昌','日常','https://pub-f3abc7adae724902b344281ec73f700c.r2.dev/timeline/1755095848842_l9fbz0.jpg,https://pub-f3abc7adae724902b344281ec73f700c.r2.dev/timeline/1755095853709_1egrhb.jpg','2025-08-13 14:37:40','2025-08-13 14:37:40');
INSERT INTO "timeline_events" VALUES(36,'给杨子恺过27岁生日啦','杨子恺爱吃麦当劳！这次给杨子恺买了麦当劳的蛋糕，在麦当劳餐厅给他过生日🎂','2025-08-24','襄阳市万达麦当劳餐厅','节日','https://img.980823.xyz/1769342236189-8n1bn6.JPG','2025-08-25 02:01:51','2026-02-01 14:21:48');
INSERT INTO "timeline_events" VALUES(41,'两周年纪念日','在一起两周年了！','2025-10-08','襄阳民发海底捞','纪念日','https://img.980823.xyz/timeline/1769955937870_zsra5v.jpg,https://img.980823.xyz/timeline/1769955946121_7619ks.jpg','2026-02-01 14:25:53','2026-02-01 14:25:53');
CREATE TABLE albums (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "albums" VALUES(10,'两周年纪念日','2025年10月8日，我们在一起两周年了！','https://img.980823.xyz/albums/两周年纪念日/1769349215640-72xw0t.JPG','2026-01-25 13:52:45','2026-01-25 14:03:00');
INSERT INTO "albums" VALUES(11,'六〇三文创园','2024年4月6日六〇三文创园','https://img.980823.xyz/albums/六〇三文创园/1769362534882-m55lwb.JPG','2026-01-25 17:33:08','2026-01-31 12:49:34');
INSERT INTO "albums" VALUES(13,'可爱包包','全是最可爱美丽的包包','https://img.980823.xyz/albums/可爱包包/1769956209584-uzuj.JPG','2026-02-01 13:52:55','2026-02-01 14:30:51');
CREATE TABLE photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  album_id INTEGER NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  date TEXT,
  location TEXT, sort_order INTEGER DEFAULT 0, created_at TEXT,
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
);
INSERT INTO "photos" VALUES(96,11,'https://img.980823.xyz/albums/六〇三文创园/1769362458077-56333u.JPG','DSCF0511.JPG',NULL,NULL,0,'2026-01-25 17:34:18');
INSERT INTO "photos" VALUES(97,11,'https://img.980823.xyz/albums/六〇三文创园/1769362467767-ef5hvd.JPG','DSCF0545.JPG',NULL,NULL,0,'2026-01-25 17:34:29');
INSERT INTO "photos" VALUES(98,11,'https://img.980823.xyz/albums/六〇三文创园/1769362477919-58bl1v.JPG','DSCF0569.JPG',NULL,NULL,0,'2026-01-25 17:34:38');
INSERT INTO "photos" VALUES(99,11,'https://img.980823.xyz/albums/六〇三文创园/1769362486029-jyv92s.JPG','DSCF0580.JPG',NULL,NULL,0,'2026-01-25 17:34:46');
INSERT INTO "photos" VALUES(100,11,'https://img.980823.xyz/albums/六〇三文创园/1769362494156-oc0484.JPG','DSCF0584.JPG',NULL,NULL,0,'2026-01-25 17:34:55');
INSERT INTO "photos" VALUES(102,11,'https://img.980823.xyz/albums/六〇三文创园/1769362513842-topehj.JPG','DSCF0612.JPG',NULL,NULL,0,'2026-01-25 17:35:15');
INSERT INTO "photos" VALUES(103,11,'https://img.980823.xyz/albums/六〇三文创园/1769362525289-khg2gc.JPG','DSCF0630.JPG',NULL,NULL,0,'2026-01-25 17:35:27');
INSERT INTO "photos" VALUES(104,11,'https://img.980823.xyz/albums/六〇三文创园/1769362534882-m55lwb.JPG','DSCF0641.JPG',NULL,NULL,0,'2026-01-25 17:35:35');
INSERT INTO "photos" VALUES(137,10,'https://img.980823.xyz/albums/两周年纪念日/1769953897923-zd4rml.JPG','DSCF3583.JPG',NULL,NULL,0,'2026-02-01 13:51:39');
INSERT INTO "photos" VALUES(138,10,'https://img.980823.xyz/albums/两周年纪念日/1769953910278-qhmpm.JPG','DSCF3589.JPG',NULL,NULL,1,'2026-02-01 13:51:52');
INSERT INTO "photos" VALUES(139,10,'https://img.980823.xyz/albums/两周年纪念日/1769953918769-4j0j1.JPG','DSCF3603.JPG',NULL,NULL,2,'2026-02-01 13:51:59');
INSERT INTO "photos" VALUES(142,13,'https://img.980823.xyz/albums/可爱包包/1769954211575-mmyeee.jpg','烤肉包包',NULL,NULL,1,'2026-02-01 13:56:53');
INSERT INTO "photos" VALUES(143,13,'https://img.980823.xyz/albums/可爱包包/1769954225344-k447t5.jpg','卷毛包包',NULL,NULL,5,'2026-02-01 13:57:09');
INSERT INTO "photos" VALUES(145,13,'https://img.980823.xyz/albums/可爱包包/1769954242215-o9vkcq.jpg','微信图片_20250803215514.jpg',NULL,NULL,11,'2026-02-01 13:57:25');
INSERT INTO "photos" VALUES(147,13,'https://img.980823.xyz/albums/可爱包包/1769956156304-5nzfxn.JPG','叉腰包包',NULL,NULL,2,'2026-02-01 14:29:17');
INSERT INTO "photos" VALUES(148,13,'https://img.980823.xyz/albums/可爱包包/1769956163064-7zkvr4.JPG','购物包包',NULL,NULL,7,'2026-02-01 14:29:24');
INSERT INTO "photos" VALUES(149,13,'https://img.980823.xyz/albums/可爱包包/1769956169180-vcoyvui.JPG','美伢包包',NULL,NULL,3,'2026-02-01 14:29:30');
INSERT INTO "photos" VALUES(150,13,'https://img.980823.xyz/albums/可爱包包/1769956175239-6scgj.JPG','DSCF3491.JPG',NULL,NULL,10,'2026-02-01 14:29:36');
INSERT INTO "photos" VALUES(151,13,'https://img.980823.xyz/albums/可爱包包/1769956181689-2egcf.JPG','DSCF3546.JPG',NULL,NULL,12,'2026-02-01 14:29:42');
INSERT INTO "photos" VALUES(152,13,'https://img.980823.xyz/albums/可爱包包/1769956188276-cx2z0n.JPG','两周年包包',NULL,NULL,4,'2026-02-01 14:29:49');
INSERT INTO "photos" VALUES(153,13,'https://img.980823.xyz/albums/可爱包包/1769956201254-hbh1ej.JPG','音乐节包包',NULL,NULL,6,'2026-02-01 14:30:02');
INSERT INTO "photos" VALUES(154,13,'https://img.980823.xyz/albums/可爱包包/1769956209584-uzuj.JPG','淑女包包',NULL,NULL,0,'2026-02-01 14:30:10');
INSERT INTO "photos" VALUES(155,13,'https://img.980823.xyz/albums/可爱包包/1769956218773-ryquw.JPG','芦苇包包',NULL,NULL,8,'2026-02-01 14:30:20');
INSERT INTO "photos" VALUES(156,13,'https://img.980823.xyz/albums/可爱包包/1770305934569-po01rt.JPG','DSCF3014.JPG',NULL,NULL,9,'2026-02-05 15:38:56');
CREATE TABLE diaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  mood TEXT,
  weather TEXT,
  images TEXT, 
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "diaries" VALUES(1,'2','23','2025-08-09','开心','晴天','','2025-08-07 16:19:27','2025-08-07 16:19:27');
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
  recommended_dishes TEXT, 
  price_range TEXT,
  images TEXT, 
  latitude REAL,
  longitude REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "food_checkins" VALUES(4,'六化建烧烤','','烧烤','2025-08-09','',5,5,5,5,'','70','https://pub-f3abc7adae724902b344281ec73f700c.r2.dev/food/1755092257645_omg04p.jpg,https://pub-f3abc7adae724902b344281ec73f700c.r2.dev/food/1755092269543_33gies.jpg,https://pub-f3abc7adae724902b344281ec73f700c.r2.dev/food/1755092282435_nl6zij.jpg,https://pub-f3abc7adae724902b344281ec73f700c.r2.dev/food/1755092287574_hy1lwi.jpg',NULL,NULL,'2025-08-13 13:38:13','2025-08-13 13:38:13');
INSERT INTO "food_checkins" VALUES(5,'烧鸡公(新华路店）','','中餐','2025-08-09','',5,5,5,5,'','60','https://pub-f3abc7adae724902b344281ec73f700c.r2.dev/food/1755092447249_4l1s92.jpg,https://pub-f3abc7adae724902b344281ec73f700c.r2.dev/food/1755092461734_phvcxg.jpg,https://pub-f3abc7adae724902b344281ec73f700c.r2.dev/food/1755092467339_r03uvr.jpg,https://pub-f3abc7adae724902b344281ec73f700c.r2.dev/food/1755092473600_tvrjeh.jpg,https://pub-f3abc7adae724902b344281ec73f700c.r2.dev/food/1755092478273_z0twdl.jpg',NULL,NULL,'2025-08-13 13:41:27','2025-08-21 02:47:13');
INSERT INTO "food_checkins" VALUES(6,'熊猫钵钵鸡','春园路熊猫钵钵鸡','中餐','2025-08-16','',5,5,5,5,'','109','https://pub-f3abc7adae724902b344281ec73f700c.r2.dev/food/1755325254714_ljypco.jpg',NULL,NULL,'2025-08-16 06:22:42','2025-08-16 06:22:42');
INSERT INTO "food_checkins" VALUES(7,'鹅掌炖泥鳅','新华路','中餐','2025-08-23','我觉得味道很不错，但是人均有点贵',5,5,5,5,'','100','https://pub-f3abc7adae724902b344281ec73f700c.r2.dev/food/1756120428247_nty1zj.jpg,https://pub-f3abc7adae724902b344281ec73f700c.r2.dev/food/1756120429625_8920nu.jpg,https://pub-f3abc7adae724902b344281ec73f700c.r2.dev/food/1756120480332_73xl4b.jpg',NULL,NULL,'2025-08-25 11:15:20','2025-08-25 11:15:20');
CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  color TEXT DEFAULT 'bg-yellow-100 border-yellow-200',
  user_id INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT INTO "notes" VALUES(2,'突然想到你笑起来的样子，好可爱','bg-pink-100 border-pink-200',1,'2025-08-08 14:26:54','2025-08-08 14:26:54');
INSERT INTO "notes" VALUES(13,'包包想添加些什么内容呢','slate',1,'2025-08-13 02:49:01','2025-08-13 02:49:01');
INSERT INTO "notes" VALUES(15,'在一起的第二年过年，我睡着了，结果就是你熬到了零点给我说了新年快乐，我也收到了红包🧧，嘿嘿','emerald',1,'2025-08-22 09:58:24','2025-08-22 09:58:24');
INSERT INTO "notes" VALUES(16,'和恺恺一起学会了游泳，但是他游的比我好，哼😡','rose',1,'2025-08-22 13:45:51','2025-08-22 13:45:51');
INSERT INTO "notes" VALUES(17,'好像知道杨子恺的生日愿望是啥样^_^^_^好奇','rose',1,'2025-08-25 02:04:17','2025-08-25 02:04:17');
CREATE TABLE settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "settings" VALUES(3,'site_config','{"coupleName1":"包包","coupleName2":"恺恺","anniversaryDate":"2023-10-08","homeTitle":"包包和恺恺的小窝","homeSubtitle":"遇见你，是银河赠予我的糖。","avatar1":"https://img.980823.xyz/avatars/1769362213720-ap89fz.png","avatar2":"https://img.980823.xyz/avatars/1769362216471-xuhd1h.png","theme":"light","enableSeasonTheme":true,"showFloatingElements":true,"animationLevel":"normal","site_name":"包包和恺恺的故事","site_description":"记录我们的点点滴滴","customAvatar1":"https://img.980823.xyz/avatars/1769362213720-ap89fz.png","customAvatar2":"https://img.980823.xyz/avatars/1769362216471-xuhd1h.png"}','2026-02-01 09:30:39','2026-02-01 09:30:39');
CREATE TABLE todos (
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
      , images TEXT);
INSERT INTO "todos" VALUES(7,'攀爬泰山','都说爬山可以考验感情，爬过泰山后我们感情只会更好。','pending',3,NULL,'life',NULL,NULL,NULL,'2025-08-13 02:52:11','2025-08-13 02:52:11',NULL);
INSERT INTO "todos" VALUES(8,'学会游泳','','completed',2,'2025-09-01','general',NULL,NULL,'[]','2025-08-13 09:02:15','2025-08-22 13:43:58',NULL);
INSERT INTO "todos" VALUES(9,'和杨子恺一起去三亚度假','想和恺恺一起去三亚的海边骑着车，吹着海风，品尝当地的美食！','pending',3,NULL,'general',NULL,NULL,NULL,'2025-08-13 13:53:46','2025-08-13 13:53:46',NULL);
INSERT INTO "todos" VALUES(10,'去新疆度蜜月','大美新疆！此生一定要去!','pending',2,NULL,'general',NULL,NULL,NULL,'2025-08-13 13:54:41','2025-08-13 13:54:41',NULL);
INSERT INTO "todos" VALUES(11,'在江南，穿旗袍，拍美照！','','pending',3,NULL,'general',NULL,NULL,NULL,'2025-08-13 13:55:50','2025-08-13 13:55:50',NULL);
INSERT INTO "todos" VALUES(12,'去云南！','心心念念的玉龙雪山！我们来啦','pending',3,NULL,'general',NULL,NULL,NULL,'2025-08-13 13:57:28','2025-08-13 13:57:28',NULL);
INSERT INTO "todos" VALUES(13,'和杨子恺一起拍海马体情侣写真！','马上恺恺要取牙套了，爱跟风的包包必须安排海马体！','pending',3,NULL,'general',NULL,NULL,NULL,'2025-08-13 13:59:19','2025-08-13 13:59:19',NULL);
INSERT INTO "todos" VALUES(14,'给包包买LV!','考上拿奖金买！加油！冲鸭！','pending',3,NULL,'general',NULL,NULL,NULL,'2025-08-13 14:00:49','2025-08-13 14:00:49',NULL);
INSERT INTO "todos" VALUES(15,'粉笔模考上75！','今年的小目标，一定要做到！','pending',3,NULL,'general',NULL,NULL,NULL,'2025-08-13 14:02:15','2025-08-13 14:02:15',NULL);
INSERT INTO "todos" VALUES(20,'一起去看 2026 年的第一场雪','希望今年的初雪我们能在一起。','pending',3,'2026-12-31','life',NULL,NULL,NULL,'2026-01-24 15:10:36','2026-01-24 15:10:36',NULL);
INSERT INTO "todos" VALUES(21,'给宝包买一个小惊喜','纪念重构成功的小礼物。','pending',3,'2026-01-25','general',NULL,NULL,NULL,'2026-01-24 15:10:36','2026-01-24 15:10:36',NULL);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" VALUES('users',1);
INSERT INTO "sqlite_sequence" VALUES('timeline_events',43);
INSERT INTO "sqlite_sequence" VALUES('diaries',1);
INSERT INTO "sqlite_sequence" VALUES('food_checkins',8);
INSERT INTO "sqlite_sequence" VALUES('albums',14);
INSERT INTO "sqlite_sequence" VALUES('photos',156);
INSERT INTO "sqlite_sequence" VALUES('notes',19);
INSERT INTO "sqlite_sequence" VALUES('settings',3);
INSERT INTO "sqlite_sequence" VALUES('todos',23);
CREATE INDEX idx_timeline_date ON timeline_events(date);
CREATE INDEX idx_diary_date ON diaries(date);
CREATE INDEX idx_food_date ON food_checkins(date);
CREATE INDEX idx_photos_album ON photos(album_id);
CREATE INDEX idx_notes_created ON notes(created_at);
CREATE INDEX idx_todos_status ON todos(status);
CREATE INDEX idx_todos_priority ON todos(priority);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_todos_category ON todos(category);
CREATE INDEX idx_photos_sort_order ON photos(album_id, sort_order);
CREATE INDEX idx_photos_album_id ON photos(album_id);
CREATE INDEX idx_albums_created_at ON albums(created_at);
CREATE INDEX idx_timeline_events_category ON timeline_events(category);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_users_token ON users(token);
CREATE INDEX idx_timeline_events_created_at ON timeline_events(created_at);
CREATE INDEX idx_todos_created_at ON todos(created_at);
CREATE INDEX idx_food_checkins_created_at ON food_checkins(created_at);
CREATE INDEX idx_food_checkins_overall_rating ON food_checkins(overall_rating);

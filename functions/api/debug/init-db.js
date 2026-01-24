export async function onRequestGet(context) {
  const { env } = context;

  const sqlCommands = [
    // users表
    `CREATE TABLE IF NOT EXISTS users (
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
    );`,
    `INSERT OR IGNORE INTO users (username, password_hash, email, couple_name1, couple_name2, anniversary_date)
     VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@example.com', '包包', '恺恺', '2023-10-08');`,

    // settings表
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`,
    `INSERT OR IGNORE INTO settings (key, value) VALUES ('site_config', '{"coupleName1": "包包", "coupleName2": "恺恺", "anniversaryDate": "2023-10-08"}');`,

    // notes表
    `CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      color TEXT,
      likes INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`,

    // todos表
    `CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      priority INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending',
      due_date TEXT,
      category TEXT,
      images TEXT,
      completion_photos TEXT,
      completion_notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`,

    // timeline_events表
    `CREATE TABLE IF NOT EXISTS timeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      location TEXT,
      category TEXT DEFAULT '日常',
      images TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`,

    // albums表
    `CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      cover_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`,

    // photos表
    `CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      album_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      caption TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
    );`,

    // food_checkins表
    `CREATE TABLE IF NOT EXISTS food_checkins (
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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );`,
    // 确保现有表有新列（忽略已存在的列错误）
    `ALTER TABLE todos ADD COLUMN images TEXT;`,
    `ALTER TABLE todos ADD COLUMN completion_photos TEXT;`,
    `ALTER TABLE todos ADD COLUMN completion_notes TEXT;`
  ];

  const results = [];
  for (const sql of sqlCommands) {
    try {
      const res = await env.DB.prepare(sql).run();
      results.push({ sql: sql.substring(0, 50) + "...", status: "ok", res });
    } catch (e) {
      results.push({ sql: sql.substring(0, 50) + "...", status: "error", error: e.message });
    }
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}

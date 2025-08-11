// 数据库检查脚本
const fs = require('fs');
const path = require('path');

// 读取所有迁移文件
const migrationsDir = path.join(__dirname, 'migrations');
const migrationFiles = [
  'init.sql',
  'add_todos.sql',
  'add_notes.sql',
  'complete_setup.sql',
  'fix_albums_schema.sql',
  'update_settings.sql'
];

console.log('=== 数据库迁移文件检查 ===');
migrationFiles.forEach(file => {
  const filePath = path.join(migrationsDir, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} 存在`);
    const content = fs.readFileSync(filePath, 'utf8');
    if (file === 'add_todos.sql') {
      console.log('--- add_todos.sql 内容 ---');
      console.log(content);
    }
  } else {
    console.log(`❌ ${file} 不存在`);
  }
});

console.log('\n=== 可能的解决方案 ===');
console.log('1. 确保所有迁移文件都已执行');
console.log('2. 检查todos表是否存在：SELECT * FROM todos LIMIT 1');
console.log('3. 检查表结构：PRAGMA table_info(todos)');
console.log('4. 使用调试端点：https://baoandkai.pages.dev/api/todos/test');
console.log('5. 使用HTML调试工具：打开 debug-todos.html 文件');

console.log('\n=== 快速修复方案 ===');
console.log('如果todos表不存在，可以手动执行：');
console.log(`
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
`);
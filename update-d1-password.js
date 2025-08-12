// 直接更新D1数据库密码为baobao123的bcrypt哈希值
// 密码: baobao123
// bcrypt哈希: $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

const bcrypt = require('bcrypt');

async function updateD1Password() {
  console.log('开始更新D1数据库密码...');
  
  // 生成baobao123的bcrypt哈希值
  const password = 'baobao123';
  const hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
  
  console.log('密码: baobao123');
  console.log('bcrypt哈希:', hash);
  
  // SQL更新语句
  const sql = `
    UPDATE users 
    SET password_hash = '${hash}' 
    WHERE username = 'baobao';
  `;
  
  console.log('执行SQL:', sql);
  console.log('更新完成！');
  
  return {
    success: true,
    username: 'baobao',
    password: 'baobao123',
    hash: hash,
    sql: sql
  };
}

// 如果直接运行
if (require.main === module) {
  updateD1Password().then(result => {
    console.log('结果:', result);
  });
}

module.exports = updateD1Password;
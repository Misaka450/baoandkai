// 本地检查数据库的工具
// 运行：node check-db.js

const fs = require('fs');
const path = require('path');

// 检查wrangler配置
function checkWranglerConfig() {
    console.log('🔍 检查wrangler配置...');
    try {
        const wranglerContent = fs.readFileSync('wrangler.toml', 'utf8');
        console.log('✅ wrangler.toml 存在');
        
        // 查找D1数据库绑定
        if (wranglerContent.includes('[[d1_databases]]')) {
            console.log('✅ 找到D1数据库配置');
        } else {
            console.log('❌ 未找到D1数据库配置');
        }
        
        console.log('\n📋 wrangler.toml内容:');
        console.log(wranglerContent);
    } catch (e) {
        console.log('❌ wrangler.toml 不存在');
    }
}

// 检查数据库迁移文件
function checkMigrations() {
    console.log('\n🔍 检查数据库迁移...');
    const migrationsDir = 'migrations';
    if (fs.existsSync(migrationsDir)) {
        const files = fs.readdirSync(migrationsDir);
        console.log(`✅ 找到 ${files.length} 个迁移文件:`);
        files.forEach(file => {
            console.log(`  - ${file}`);
        });
    } else {
        console.log('❌ migrations目录不存在');
    }
}

// 创建检查D1的命令
function createCheckCommand() {
    console.log('\n🔧 使用以下命令检查D1数据库:');
    console.log('');
    console.log('1. 查看D1数据库列表:');
    console.log('   npx wrangler d1 list');
    console.log('');
    console.log('2. 查看数据库内容:');
    console.log('   npx wrangler d1 execute baoandkai --command "SELECT * FROM users"');
    console.log('');
    console.log('3. 插入测试用户:');
    console.log('   npx wrangler d1 execute baoandkai --command "INSERT INTO users (username, password_hash, email, couple_name1, couple_name2, anniversary_date) VALUES (\'baobao\', \'$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi\', \'test@example.com\', \'包包\', \'恺恺\', \'2023-10-08\')"');
    console.log('');
    console.log('4. 更新密码哈希:');
    console.log('   npx wrangler d1 execute baoandkai --command "UPDATE users SET password_hash = \'$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi\' WHERE username = \'baobao\'"');
}

// 主函数
function main() {
    console.log('🚀 数据库检查工具');
    console.log('==================');
    
    checkWranglerConfig();
    checkMigrations();
    createCheckCommand();
}

main();
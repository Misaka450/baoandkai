#!/usr/bin/env node

// 数据库初始化脚本
// 运行以下命令来初始化数据库

console.log('请运行以下命令来初始化数据库：');
console.log('');
console.log('1. 初始化基础表结构：');
console.log('npx wrangler d1 execute oursql --file=./migrations/init.sql --remote');
console.log('');
console.log('2. 添加碎碎念功能：');
console.log('npx wrangler d1 execute oursql --file=./migrations/add_notes.sql --remote');
console.log('');
console.log('3. 完整设置（推荐）：');
console.log('npx wrangler d1 execute oursql --file=./migrations/complete_setup.sql --remote');
console.log('');
console.log('数据库绑定信息：');
console.log('- 数据库名称: oursql');
console.log('- 数据库ID: 5867481e-ae09-485a-b866-0f453a6e0131');
console.log('');
console.log('部署后请检查Cloudflare控制台中的D1数据库状态。');
console.log('');
console.log('调试API：');
console.log('GET /api/debug/database - 查看数据库表结构');
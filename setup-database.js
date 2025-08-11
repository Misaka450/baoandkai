#!/usr/bin/env node

/**
 * 数据库初始化脚本
 * 用于在部署时自动创建和更新数据库表
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const migrations = [
  'init.sql',
  'add_todos.sql',
  'add_notes.sql',
  'update_settings.sql',
  'complete_setup.sql',
  'fix_albums_schema.sql'
];

async function setupDatabase() {
  console.log('🚀 开始设置数据库...');
  
  try {
    // 检查是否在Cloudflare环境中
    const isCloudflare = process.env.CF_PAGES || process.env.NODE_ENV === 'production';
    
    if (isCloudflare) {
      console.log('🏭 生产环境 - 使用远程数据库');
      for (const migration of migrations) {
        const filePath = path.join('./migrations', migration);
        if (fs.existsSync(filePath)) {
          console.log(`📄 执行 ${migration}...`);
          try {
            execSync(`npx wrangler d1 execute oursql --file=${filePath} --remote`, { 
              stdio: 'inherit',
              timeout: 30000
            });
            console.log(`✅ ${migration} 执行成功`);
          } catch (error) {
            console.warn(`⚠️ ${migration} 执行失败或已存在:`, error.message);
          }
        }
      }
    } else {
      console.log('💻 开发环境 - 使用本地数据库');
      for (const migration of migrations) {
        const filePath = path.join('./migrations', migration);
        if (fs.existsSync(filePath)) {
          console.log(`📄 执行 ${migration}...`);
          try {
            execSync(`npx wrangler d1 execute oursql --file=${filePath}`, { 
              stdio: 'inherit',
              timeout: 30000
            });
            console.log(`✅ ${migration} 执行成功`);
          } catch (error) {
            console.warn(`⚠️ ${migration} 执行失败或已存在:`, error.message);
          }
        }
      }
    }
    
    console.log('🎉 数据库设置完成！');
  } catch (error) {
    console.error('❌ 数据库设置失败:', error);
    process.exit(1);
  }
}

// 如果是直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase();
}

export default setupDatabase;
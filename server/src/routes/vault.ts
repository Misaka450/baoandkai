import { Hono } from 'hono';
import { ZipArchive } from 'archiver';
import { PassThrough, Readable } from 'stream';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import { pool } from '../lib/db.js';
import { storage } from '../lib/storage.js';
import { errorResponse } from '../utils/response.js';

const vault = new Hono();

// 简单的导出频率限制缓存
const exportAttempts = new Map<string, { count: number; resetAt: number }>();

function checkExportRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = exportAttempts.get(ip);
  if (!record || now > record.resetAt) {
    exportAttempts.set(ip, { count: 1, resetAt: now + 300000 }); // 5分钟窗口
    return true;
  }
  if (record.count >= 5) {
    return false;
  }
  record.count++;
  return true;
}

/**
 * 递归收集目录下的所有文件路径（排除 .cache 目录）
 */
async function getAllUploadFiles(dir: string, baseDir: string = dir): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.cache') || entry.name.startsWith('.')) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const subFiles = await getAllUploadFiles(fullPath, baseDir);
        results.push(...subFiles);
      } else if (entry.isFile()) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    console.error('读取上传目录失败:', err);
  }
  return results;
}

/**
 * POST /api/vault/export
 * 打包导出全部回忆（需要核验密码）
 * body: { password: string, mode?: 'full' | 'markdown' }
 */
vault.post('/export', async (c) => {
  try {
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Real-IP') || 'local';
    if (!checkExportRateLimit(ip)) {
      return errorResponse('导出请求过于频繁，请 5 分钟后再试', 429);
    }

    let body: any;
    try {
      body = await c.req.json();
    } catch {
      return errorResponse('请求参数错误', 400);
    }

    const { password, mode = 'full' } = body;
    if (!password || typeof password !== 'string') {
      return errorResponse('请输入小窝安全密码以核验身份', 400);
    }

    // 1. 验证密码
    const { rows: users } = await pool.query(
      'SELECT id, username, password_hash FROM users ORDER BY id ASC LIMIT 1'
    );
    const adminUser = users[0];
    if (!adminUser) {
      return errorResponse('系统未初始化管理员账号', 500);
    }

    const isMatch = await bcrypt.compare(password, adminUser.password_hash);
    if (!isMatch) {
      return errorResponse('密码错误，身份核验未通过，禁止下载回忆归档', 401);
    }

    // 2. 从数据库提取全量数据
    const [
      timelineRes,
      mapRes,
      foodRes,
      todosRes,
      capsulesRes,
      notesRes,
      albumsRes,
      photosRes,
      configRes
    ] = await Promise.all([
      pool.query('SELECT * FROM timeline_events ORDER BY date ASC, id ASC'),
      pool.query('SELECT * FROM map_checkins ORDER BY date ASC, id ASC'),
      pool.query('SELECT * FROM food_checkins ORDER BY created_at ASC'),
      pool.query('SELECT * FROM todos ORDER BY created_at ASC'),
      pool.query('SELECT * FROM time_capsules ORDER BY created_at ASC'),
      pool.query('SELECT * FROM notes ORDER BY created_at ASC'),
      pool.query('SELECT * FROM albums ORDER BY created_at ASC'),
      pool.query('SELECT * FROM photos ORDER BY created_at ASC'),
      pool.query('SELECT * FROM settings WHERE key = $1', ['site_config'])
    ]);

    const timeline = timelineRes.rows;
    const mapCheckins = mapRes.rows;
    const food = foodRes.rows;
    const todos = todosRes.rows;
    const capsules = capsulesRes.rows;
    const notes = notesRes.rows;
    const albums = albumsRes.rows;
    const photos = photosRes.rows;
    const siteConfig = configRes.rows[0]?.value ? JSON.parse(configRes.rows[0].value) : {};

    // 3. 生成排版优美的 Markdown 纪念文档
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const formattedDate = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;

    // 3.1 时间轴 Markdown
    let timelineMd = `# 💖 包包和恺恺的小窝 · 恋爱时光轴编年史\n\n`;
    timelineMd += `> 导出日期：${formattedDate} | 记录总数：${timeline.length} 条\n\n---\n\n`;
    for (const event of timeline) {
      timelineMd += `### 📅 ${event.date || '未知日期'} · ${event.title}\n`;
      if (event.location) timelineMd += `* 📍 **地点**：${event.location}\n`;
      if (event.category) timelineMd += `* 🏷️ **标签**：${event.category}\n`;
      if (event.description) timelineMd += `\n${event.description}\n`;
      if (event.images) {
        try {
          const imgs = typeof event.images === 'string' ? JSON.parse(event.images) : event.images;
          if (Array.isArray(imgs) && imgs.length > 0) {
            timelineMd += `\n*相片记录：*\n`;
            imgs.forEach((img: string) => {
              timelineMd += `- ![](${img})\n`;
            });
          }
        } catch {
          // ignore
        }
      }
      timelineMd += `\n---\n\n`;
    }

    // 3.2 足迹地图 Markdown
    let mapMd = `# 🗺️ 包包和恺恺的小窝 · 旅途足迹故事\n\n`;
    mapMd += `> 导出日期：${formattedDate} | 打卡足迹：${mapCheckins.length} 处\n\n---\n\n`;
    for (const item of mapCheckins) {
      mapMd += `### 📍 ${item.province} · ${item.city || ''}（${item.date}）\n`;
      mapMd += `**${item.title}**\n\n`;
      if (item.description) mapMd += `${item.description}\n\n`;
      if (item.images) {
        try {
          const imgs = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
          if (Array.isArray(imgs) && imgs.length > 0) {
            mapMd += `*足迹相片：*\n`;
            imgs.forEach((img: string) => {
              mapMd += `- ![](${img})\n`;
            });
          }
        } catch {
          // ignore
        }
      }
      mapMd += `\n---\n\n`;
    }

    // 3.3 心愿清单 Markdown
    let todosMd = `# ✨ 包包和恺恺的小窝 · 甜蜜心愿清单\n\n`;
    todosMd += `> 导出日期：${formattedDate} | 心愿总数：${todos.length} 项\n\n---\n\n`;
    const doneTodos = todos.filter((t: any) => t.completed);
    const pendingTodos = todos.filter((t: any) => !t.completed);
    todosMd += `## 🌟 待完成的心愿 (${pendingTodos.length})\n\n`;
    for (const t of pendingTodos) {
      todosMd += `- [ ] **${t.title}**${t.description ? `：${t.description}` : ''}\n`;
    }
    todosMd += `\n## 🎉 已实现的浪漫 (${doneTodos.length})\n\n`;
    for (const t of doneTodos) {
      todosMd += `- [x] **${t.title}**${t.description ? `：${t.description}` : ''}\n`;
    }

    // 3.4 美食探店 Markdown
    let foodMd = `# 🍲 包包和恺恺的小窝 · 美食探店记\n\n`;
    foodMd += `> 导出日期：${formattedDate} | 探店记录：${food.length} 处\n\n---\n\n`;
    for (const f of food) {
      const stars = '⭐'.repeat(Math.min(5, Math.max(1, f.rating || 5)));
      foodMd += `### 🍴 ${f.title || f.restaurant_name || '美味小吃'} (${f.cuisine || '美食'})\n`;
      foodMd += `* 评分：${stars}\n`;
      if (f.location) foodMd += `* 地点：${f.location}\n`;
      if (f.date) foodMd += `* 日期：${f.date}\n`;
      if (f.comment || f.description) foodMd += `\n> ${f.comment || f.description}\n`;
      foodMd += `\n---\n\n`;
    }

    // 3.5 时光胶囊 Markdown
    let capsulesMd = `# 💊 包包和恺恺的小窝 · 时光胶囊\n\n`;
    capsulesMd += `> 导出日期：${formattedDate} | 胶囊总数：${capsules.length} 颗\n\n---\n\n`;
    for (const c of capsules) {
      capsulesMd += `### ✉️ ${c.title || '写给未来的信'}\n`;
      capsulesMd += `* 解锁日期：${c.unlock_date}\n`;
      capsulesMd += `* 状态：${c.is_unlocked ? '已开启 ✨' : '封存中 🔒'}\n\n`;
      capsulesMd += `${c.message}\n\n---\n\n`;
    }

    // 3.6 便签碎碎念 Markdown
    let notesMd = `# 📝 包包和恺恺的小窝 · 碎碎念便签\n\n`;
    notesMd += `> 导出日期：${formattedDate} | 便签条数：${notes.length} 条\n\n---\n\n`;
    for (const n of notes) {
      notesMd += `> 📌 ${n.content}\n\n*记录于 ${new Date(n.created_at).toLocaleString('zh-CN')}*\n\n---\n\n`;
    }

    // 3.7 相册目录 Markdown
    let albumsMd = `# 📷 包包和恺恺的小窝 · 时光画册相册集\n\n`;
    albumsMd += `> 导出日期：${formattedDate} | 相册数：${albums.length} 本，总照片数：${photos.length} 张\n\n---\n\n`;
    for (const a of albums) {
      const albumPhotos = photos.filter((p: any) => p.album_id === a.id);
      albumsMd += `## 🖼️ ${a.name} (${albumPhotos.length} 张照片)\n`;
      if (a.description) albumsMd += `*${a.description}*\n\n`;
      for (const p of albumPhotos) {
        albumsMd += `- **${p.title || '照片'}** [${p.url}] ${p.description ? `— ${p.description}` : ''}\n`;
      }
      albumsMd += `\n`;
    }

    // 3.8 全量备份 JSON
    const fullBackupJson = JSON.stringify({
      version: '3.0.0',
      exportDate: now.toISOString(),
      config: siteConfig,
      timeline,
      mapCheckins,
      food,
      todos,
      capsules,
      notes,
      albums,
      photos
    }, null, 2);

    // 4. 创建 Zip 流
    const archive = new ZipArchive({ zlib: { level: 1 } });
    const passThrough = new PassThrough();
    archive.pipe(passThrough);

    // 添加回忆故事文件夹
    archive.append(timelineMd, { name: '回忆故事/01-恋爱时光轴.md' });
    archive.append(mapMd, { name: '回忆故事/02-旅途足迹漫游.md' });
    archive.append(todosMd, { name: '回忆故事/03-甜蜜心愿清单.md' });
    archive.append(foodMd, { name: '回忆故事/04-美食探店记.md' });
    archive.append(capsulesMd, { name: '回忆故事/05-时光胶囊.md' });
    archive.append(notesMd, { name: '回忆故事/06-便签碎碎念.md' });
    archive.append(albumsMd, { name: '回忆故事/07-相册影集目录.md' });
    archive.append(fullBackupJson, { name: '回忆故事/00-小窝全量数据备份.json' });

    // 5. 若是完整模式，添加照片原图
    if (mode === 'full') {
      const uploadDir = storage.getUploadDir();
      const uploadFiles = await getAllUploadFiles(uploadDir);
      for (const filePath of uploadFiles) {
        const relPath = path.relative(uploadDir, filePath);
        archive.file(filePath, { name: `照片影像/${relPath}` });
      }
    }

    // 完成打包
    archive.finalize().catch((err: any) => {
      console.error('归档打包出错:', err);
    });

    const filename = `bbkk-memories-${dateStr}-${mode === 'full' ? 'complete' : 'notes'}.zip`;
    const webStream = Readable.toWeb(passThrough);

    return new Response(webStream as ReadableStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('导出回忆保险箱失败:', error);
    return errorResponse('导出回忆归档失败，请稍后重试', 500);
  }
});

export default vault;

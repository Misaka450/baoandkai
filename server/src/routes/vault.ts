import { Hono } from 'hono';
import { ZipArchive } from 'archiver';
import { PassThrough, Readable } from 'stream';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import { pool } from '../lib/db.js';
import { storage } from '../lib/storage.js';
import { cache } from '../lib/cache.js';
import { jsonResponse, errorResponse } from '../utils/response.js';
import { transformImageArray, transformImageUrl, serializeImages } from '../utils/url.js';
import { hasXSS, sanitizeObject } from '../utils/validation.js';

const vault = new Hono();

const ALLOWED_CONFIG_FIELDS = [
  'coupleName1', 'coupleName2', 'anniversaryDate',
  'homeTitle', 'homeSubtitle', 'avatar1', 'avatar2',
  'customAvatar1', 'customAvatar2'
];

const TEXT_CONFIG_FIELDS = ['coupleName1', 'coupleName2', 'homeTitle', 'homeSubtitle'];

/**
 * 获取东八区（Asia/Shanghai）当前日期字符串 YYYY-MM-DD
 */
function getShanghaiToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * 校验图片 URL 是否安全（拒绝 javascript:/vbscript:/data:text 等危险协议与 XSS 载荷）
 */
function isSafeImageUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 2048) return false;
  if (hasXSS(trimmed)) return false;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('vbscript:') || lower.startsWith('data:text/')) {
    return false;
  }
  return (
    trimmed.startsWith('/uploads/') ||
    trimmed.startsWith('/api/images/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/')
  );
}

function sanitizeImageList(raw: unknown): string[] {
  const arr = transformImageArray(raw as string | string[] | null | undefined);
  return arr.filter((u) => isSafeImageUrl(u));
}

/**
 * 提取全量小窝数据（供 JSON 备份导出与 ZIP 归档共用）
 * @param sealLockedCapsules 是否遮罩尚未到解锁日期的时光胶囊正文（未经过二次密码核验时设为 true）
 */
async function fetchFullVaultData(sealLockedCapsules = false) {
  const [
    timelineRes,
    mapRes,
    foodRes,
    todosRes,
    capsulesRes,
    notesRes,
    albumsRes,
    photosRes,
    configRes,
    userRes
  ] = await Promise.all([
    pool.query('SELECT * FROM timeline_events ORDER BY date ASC, id ASC'),
    pool.query('SELECT * FROM map_checkins ORDER BY date ASC, id ASC'),
    pool.query('SELECT * FROM food_checkins ORDER BY created_at ASC, id ASC'),
    pool.query('SELECT * FROM todos ORDER BY created_at ASC, id ASC'),
    pool.query('SELECT * FROM time_capsules ORDER BY created_at ASC, id ASC'),
    pool.query('SELECT * FROM notes ORDER BY created_at ASC, id ASC'),
    pool.query('SELECT * FROM albums ORDER BY created_at ASC, id ASC'),
    pool.query('SELECT * FROM photos ORDER BY sort_order ASC, id ASC'),
    pool.query('SELECT value FROM settings WHERE key = $1', ['site_config']),
    pool.query(
      `SELECT couple_name1, couple_name2, anniversary_date,
              home_title, home_subtitle, avatar1, avatar2
       FROM users ORDER BY id ASC LIMIT 1`
    )
  ]);

  let siteConfig: Record<string, unknown> = {};
  if (configRes.rows[0]?.value) {
    try {
      siteConfig = JSON.parse(configRes.rows[0].value);
    } catch {
      siteConfig = {};
    }
  }
  if (Object.keys(siteConfig).length === 0) {
    const u = userRes.rows[0];
    siteConfig = {
      coupleName1: u?.couple_name1 || '包包',
      coupleName2: u?.couple_name2 || '恺恺',
      anniversaryDate: u?.anniversary_date || '2023-10-08',
      homeTitle: u?.home_title || '包包和恺恺的小窝',
      homeSubtitle: u?.home_subtitle || '遇见你，是银河赠予我的糖。',
      avatar1: transformImageUrl(u?.avatar1),
      avatar2: transformImageUrl(u?.avatar2),
    };
  }

  const timeline = timelineRes.rows.map((r: any) => ({
    ...r,
    images: transformImageArray(r.images),
  }));
  const mapCheckins = mapRes.rows.map((r: any) => ({
    ...r,
    images: transformImageArray(r.images),
  }));
  const food = foodRes.rows.map((r: any) => ({
    ...r,
    images: transformImageArray(r.images),
  }));
  const todos = todosRes.rows.map((r: any) => ({
    ...r,
    images: transformImageArray(r.images),
    completion_photos: transformImageArray(r.completion_photos),
  }));
  const today = getShanghaiToday();
  const capsules = capsulesRes.rows.map((c: any) => {
    const isUnlocked = Boolean(c.is_unlocked || (c.unlock_date && String(c.unlock_date) <= today));
    return {
      ...c,
      is_unlocked: isUnlocked ? 1 : 0,
      message: sealLockedCapsules && !isUnlocked ? null : c.message,
    };
  });
  const notes = notesRes.rows;
  const albums = albumsRes.rows.map((a: any) => ({
    ...a,
    cover_url: transformImageUrl(a.cover_url),
  }));
  const photos = photosRes.rows.map((p: any) => ({
    ...p,
    url: transformImageUrl(p.url),
  }));

  const photosByAlbum: Record<string, any[]> = {};
  for (const p of photos) {
    const key = String(p.album_id);
    if (!photosByAlbum[key]) {
      photosByAlbum[key] = [];
    }
    photosByAlbum[key].push(p);
  }

  return {
    siteConfig,
    timeline,
    mapCheckins,
    food,
    todos,
    capsules,
    notes,
    albums,
    photos,
    photosByAlbum,
  };
}

/** 导出请求的速率限制窗口（5 分钟内最多 5 次） */
const EXPORT_LIMIT = {
  MAX_ATTEMPTS: 5,
  WINDOW_SECONDS: 300,
};

async function checkExportRateLimit(ip: string): Promise<boolean> {
  const cacheKey = `export_rate:${ip}`;
  const record = await cache.get<{ count: number }>(cacheKey);

  if (!record) {
    await cache.set(cacheKey, { count: 1 }, EXPORT_LIMIT.WINDOW_SECONDS);
    return true;
  }

  if (record.count >= EXPORT_LIMIT.MAX_ATTEMPTS) {
    return false;
  }

  await cache.set(cacheKey, { count: record.count + 1 }, EXPORT_LIMIT.WINDOW_SECONDS);
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

interface ExportRequestBody {
  password?: string;
  mode?: 'full' | 'markdown' | 'json';
}

/**
 * GET /api/vault/export
 * 全量导出 JSON 数据备份（由全局 authMiddleware 保护，需管理员已登录 Session）
 */
vault.get('/export', async (c) => {
  try {
    const ip = c.req.header('X-Real-IP') || 'local';
    const isAllowed = await checkExportRateLimit(ip);
    if (!isAllowed) {
      return errorResponse('导出请求过于频繁，请 5 分钟后再试', 429);
    }

    const {
      siteConfig,
      timeline,
      mapCheckins,
      food,
      todos,
      capsules,
      notes,
      albums,
      photosByAlbum,
    } = await fetchFullVaultData(true);

    return jsonResponse({
      version: '3.0.0',
      exportDate: new Date().toISOString(),
      config: siteConfig,
      albums,
      photos: photosByAlbum,
      timeline,
      food,
      map: mapCheckins,
      mapCheckins,
      notes,
      todos,
      capsules,
    });
  } catch (error: unknown) {
    console.error('全量导出 JSON 备份失败:', error);
    return errorResponse('导出备份失败，请稍后重试', 500);
  }
});

/**
 * POST /api/vault/export
 * 打包导出全部回忆（需要核验密码）
 * body: { password: string, mode?: 'full' | 'markdown' }
 */
vault.post('/export', async (c) => {
  try {
    const ip = c.req.header('X-Real-IP') || 'local';
    const isAllowed = await checkExportRateLimit(ip);
    if (!isAllowed) {
      return errorResponse('导出请求过于频繁，请 5 分钟后再试', 429);
    }

    let body: ExportRequestBody;
    try {
      body = await c.req.json();
    } catch {
      return errorResponse('请求参数错误', 400);
    }

    const { password, mode = 'full' } = body;
    if (!password || typeof password !== 'string' || password.length > 72) {
      return errorResponse('请输入有效的小窝安全密码以核验身份（长度不超过 72 位）', 400);
    }

    // 1. 验证已登录会话与二次密码校验
    const sessionUser = c.get('user' as never) as { id?: number } | undefined;
    const { rows: users } = sessionUser?.id
      ? await pool.query('SELECT id, username, password_hash FROM users WHERE id = $1 LIMIT 1', [sessionUser.id])
      : await pool.query('SELECT id, username, password_hash FROM users ORDER BY id ASC LIMIT 1');
    const adminUser = users[0];
    if (!adminUser) {
      return errorResponse('系统未初始化管理员账号', 500);
    }

    const isMatch = await bcrypt.compare(password, adminUser.password_hash);
    if (!isMatch) {
      return errorResponse('密码错误，身份核验未通过，禁止下载回忆归档', 401);
    }

    // 2. 从数据库提取全量数据（已通过二次密码核验，包含未解锁胶囊完整正文与规范化图片数组）
    const {
      siteConfig,
      timeline,
      mapCheckins,
      food,
      todos,
      capsules,
      notes,
      albums,
      photos,
      photosByAlbum,
    } = await fetchFullVaultData(false);

    if (mode === 'json') {
      return jsonResponse({
        version: '3.0.0',
        exportDate: new Date().toISOString(),
        config: siteConfig,
        albums,
        photos: photosByAlbum,
        timeline,
        food,
        map: mapCheckins,
        mapCheckins,
        notes,
        todos,
        capsules,
      });
    }

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
      timelineMd += `\n---\n\n`;
    }

    // 3.2 旅行地图 Markdown
    let mapMd = `# 🗺️ 包包和恺恺的小窝 · 旅途足迹漫游\n\n`;
    mapMd += `> 导出日期：${formattedDate} | 打卡足迹：${mapCheckins.length} 处\n\n---\n\n`;
    for (const spot of mapCheckins) {
      mapMd += `### 📍 ${spot.province} · ${spot.city || ''} · ${spot.title}\n`;
      mapMd += `* 日期：${spot.date}\n`;
      if (spot.description) mapMd += `* 回忆记录：${spot.description}\n`;
      mapMd += `\n---\n\n`;
    }

    // 3.3 待办事项 Markdown
    let todosMd = `# 📝 包包和恺恺的小窝 · 甜蜜心愿清单\n\n`;
    todosMd += `> 导出日期：${formattedDate} | 心愿总数：${todos.length} 项\n\n---\n\n`;
    const pendingTodos = todos.filter((t: any) => t.status !== 'completed' && !t.is_completed);
    const doneTodos = todos.filter((t: any) => t.status === 'completed' || t.is_completed);
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
        const photoLabel = p.caption || p.title || '照片';
        const extraMeta = [p.date, p.location, p.description].filter(Boolean).join(' · ');
        albumsMd += `- **${photoLabel}** [${p.url}]${extraMeta ? ` — ${extraMeta}` : ''}\n`;
      }
      albumsMd += `\n`;
    }

    // 3.8 全量备份 JSON（与 GET /api/vault/export 结构完全一致，可直接用于恢复）
    const fullBackupJson = JSON.stringify({
      version: '3.0.0',
      exportDate: now.toISOString(),
      config: siteConfig,
      albums,
      photos: photosByAlbum,
      timeline,
      food,
      map: mapCheckins,
      mapCheckins,
      notes,
      todos,
      capsules,
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
    archive.finalize().catch((err: unknown) => {
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
  } catch (error: unknown) {
    console.error('导出回忆保险箱失败:', error);
    return errorResponse('导出回忆归档失败，请稍后重试', 500);
  }
});

interface ImportBackupPayload {
  version?: string;
  exportDate?: string;
  config?: Record<string, unknown>;
  albums?: any[];
  photos?: Record<string, any[]> | any[];
  timeline?: any[];
  food?: any[];
  map?: any[];
  mapCheckins?: any[];
  notes?: any[];
  todos?: any[];
  capsules?: any[];
}

function compareSemver(v1: string, v2: string): number {
  const parts1 = v1.split('.').map((n) => parseInt(n, 10) || 0);
  const parts2 = v2.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

/**
 * POST /api/vault/import
 * 全量事务化导入数据备份（支持 overwrite 覆盖导入与 merge 合并导入）
 * 单一数据库事务执行，任何步骤异常自动回滚，杜绝半删半导导致的数据丢失
 */
vault.post('/import', async (c) => {
  let body: { strategy?: 'overwrite' | 'merge'; data?: ImportBackupPayload } & ImportBackupPayload;
  try {
    body = await c.req.json();
  } catch {
    return errorResponse('请求体 JSON 格式错误', 400);
  }

  const strategy: 'overwrite' | 'merge' = body.strategy === 'merge' ? 'merge' : 'overwrite';
  const importData: ImportBackupPayload = (body.data && typeof body.data === 'object') ? body.data : body;

  if (!importData || typeof importData.version !== 'string' || !importData.config || typeof importData.config !== 'object') {
    return errorResponse('无效的备份文件格式：缺少版本号或配置信息', 400);
  }

  if (compareSemver(importData.version, '1.0.0') < 0 || compareSemver(importData.version, '3.0.0') > 0) {
    return errorResponse(`不支持的备份文件版本（v${importData.version}），支持范围 v1.0.0 ~ v3.0.0`, 400);
  }

  const sessionUser = c.get('user' as never) as { id?: number } | undefined;
  const userId = sessionUser?.id || 1;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. 导入系统配置
    const filteredConfig: Record<string, unknown> = {};
    for (const field of ALLOWED_CONFIG_FIELDS) {
      if (field in importData.config) {
        filteredConfig[field] = importData.config[field];
      }
    }
    for (const field of TEXT_CONFIG_FIELDS) {
      const val = filteredConfig[field];
      if (typeof val === 'string' && hasXSS(val)) {
        await client.query('ROLLBACK');
        return errorResponse(`配置字段 ${field} 包含不安全字符`, 400);
      }
    }
    const sanitizedConfig = sanitizeObject(filteredConfig, ['avatar1', 'avatar2', 'customAvatar1', 'customAvatar2']);

    await client.query(
      `INSERT INTO settings (key, value, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      ['site_config', JSON.stringify(sanitizedConfig)]
    );

    await client.query(
      `UPDATE users SET
         couple_name1 = COALESCE($1, couple_name1),
         couple_name2 = COALESCE($2, couple_name2),
         anniversary_date = COALESCE($3, anniversary_date),
         home_title = COALESCE($4, home_title),
         home_subtitle = COALESCE($5, home_subtitle),
         avatar1 = COALESCE($6, avatar1),
         avatar2 = COALESCE($7, avatar2),
         updated_at = NOW()
       WHERE id = $8`,
      [
        sanitizedConfig.coupleName1 ?? null,
        sanitizedConfig.coupleName2 ?? null,
        sanitizedConfig.anniversaryDate ?? null,
        sanitizedConfig.homeTitle ?? null,
        sanitizedConfig.homeSubtitle ?? null,
        sanitizedConfig.avatar1 ?? null,
        sanitizedConfig.avatar2 ?? null,
        userId,
      ]
    );

    // 2. 覆盖模式：在同一事务内原子清空所有业务表；合并模式：构建去重集合
    const existingKeys = new Set<string>();
    const existingAlbumsByName = new Map<string, number>();
    const existingCapsuleMessagesById = new Map<string, string>();

    if (strategy === 'overwrite') {
      // 保留现有未解锁胶囊的正文映射，防止从无密码遮罩备份恢复时丢失封存胶囊正文
      const existingCapsulesRes = await client.query('SELECT id, message FROM time_capsules');
      existingCapsulesRes.rows.forEach((r: any) => {
        if (r.id !== undefined && r.message) {
          existingCapsuleMessagesById.set(String(r.id), String(r.message));
        }
      });

      await client.query('DELETE FROM photos');
      await client.query('DELETE FROM albums');
      await client.query('DELETE FROM timeline_events');
      await client.query('DELETE FROM map_checkins');
      await client.query('DELETE FROM food_checkins');
      await client.query('DELETE FROM notes');
      await client.query('DELETE FROM todos');
      await client.query('DELETE FROM time_capsules');
    } else {
      const [tlRows, mapRows, foodRows, noteRows, todoRows, capRows, albumRows] = await Promise.all([
        client.query('SELECT title, date FROM timeline_events'),
        client.query('SELECT title, date FROM map_checkins'),
        client.query('SELECT restaurant_name, date FROM food_checkins'),
        client.query('SELECT content FROM notes'),
        client.query('SELECT title FROM todos'),
        client.query('SELECT message, unlock_date FROM time_capsules'),
        client.query('SELECT id, name FROM albums'),
      ]);
      tlRows.rows.forEach((r: any) => existingKeys.add(`timeline_${r.title}_${r.date}`));
      mapRows.rows.forEach((r: any) => existingKeys.add(`map_${r.title}_${r.date}`));
      foodRows.rows.forEach((r: any) => existingKeys.add(`food_${r.restaurant_name}_${r.date}`));
      noteRows.rows.forEach((r: any) => existingKeys.add(`notes_${String(r.content || '').substring(0, 50)}`));
      todoRows.rows.forEach((r: any) => existingKeys.add(`todos_${r.title}`));
      capRows.rows.forEach((r: any) => existingKeys.add(`capsule_${String(r.message || '').substring(0, 50)}_${r.unlock_date}`));
      albumRows.rows.forEach((r: any) => existingAlbumsByName.set(String(r.name), Number(r.id)));
    }

    let imported = 0;
    let skipped = 0;

    // 3. 导入时间轴
    const timelineItems = Array.isArray(importData.timeline) ? importData.timeline : [];
    for (const item of timelineItems) {
      if (!item || !item.title || !item.date) continue;
      const key = `timeline_${item.title}_${item.date}`;
      if (strategy === 'merge' && existingKeys.has(key)) {
        skipped++;
        continue;
      }
      await client.query(
        `INSERT INTO timeline_events (title, description, date, location, category, images, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [
          String(item.title),
          item.description ? String(item.description) : '',
          String(item.date),
          item.location ? String(item.location) : '',
          item.category ? String(item.category) : 'general',
          serializeImages(sanitizeImageList(item.images)),
        ]
      );
      existingKeys.add(key);
      imported++;
    }

    // 4. 导入地图打卡（兼容 map 与 mapCheckins 字段）
    const mapItems = Array.isArray(importData.map)
      ? importData.map
      : (Array.isArray(importData.mapCheckins) ? importData.mapCheckins : []);
    for (const item of mapItems) {
      if (!item || !item.title || !item.province || !item.date) continue;
      const key = `map_${item.title}_${item.date}`;
      if (strategy === 'merge' && existingKeys.has(key)) {
        skipped++;
        continue;
      }
      await client.query(
        `INSERT INTO map_checkins (title, description, province, city, date, images, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [
          String(item.title),
          item.description ? String(item.description) : '',
          String(item.province),
          item.city ? String(item.city) : '',
          String(item.date),
          serializeImages(sanitizeImageList(item.images)),
        ]
      );
      existingKeys.add(key);
      imported++;
    }

    // 5. 导入美食打卡
    const foodItems = Array.isArray(importData.food) ? importData.food : [];
    for (const item of foodItems) {
      const restaurantName = item?.restaurant_name || item?.title;
      if (!item || !restaurantName || !item.date) continue;
      const key = `food_${restaurantName}_${item.date}`;
      if (strategy === 'merge' && existingKeys.has(key)) {
        skipped++;
        continue;
      }
      const clampRating = (v: unknown) => {
        const n = Number(v);
        return Number.isFinite(n) ? Math.min(5, Math.max(1, Math.round(n))) : 5;
      };
      const recommendedDishes = Array.isArray(item.recommended_dishes)
        ? item.recommended_dishes.join(',')
        : (item.recommended_dishes ? String(item.recommended_dishes) : '');

      await client.query(
        `INSERT INTO food_checkins (
           restaurant_name, description, date, address, cuisine, price_range,
           overall_rating, taste_rating, environment_rating, service_rating,
           recommended_dishes, images, sort_order, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
        [
          String(restaurantName),
          item.description ? String(item.description) : '',
          String(item.date),
          item.address ? String(item.address) : '',
          item.cuisine ? String(item.cuisine) : '',
          item.price_range ? String(item.price_range) : '',
          clampRating(item.overall_rating ?? item.rating),
          clampRating(item.taste_rating ?? item.overall_rating),
          clampRating(item.environment_rating ?? item.overall_rating),
          clampRating(item.service_rating ?? item.overall_rating),
          recommendedDishes,
          serializeImages(sanitizeImageList(item.images)),
          Number(item.sort_order) || 0,
        ]
      );
      existingKeys.add(key);
      imported++;
    }

    // 6. 导入便签
    const noteItems = Array.isArray(importData.notes) ? importData.notes : [];
    for (const item of noteItems) {
      if (!item || !item.content) continue;
      const key = `notes_${String(item.content).substring(0, 50)}`;
      if (strategy === 'merge' && existingKeys.has(key)) {
        skipped++;
        continue;
      }
      await client.query(
        `INSERT INTO notes (content, color, user_id, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())`,
        [
          String(item.content),
          item.color ? String(item.color) : 'pink',
          userId,
        ]
      );
      existingKeys.add(key);
      imported++;
    }

    // 7. 导入待办事项
    const todoItems = Array.isArray(importData.todos) ? importData.todos : [];
    for (const item of todoItems) {
      if (!item || !item.title) continue;
      const key = `todos_${item.title}`;
      if (strategy === 'merge' && existingKeys.has(key)) {
        skipped++;
        continue;
      }
      const validStatuses = ['pending', 'completed', 'cancelled'];
      const status = validStatuses.includes(item.status) ? item.status : 'pending';
      const priority = Math.min(5, Math.max(1, Number(item.priority) || 1));

      await client.query(
        `INSERT INTO todos (
           title, description, status, priority, category, due_date,
           completion_notes, completion_photos, images, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [
          String(item.title),
          item.description ? String(item.description) : '',
          status,
          priority,
          item.category ? String(item.category) : 'general',
          item.due_date || null,
          item.completion_notes ? String(item.completion_notes) : null,
          serializeImages(sanitizeImageList(item.completion_photos)),
          serializeImages(sanitizeImageList(item.images)),
        ]
      );
      existingKeys.add(key);
      imported++;
    }

    // 8. 导入时光胶囊
    const capsuleItems = Array.isArray(importData.capsules) ? importData.capsules : [];
    for (const item of capsuleItems) {
      if (!item || !item.unlock_date) continue;
      const resolvedMessage = item.message
        ? String(item.message)
        : (item.id !== undefined ? existingCapsuleMessagesById.get(String(item.id)) : undefined);
      if (!resolvedMessage) {
        skipped++;
        continue;
      }
      const key = `capsule_${resolvedMessage.substring(0, 50)}_${item.unlock_date}`;
      if (strategy === 'merge' && existingKeys.has(key)) {
        skipped++;
        continue;
      }
      await client.query(
        `INSERT INTO time_capsules (title, message, unlock_date, is_unlocked, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [
          item.title ? String(item.title) : null,
          resolvedMessage,
          String(item.unlock_date),
          item.is_unlocked ? 1 : 0,
          item.created_by ? String(item.created_by) : 'couple',
        ]
      );
      existingKeys.add(key);
      imported++;
    }

    // 9. 导入相册与照片（兼容 photos 为 Record<albumId, Photo[]> 或 Photo[]）
    const photosByOldAlbumId: Record<string, any[]> = {};
    if (Array.isArray(importData.photos)) {
      for (const p of importData.photos) {
        if (!p || p.album_id === undefined) continue;
        const k = String(p.album_id);
        if (!photosByOldAlbumId[k]) photosByOldAlbumId[k] = [];
        photosByOldAlbumId[k].push(p);
      }
    } else if (importData.photos && typeof importData.photos === 'object') {
      Object.assign(photosByOldAlbumId, importData.photos);
    }

    const albumItems = Array.isArray(importData.albums) ? importData.albums : [];
    for (const album of albumItems) {
      if (!album || !album.name) continue;
      const albumName = String(album.name).trim();
      let targetAlbumId: number;

      const existingId = existingAlbumsByName.get(albumName);
      if (existingId !== undefined) {
        targetAlbumId = existingId;
      } else {
        const { rows: newAlbumRows } = await client.query(
          `INSERT INTO albums (name, description, cover_url, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT (name) DO UPDATE SET
             description = EXCLUDED.description,
             cover_url = COALESCE(EXCLUDED.cover_url, albums.cover_url),
             updated_at = NOW()
           RETURNING id`,
          [
            albumName,
            album.description ? String(album.description) : '',
            isSafeImageUrl(album.cover_url) ? String(album.cover_url) : null,
          ]
        );
        targetAlbumId = Number(newAlbumRows[0].id);
        existingAlbumsByName.set(albumName, targetAlbumId);
        imported++;
      }

      const oldAlbumKey = album.id !== undefined ? String(album.id) : '';
      const albumPhotos = oldAlbumKey ? (photosByOldAlbumId[oldAlbumKey] || []) : [];

      if (albumPhotos.length > 0) {
        const existingPhotoUrls = new Set<string>();
        if (strategy === 'merge') {
          const { rows: epRows } = await client.query(
            'SELECT url FROM photos WHERE album_id = $1',
            [targetAlbumId]
          );
          epRows.forEach((r: any) => existingPhotoUrls.add(String(r.url)));
        }

        for (let idx = 0; idx < albumPhotos.length; idx++) {
          const photo = albumPhotos[idx];
          const url = typeof photo === 'string' ? photo : photo?.url;
          if (!isSafeImageUrl(url)) continue;
          if (strategy === 'merge' && existingPhotoUrls.has(String(url))) {
            continue;
          }
          await client.query(
            `INSERT INTO photos (album_id, url, caption, date, location, sort_order, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [
              targetAlbumId,
              String(url),
              photo?.caption ? String(photo.caption) : '',
              photo?.date ? String(photo.date) : null,
              photo?.location ? String(photo.location) : null,
              photo?.sort_order !== undefined ? Number(photo.sort_order) : idx,
            ]
          );
          existingPhotoUrls.add(String(url));
        }
      }
    }

    await client.query('COMMIT');
    await cache.del('stats:dashboard');

    return jsonResponse({
      success: true,
      imported,
      skipped,
      message: `数据导入完成，成功导入 ${imported} 条记录${skipped > 0 ? `，跳过重复 ${skipped} 条` : ''}`,
    });
  } catch (error: unknown) {
    await client.query('ROLLBACK');
    console.error('全量事务导入备份失败:', error);
    const msg = error instanceof Error ? error.message : '导入数据失败';
    return errorResponse(`导入失败（事务已回滚，原数据未受影响）：${msg}`, 500);
  } finally {
    client.release();
  }
});

export default vault;

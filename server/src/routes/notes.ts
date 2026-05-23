import { Hono } from 'hono';
import { jsonResponse, errorResponse } from '../utils/response.js';
import { validate, validateRequired, validateLength, hasXSS, sanitizeObject } from '../utils/validation.js';
import { parsePagination, buildPaginatedResponse } from '../utils/pagination.js';
import { pool } from '../lib/db.js';

const notes = new Hono<{
  Variables: {
    user?: { id: number };
  };
}>();

interface Note {
  id: number;
  content: string;
  color?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

/**
 * GET /api/notes
 * 获取碎碎念列表（支持分页）
 */
notes.get('/', async (c) => {
  try {
    const url = new URL(c.req.url);
    const pagination = parsePagination(url);

    // 获取总数
    const { rows: countRows } = await pool.query('SELECT COUNT(*) as total FROM notes');
    const total = parseInt(countRows[0]?.total || '0', 10);

    // 获取分页数据
    const { rows } = await pool.query(
      `SELECT * FROM notes 
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [pagination.pageSize, pagination.offset]
    );

    return jsonResponse(buildPaginatedResponse(rows || [], total, pagination));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error('获取碎碎念列表失败:', message);
    return errorResponse(message, 500);
  }
});

/**
 * POST /api/notes
 * 新增碎碎念
 */
notes.post('/', async (c) => {
  const user = c.get('user') as { id: number } | undefined;

  try {
    const body = (await c.req.json()) as { content: string; color?: string };
    const { content, color } = body || {};

    // 输入验证
    const validationError = validate([
      validateRequired(content, '内容'),
      validateLength(content, '内容', 1, 500),
    ]);
    if (validationError) return errorResponse(validationError, 400);

    // XSS 检测
    if (hasXSS(content)) {
      return errorResponse('输入内容包含不安全字符', 400);
    }

    // 消毒输入数据
    const sanitized = sanitizeObject({ content, color }, []);

    // 插入数据库并返回
    const { rows } = await pool.query(
      `INSERT INTO notes (content, color, user_id, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW()) 
       RETURNING *`,
      [
        sanitized.content,
        sanitized.color || 'bg-yellow-100 border-yellow-200',
        user ? user.id : 1,
      ]
    );
    const newNote = rows[0];

    return jsonResponse(newNote, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error('添加碎碎念API错误:', message);
    return errorResponse('服务器内部错误', 500);
  }
});

/**
 * GET /api/notes/:id
 * 获取单个碎碎念详情
 */
notes.get('/:id', async (c) => {
  try {
    const noteId = parseInt(c.req.param('id') || '');
    if (isNaN(noteId)) {
      return errorResponse('无效的ID', 400);
    }

    const { rows } = await pool.query('SELECT * FROM notes WHERE id = $1', [noteId]);
    const note = rows[0] as Note;

    if (!note) {
      return errorResponse('笔记不存在', 404);
    }

    return jsonResponse(note);
  } catch (error: any) {
    console.error('获取笔记详情失败:', error);
    return errorResponse(error.message, 500);
  }
});

/**
 * PUT /api/notes/:id
 * 更新碎碎念
 */
notes.put('/:id', async (c) => {
  try {
    const noteId = parseInt(c.req.param('id') || '');
    if (isNaN(noteId)) {
      return errorResponse('无效的ID', 400);
    }

    const body: any = await c.req.json();
    const { content, color } = body;

    // 检查记录是否存在
    const { rows: checkRows } = await pool.query('SELECT * FROM notes WHERE id = $1', [noteId]);
    const currentNote = checkRows[0] as Note;
    if (!currentNote) {
      return errorResponse('笔记不存在', 404);
    }

    // 验证规则（仅验证传入的字段）
    const rules: (string | null)[] = [];
    if (content !== undefined) {
      rules.push(validateRequired(content, '内容'));
      rules.push(validateLength(content, '内容', 1, 500));
    }
    const validationError = validate(rules);
    if (validationError) return errorResponse(validationError, 400);

    if (content && hasXSS(content)) {
      return errorResponse('输入内容包含不安全字符', 400);
    }

    const sanitized = sanitizeObject({ content, color }, []);

    await pool.query(
      `UPDATE notes SET 
         content = $1, 
         color = $2, 
         updated_at = NOW() 
       WHERE id = $3`,
      [
        content !== undefined ? sanitized.content : currentNote.content,
        color !== undefined ? sanitized.color : currentNote.color,
        noteId,
      ]
    );

    const { rows: updatedRows } = await pool.query('SELECT * FROM notes WHERE id = $1', [noteId]);
    const updatedNote = updatedRows[0];

    return jsonResponse(updatedNote);
  } catch (error: any) {
    console.error('更新笔记失败:', error);
    return errorResponse(error.message, 500);
  }
});

/**
 * DELETE /api/notes/:id
 * 删除碎碎念
 */
notes.delete('/:id', async (c) => {
  try {
    const noteId = parseInt(c.req.param('id') || '');
    if (isNaN(noteId)) {
      return errorResponse('无效的ID', 400);
    }

    const { rowCount } = await pool.query('DELETE FROM notes WHERE id = $1', [noteId]);
    if (rowCount === 0) {
      return errorResponse('笔记不存在', 404);
    }

    return jsonResponse({ success: true, message: '笔记已删除' });
  } catch (error: any) {
    console.error('删除笔记失败:', error);
    return errorResponse(error.message, 500);
  }
});

export default notes;

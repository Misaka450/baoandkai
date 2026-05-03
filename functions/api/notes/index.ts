import { jsonResponse, errorResponse } from '../../utils/response';
import { validate, validateRequired, validateLength, hasXSS, sanitizeObject } from '../../utils/validation';

export interface Env {
  DB: D1Database;
}

interface Note {
  id: number;
  content: string;
  color?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

interface CreateNoteBody {
  content: string;
  color?: string;
}

// Cloudflare Pages Functions - 碎碎念API
export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;

  try {
    // 获取分页参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    // 获取总数
    const countResult = await env.DB.prepare(`
      SELECT COUNT(*) as total FROM notes
    `).first<{ total: number }>();
    const total = countResult?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // 获取分页数据
    const notes = await env.DB.prepare(`
      SELECT * FROM notes 
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all<Note>();

    return jsonResponse({
      data: notes.results || [],
      totalCount: total,
      totalPages,
      currentPage: page
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    return errorResponse(message, 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env; data: Record<string, unknown> }) {
  const { request, env, data } = context;
  const user = data?.user as { id: number } | undefined;

  try {
    const body = await request.json() as CreateNoteBody;
    const { content, color } = body || {};

    // 输入验证
    const validationError = validate([
      validateRequired(content, '内容'),
      validateLength(content, '内容', 1, 500),
    ]);
    if (validationError) return errorResponse(validationError, 400);

    // XSS检测
    if (hasXSS(content)) {
      return errorResponse('输入内容包含不安全字符', 400);
    }

    // 消毒输入数据
    const sanitized = sanitizeObject({ content, color }, []);

    const result = await env.DB.prepare(`
      INSERT INTO notes (content, color, user_id, created_at, updated_at) 
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      sanitized.content,
      sanitized.color || 'bg-yellow-100 border-yellow-200',
      user ? user.id : 1
    ).run();

    const newNote = await env.DB.prepare(`
      SELECT * FROM notes WHERE id = ?
    `).bind(result.meta.last_row_id).first<Note>();

    return jsonResponse(newNote, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error('添加碎碎念API错误:', message);
    return errorResponse('服务器内部错误', 500);
  }
}
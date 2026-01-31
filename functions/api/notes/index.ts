import { jsonResponse, errorResponse } from '../../utils/response';

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
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env; data: any }) {
  const { request, env, data } = context;
  const user = data?.user; // Injected by middleware

  try {
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return errorResponse('请求格式错误: 无效的JSON格式', 400);
    }

    const { content, color } = body || {};

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return errorResponse('内容不能为空', 400);
    }

    const result = await env.DB.prepare(`
      INSERT INTO notes (content, color, user_id, created_at, updated_at) 
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      content.trim(),
      color || 'bg-yellow-100 border-yellow-200',
      user ? user.id : 1 // Fallback to 1 if user is missing
    ).run();

    const newNote = await env.DB.prepare(`
      SELECT * FROM notes WHERE id = ?
    `).bind(result.meta.last_row_id).first<Note>();

    return jsonResponse(newNote, 201);
  } catch (error: any) {
    console.error('添加碎碎念API错误:', error);
    return errorResponse('服务器内部错误: ' + error.message, 500);
  }
}
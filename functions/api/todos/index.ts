import { jsonResponse, errorResponse } from '../../utils/response';
import { transformImageArray } from '../../utils/url';
import { validate, validateRequired, validateLength, hasXSS, sanitizeObject } from '../../utils/validation';

export interface Env {
  DB: D1Database;
}

interface Todo {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: number;
  category?: string;
  due_date?: string;
  completion_notes?: string;
  completion_photos?: string;
  images?: string;
  created_at: string;
}

// Cloudflare Pages Functions - 待办事项API
// GET /api/todos - 获取待办事项（支持分页）
export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const params = url.searchParams;
    const page = Math.max(1, parseInt(params.get('page') || '1') || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') || '10') || 10));
    const offset = (page - 1) * limit;

    // 获取总数
    const countResult = await env.DB.prepare(`
      SELECT COUNT(*) as total FROM todos
    `).first<{ total: number }>();
    const total = countResult?.total || 0;

    const todos = await env.DB.prepare(`
      SELECT * FROM todos 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all<Todo>();

    const formattedTodos = todos.results ? todos.results.map(todo => ({
      ...todo,
      images: transformImageArray(todo.images),
      completion_photos: transformImageArray(todo.completion_photos)
    })) : [];

    return jsonResponse({
      data: formattedTodos,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalCount: total,
      limit: limit
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// POST /api/todos - 创建待办事项
export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const body: any = await request.json();
    const { title, description, status, priority, category, due_date, completion_notes, completion_photos, images } = body;

    // 输入验证
    const validationError = validate([
      validateRequired(title, '待办标题'),
      validateLength(title, '待办标题', 1, 100),
    ])
    if (validationError) return errorResponse(validationError, 400)

    // XSS检测
    if (hasXSS(title) || (description && hasXSS(description))) {
      return errorResponse('输入内容包含不安全字符', 400)
    }

    // 消毒输入数据
    const sanitized = sanitizeObject({ title, description, category, completion_notes }, ['images', 'completion_photos'])

    const result = await env.DB.prepare(`
      INSERT INTO todos (title, description, status, priority, category, due_date, completion_notes, completion_photos, images, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      sanitized.title,
      sanitized.description || '',
      status || 'pending',
      priority || 2,
      sanitized.category || 'general',
      due_date || null,
      sanitized.completion_notes || null,
      completion_photos ? JSON.stringify(completion_photos) : null,
      images ? JSON.stringify(images) : null
    ).run();

    const todoId = result.meta.last_row_id;
    const newTodo = await env.DB.prepare(`
      SELECT * FROM todos WHERE id = ?
    `).bind(todoId).first<Todo>();

    if (!newTodo) {
      return errorResponse('创建失败', 500);
    }

    return jsonResponse({
      ...newTodo,
      images: newTodo.images ? JSON.parse(newTodo.images) : [],
      completion_photos: newTodo.completion_photos ? JSON.parse(newTodo.completion_photos) : []
    });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}